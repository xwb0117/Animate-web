import bpy
import os
import sys

args = sys.argv[sys.argv.index('--') + 1:]
output_path = os.path.abspath(args[0])

bpy.ops.object.select_all(action='DESELECT')
selected = set()

for obj in bpy.data.objects:
    has_armature = obj.type == 'MESH' and any(mod.type == 'ARMATURE' for mod in obj.modifiers)
    if obj.type == 'ARMATURE' or has_armature:
        selected.add(obj)
        parent = obj.parent
        while parent:
            selected.add(parent)
            parent = parent.parent

for obj in selected:
    obj.hide_viewport = False
    obj.hide_render = False
    obj.select_set(True)

meshes = [obj.name for obj in selected if obj.type == 'MESH']
print('EXPORT_ACTOR_OBJECTS', meshes)
if not meshes:
    raise RuntimeError('No skinned actor mesh was found in this blend file')

os.makedirs(os.path.dirname(output_path), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    use_selection=True,
    export_animations=True,
    export_cameras=False,
    export_lights=False,
    export_apply=False
)
print('EXPORTED', output_path)
