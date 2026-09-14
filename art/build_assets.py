"""Blender 4.5: blender --background --python art/build_assets.py
Creates original game assets and an editable .blend source. No external models.
Coordinates in helpers are Three.js coordinates: X right, Y up, Z forward.
"""
import bpy, math, random
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def p(v):return (v[0],-v[2],v[1])
def material(name,color,metal=0,rough=.5,coat=0,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough
    n.inputs['Coat Weight'].default_value=coat
    if emission:n.inputs['Emission Color'].default_value=(*color,1);n.inputs['Emission Strength'].default_value=emission
    return m
paint=material('Petrol metallic clearcoat',(.018,.115,.14),.72,.24,.85)
rubber=material('Tire rubber',(.014,.017,.02),0,.88)
trim=material('Black satin trim',(.018,.023,.028),.15,.36)
glass=material('Smoked reflective glass',(.027,.061,.083),.38,.12,.65)
alloy=material('Brushed aluminium',(.57,.62,.65),.9,.23)
darkalloy=material('Dark wheel pockets',(.055,.066,.074),.8,.3)
lamp=material('LED white',(.85,.94,1),.1,.18,0,3)
tail=material('LED red',(.7,.012,.008),.15,.2,0,2)
marker=material('Tire sidewall marker',(.67,.69,.62),0,.8)

def finish(obj,name,mat,bevel=0,smooth=True):
    obj.name=name;obj.data.materials.append(mat)
    if bevel:
        mod=obj.modifiers.new('Manufactured edge radii','BEVEL');mod.width=bevel;mod.segments=2
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
    for f in obj.data.polygons:f.use_smooth=smooth
    if bevel:
        mod=obj.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');mod.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj
def box(name,loc,size,mat,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p(loc));o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,bevel)
def mesh(name,verts,faces,mat,bevel=0):
    d=bpy.data.meshes.new(name);d.from_pydata([p(v) for v in verts],[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
    return finish(o,name,mat,bevel)
def beam(name,a,b,r,mat,vertices=12):
    av,bv=Vector(p(a)),Vector(p(b));delta=bv-av
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=delta.length,location=(av+bv)/2)
    o=bpy.context.object;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();return finish(o,name,mat,.006)
def cyl(name,loc,r,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32 if r>.03 else 12,radius=r,depth=depth,location=p(loc),rotation=(0,math.pi/2,0));return finish(bpy.context.object,name,mat,.004 if r>.03 else 0)
def torus(name,loc,major,minor,mat):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=10,location=p(loc),rotation=(0,math.pi/2,0),major_radius=major,minor_radius=minor)
    return finish(bpy.context.object,name,mat)
def export(name,objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=False)
def objects():return set(bpy.context.scene.objects)
def merge_materials(items):
    groups={}
    for o in items:groups.setdefault(o.data.materials[0].name,[]).append(o)
    result=set()
    for name,group in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in group:o.select_set(True)
        bpy.context.view_layer.objects.active=group[0]
        if len(group)>1:bpy.ops.object.join()
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        group[0].name=name;result.add(group[0])
    return result

# Continuous coachwork with carved wheel openings.
before=objects();verts=[]
sections=[(-2.22,.77,.48,.89),(-2.08,.93,.41,1.01),(-1.72,.99,.38,1.07),(-1.3,1.01,.37,1.1),(-.8,.96,.37,1.09),(0,.93,.37,1.03),(.7,.96,.37,1.04),(1.3,1.0,.39,1.02),(1.8,.96,.43,.92),(2.13,.88,.48,.82),(2.23,.72,.53,.74)]
for z,w,b,t in sections:
    verts.extend([(-w*.92,b,z),(-w,b+.14,z),(-w,t-.09,z),(-w*.88,t,z),(w*.88,t,z),(w,t-.09,z),(w,b+.14,z),(w*.92,b,z)])
faces=[tuple(range(7,-1,-1))]
for i in range(len(sections)-1):
    for j in range(8):faces.append((i*8+j,i*8+(j+1)%8,(i+1)*8+(j+1)%8,(i+1)*8+j))
faces.append(tuple(range((len(sections)-1)*8,len(sections)*8)))
shell=mesh('Sculpted coupe body',verts,faces,paint,.045)
for z in [-1.3,1.3]:
    cutter=cyl('wheel opening cutter',(0,.48,z),.51,2.5,trim)
    bpy.context.view_layer.objects.active=shell;mod=shell.modifiers.new('Wheel arch','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
box('Underbody',(0,.37,0),(1.6,.15,3.9),trim,.06)
box('Roof panel',(0,1.52,-.29),(1.47,.10,1.1),paint,.09)
# Sloped windscreen and rear glass, side windows, structural pillars.
mesh('Front windshield',[(-.75,1.49,.23),(.75,1.49,.23),(.84,1.07,.87),(-.84,1.07,.87)],[(0,1,2,3)],glass)
mesh('Rear windshield',[(-.73,1.48,-.84),(.73,1.48,-.84),(.87,1.1,-1.48),(-.87,1.1,-1.48)],[(0,1,2,3)],glass)
for side in [-1,1]:
    points=[(side*.75,1.48,.23),(side*.73,1.48,-.84),(side*.87,1.1,-1.46),(side*.91,1.07,.86)]
    mesh('Side glass',points,[(0,1,2,3)],glass)
    for a,b in [(points[0],points[3]),(points[1],points[2]),(points[0],points[1]),(points[2],points[3])]:beam('Window frame',a,b,.034,paint)
    beam('B pillar',(side*.752,1.49,-.36),(side*.913,1.08,-.45),.034,trim)
    box('Side sill',(side*.96,.43,0),(.09,.11,1.48),trim)
    box('Door handle',(side*.967,1.01,-.57),(.035,.035,.19),alloy,.012)
    box('Mirror housing',(side*1.03,1.16,.59),(.24,.13,.3),paint,.06)
    box('Mirror glass',(side*1.04,1.16,.445),(.19,.08,.016),alloy,.02)
    # Panel gaps follow the coupe door edge.
    beam('Door seam',(side*.953,.53,-.75),(side*.961,.99,-.75),.007,trim,6)
    for z in [-1.3,1.3]:
        points=[]
        for i in range(25):
            a=i/24*math.pi;points.append((side*1.009,.48+math.sin(a)*.513,z+math.cos(a)*.513))
        for a,b in zip(points,points[1:]):beam('Arch trim',a,b,.018,trim,6)
box('Front grille',(0,.62,2.18),(1.29,.23,.09),trim,.04)
for x in range(-7,8):box('Grille blades',(x*.074,.62,2.237),(.024,.18,.018),darkalloy,.004)
box('Front splitter',(0,.46,2.1),(1.82,.055,.24),trim,.02)
box('Rear diffuser',(0,.47,-2.13),(1.64,.13,.15),trim,.02)
for x in [-.65,-.32,0,.32,.65]:box('Diffuser fin',(x,.40,-2.15),(.03,.14,.28),trim,.004)
for side in [-1,1]:
    box('Headlamp enclosure',(side*.67,.83,1.99),(.47,.11,.2),trim,.035)
    box('Headlamp LED',(side*.67,.855,2.085),(.4,.029,.02),lamp,.008)
    box('Rear lamp enclosure',(side*.59,.91,-2.12),(.57,.13,.075),trim,.025)
    box('Rear LED',(side*.59,.925,-2.163),(.5,.037,.016),tail,.009)
    cyl('Exhaust rim',(side*.67,.48,-2.22),.075,.14,alloy).rotation_euler=(math.pi/2,0,0)
box('Rear light bridge',(0,.925,-2.208),(.61,.023,.012),tail,.005)
box('Rear number plate',(0,.69,-2.224),(.43,.11,.015),alloy,.005)
box('Rear lip spoiler',(0,1.087,-1.94),(1.72,.048,.16),trim,.018)
body_objects=merge_materials(objects()-before)
export('coupe-body.glb',body_objects)

# Wheel asset at its axle origin; Three.js adds steering and rolling parents.
before=objects()
tire=torus('Tire carcass',(0,0,0),.344,.106,rubber)
tire.scale.z=1.5
bpy.context.view_layer.objects.active=tire;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
cyl('Rim barrel',(0,0,0),.295,.245,darkalloy)
for side in [-1,1]:
    x=side*.145
    torus('Polished rim lip',(x,0,0),.28,.012,alloy)
    cyl('Brake disc',(side*.10,0,0),.232,.014,alloy)
    cyl('Wheel center',(side*.159,0,0),.069,.035,alloy)
    for i in range(5):
        a=i*math.tau/5
        for offset in [-.065,.065]:
            aa=a+offset;beam('Split alloy spoke',(x,math.cos(a)*.065,math.sin(a)*.065),(x,math.cos(aa)*.269,math.sin(aa)*.269),.018,alloy,8)
        cyl('Lug bolt',(side*.182,math.cos(a)*.043,math.sin(a)*.043),.009,.01,trim)
    for i in range(24):
        a=i*math.tau/24;cyl('Vent hole',(side*.111,math.cos(a)*.195,math.sin(a)*.195),.008,.016,trim)
    box('Sidewall timing mark',(side*.091,.375,0),(.012,.028,.06),marker,.004)
# Grooved tread blocks, placed around the entire tire.
for i in range(56):
    a=i*math.tau/56
    for side in [-1,1]:
        o=box('Tread block',(side*.054,math.cos(a)*.446,math.sin(a)*.446),(.075,.013,.029),rubber,0)
        o.rotation_euler.x=a
wheel_objects=merge_materials(objects()-before)
export('coupe-wheel.glb',wheel_objects)
for o in wheel_objects:o.hide_set(True);o.hide_render=True

# A weathered sandstone prop, reused by the game with shared geometry.
before=objects();random.seed(83)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1)
rock=bpy.context.object;rock.name='Weathered sandstone'
for v in rock.data.vertices:
    q=v.co;noise=1+.11*math.sin(q.x*9+q.y*4)+.065*math.sin(q.z*15-q.x*4);q*=noise;q.z*=.7
rockmat=material('Sandstone',(.32,.25,.17),0,.95);finish(rock,'Weathered sandstone',rockmat)
export('sandstone.glb',objects()-before)
rock.hide_set(True);rock.hide_render=True

# Editable Blender source: car plus four linked wheel instances.
for x in [-1,1]:
    for z in [-1.3,1.3]:
        for source in wheel_objects:
            o=source.copy();o.data=source.data;bpy.context.collection.objects.link(o);o.location+=Vector(p((x,.48,z)));o.hide_set(False);o.hide_render=False
bpy.ops.object.select_all(action='DESELECT')
for o in body_objects:o.select_set(True)
bpy.context.scene.world.color=(.25,.25,.25)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art'/'dust-coupe.blend'))
print('ASSETS_COMPLETE',flush=True)
