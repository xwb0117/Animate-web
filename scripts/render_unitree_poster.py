"""Render a transparent poster from a generated Unitree GLB using Blender.

blender -b -t 4 --python scripts/render_unitree_poster.py -- g1 MODEL.glb OUT.png
"""

import sys
import math
import bpy
from mathutils import Vector, Quaternion


kind, model_path, output_path = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=model_path)

if kind == "b1":
    for prefix in ("FR", "FL", "RR", "RL"):
        for suffix, angle in (("thigh", 0.8), ("calf", -1.5)):
            node = bpy.data.objects.get(f"joint:{prefix}_{suffix}_joint")
            if node:
                node.rotation_mode = "QUATERNION"
                node.rotation_quaternion = node.rotation_quaternion @ Quaternion((0, 1, 0), angle)

bpy.context.view_layer.update()
points = []
for obj in bpy.data.objects:
    if obj.type == "MESH":
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
minimum = Vector(tuple(min(point[i] for point in points) for i in range(3)))
maximum = Vector(tuple(max(point[i] for point in points) for i in range(3)))
center = (minimum + maximum) / 2
size = maximum - minimum

camera_data = bpy.data.cameras.new("Poster camera")
camera = bpy.data.objects.new("Poster camera", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = center + (Vector((2.8, -4.0, 2.1)) if kind == "g1" else Vector((2.9, -4.0, 2.0))) * max(size)
direction = center - camera.location
camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
camera_data.type = "ORTHO"
camera_data.ortho_scale = max(size.x, size.y, size.z) * (1.55 if kind == "g1" else 1.75)
bpy.context.scene.camera = camera

for name, offset, power, width in (
    ("Key", (2, -3, 4), 950, 4),
    ("Fill", (-3, -2, 2), 650, 4),
    ("Rim", (-1, 3, 4), 1100, 3),
):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = width
    light = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(light)
    light.location = center + Vector(offset) * max(size)
    light.rotation_euler = (center - light.location).to_track_quat("-Z", "Y").to_euler()

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.film_transparent = True
scene.render.resolution_x = 850
scene.render.resolution_y = 850
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = output_path
scene.world.use_nodes = True
scene.world.node_tree.nodes.get("Background").inputs[1].default_value = 0.8
bpy.ops.render.render(write_still=True)
