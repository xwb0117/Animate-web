"""Convert the official Unitree ROS G1/B1 URDF visuals to rigged browser GLBs.

Usage:
    PYTHONPATH=/path/to/pycollada python scripts/build_unitree_models.py \
      --source /path/to/unitree_ros --output public/unitree

Requires trimesh and pycollada. The conversion reads visual meshes and URDF
joint transforms/limits; it does not simulate dynamics or motor controllers.
"""

import argparse
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
import trimesh


MODELS = {
    "g1": "robots/g1_description/g1_29dof_mode_15.urdf",
    "b1": "robots/b1_description/xacro/b1.urdf",
}


def values(text, default):
    return [float(v) for v in (text or default).split()]


def transform(origin):
    if origin is None:
        return np.eye(4)
    xyz = values(origin.get("xyz"), "0 0 0")
    roll, pitch, yaw = values(origin.get("rpy"), "0 0 0")
    matrix = trimesh.transformations.euler_matrix(roll, pitch, yaw, axes="sxyz")
    matrix[:3, 3] = xyz
    return matrix


def material_colors(root):
    colors = {}
    for node in root.findall("material"):
        color = node.find("color")
        if color is not None:
            colors[node.get("name")] = values(color.get("rgba"), "0.7 0.7 0.7 1")
    return colors


def mesh_from_visual(visual, urdf_dir, package_dir, cache, colors):
    geometry = visual.find("geometry")
    if geometry is None:
        return None, None
    mesh_node = geometry.find("mesh")
    if mesh_node is not None:
        filename = mesh_node.get("filename")
        name = filename.split("/")[-1]
        mesh_path = (urdf_dir / filename) if not filename.startswith("package://") else package_dir / "meshes" / name
        if not mesh_path.is_file():
            mesh_path = package_dir / "meshes" / name
        if not mesh_path.is_file():
            raise FileNotFoundError(mesh_path)
        if mesh_path not in cache:
            loaded = trimesh.load(mesh_path, force="scene")
            meshes = loaded.dump(concatenate=False)
            if not meshes:
                raise ValueError(f"No visual geometry in {mesh_path}")
            cache[mesh_path] = meshes
        shapes = cache[mesh_path]
        scale = values(mesh_node.get("scale"), "1 1 1")
        scale_matrix = np.diag([*scale, 1])
        visual_matrix = transform(visual.find("origin")) @ scale_matrix
    elif geometry.find("box") is not None:
        shapes = [trimesh.creation.box(extents=values(geometry.find("box").get("size"), "1 1 1"))]
        visual_matrix = transform(visual.find("origin"))
    elif geometry.find("cylinder") is not None:
        cylinder = geometry.find("cylinder")
        shapes = [trimesh.creation.cylinder(radius=float(cylinder.get("radius")), height=float(cylinder.get("length")), sections=20)]
        visual_matrix = transform(visual.find("origin"))
    elif geometry.find("sphere") is not None:
        shapes = [trimesh.creation.icosphere(subdivisions=2, radius=float(geometry.find("sphere").get("radius")))]
        visual_matrix = transform(visual.find("origin"))
    else:
        return None, None

    material = visual.find("material")
    color = colors.get(material.get("name"), None) if material is not None else None
    if material is not None and material.find("color") is not None:
        color = values(material.find("color").get("rgba"), "0.7 0.7 0.7 1")
    color = color or [0.7, 0.7, 0.7, 1]
    color_key = tuple(int(max(0, min(1, value)) * 255) for value in color)
    return shapes, visual_matrix, color_key


def convert(kind, urdf_path, output_dir):
    root = ET.parse(urdf_path).getroot()
    links = {link.get("name"): link for link in root.findall("link")}
    joints = root.findall("joint")
    children = {joint.find("child").get("link") for joint in joints if joint.find("child") is not None}
    roots = [name for name in links if name not in children]
    if len(roots) != 1:
        raise ValueError(f"Expected one URDF root link, got {roots}")

    scene = trimesh.Scene(base_frame="world")
    # ROS URDF meshes are Z-up; PartNet's cabinet geometry is already Y-up.
    # The PartNet file adds a fixed root-frame conversion. Undo that conversion
    # for display while preserving all internal movable joint transforms.
    if kind == "cabinet":
        fixed_root = next(j for j in joints if j.get("name") == "joint_6")
        root_matrix = np.linalg.inv(transform(fixed_root.find("origin")))
    else:
        root_matrix = trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0])
    scene.graph.update(frame_to=f"link:{roots[0]}", frame_from="world", matrix=root_matrix)
    metadata = {"robot": kind, "source": str(urdf_path.name), "root_link": roots[0], "joints": {}}
    outgoing = {}
    for joint in joints:
        parent = joint.find("parent").get("link")
        outgoing.setdefault(parent, []).append(joint)

    def add_joint_tree(parent_link):
        for joint in outgoing.get(parent_link, []):
            name = joint.get("name")
            child_link = joint.find("child").get("link")
            scene.graph.update(frame_to=f"joint:{name}", frame_from=f"link:{parent_link}", matrix=transform(joint.find("origin")))
            scene.graph.update(frame_to=f"link:{child_link}", frame_from=f"joint:{name}", matrix=np.eye(4))
            joint_type = joint.get("type")
            if joint_type in {"revolute", "continuous", "prismatic"}:
                axis = values(joint.find("axis").get("xyz") if joint.find("axis") is not None else None, "1 0 0")
                limit = joint.find("limit")
                lower = float(limit.get("lower", "-3.14159")) if limit is not None else -math.pi
                upper = float(limit.get("upper", "3.14159")) if limit is not None else math.pi
                metadata["joints"][name] = {"type": joint_type, "parent": parent_link, "child": child_link, "axis": axis, "limit": [lower, upper]}
            add_joint_tree(child_link)

    add_joint_tree(roots[0])
    colors = material_colors(root)
    cache = {}
    package_dir = urdf_path.parent if (urdf_path.parent / "meshes").is_dir() else urdf_path.parent.parent
    for link_name, link in links.items():
        for index, visual in enumerate(link.findall("visual")):
            item = mesh_from_visual(visual, urdf_path.parent, package_dir, cache, colors)
            if item[0] is None:
                continue
            shapes, matrix, color = item
            for piece_index, shape in enumerate(shapes):
                geom_name = f"visual:{link_name}:{index}:{piece_index}"
                mesh = shape.copy()
                if mesh.visual.kind != "texture" or getattr(mesh.visual.material, "image", None) is None:
                    mesh.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(baseColorFactor=color, metallicFactor=0, roughnessFactor=0.7))
                scene.geometry[geom_name] = mesh
                scene.graph.update(frame_to=geom_name, frame_from=f"link:{link_name}", matrix=matrix, geometry=geom_name)

    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / "model.glb"
    model_path.write_bytes(scene.export(file_type="glb"))
    (output_dir / "joints.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{kind}: {len(metadata['joints'])} joints, {len(scene.geometry)} visuals, {len(model_path.read_bytes()) / 1e6:.1f} MB -> {model_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True, help="unitreerobotics/unitree_ros checkout")
    parser.add_argument("--output", type=Path, required=True, help="output directory")
    parser.add_argument("--cabinet-urdf", type=Path, help="PartNet-Mobility 40417 mobility.urdf")
    args = parser.parse_args()
    for kind, rel in MODELS.items():
        convert(kind, args.source / rel, args.output / kind)
    if args.cabinet_urdf:
        convert("cabinet", args.cabinet_urdf, args.output / "cabinet")


if __name__ == "__main__":
    main()
