import * as THREE from 'three';
import { Sky } from './vendor/objects/Sky.js';
import { mergeGeometries } from './vendor/utils/BufferGeometryUtils.js';

// Repeatable aggregate textures; all pixels are generated locally.
export function surfaceTexture(kind,renderer){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');const data=ctx.createImageData(512,512);
  let seed=kind==='road'?1703:901;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const base=kind==='road'?[60,61,62]:[161,143,113];
  for(let i=0;i<data.data.length;i+=4){const grit=(random()-.5)*(kind==='road'?26:35);for(let c=0;c<3;c++)data.data[i+c]=base[c]+grit;data.data[i+3]=255;}
  ctx.putImageData(data,0,0);
  if(kind==='road'){
    ctx.strokeStyle='rgba(22,24,24,.38)';ctx.lineWidth=.8;
    for(let j=0;j<5;j++){let x=random()*512,y=random()*512;ctx.beginPath();ctx.moveTo(x,y);for(let k=0;k<8;k++){x+=(random()-.5)*30;y+=random()*25;ctx.lineTo(x,y);}ctx.stroke();}
  }else{
    for(let j=0;j<2600;j++){const x=random()*512,y=random()*512,r=.3+random()*1.4;ctx.fillStyle=random()>.5?'rgba(65,51,36,.16)':'rgba(228,211,177,.28)';ctx.beginPath();ctx.ellipse(x,y,r,r*.65,0,0,Math.PI*2);ctx.fill();}
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return map;
}

export function lighting(scene,renderer){
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
  scene.background=new THREE.Color('#c8d4d7');scene.fog=new THREE.Fog('#c5c5b7',95,310);
  scene.add(new THREE.HemisphereLight('#c0d9ed','#8b7254',1.15));
  const sky=new Sky();sky.scale.setScalar(450);scene.add(sky);
  const u=sky.material.uniforms;u.turbidity.value=3.6;u.rayleigh.value=1.65;u.mieCoefficient.value=.006;u.mieDirectionalG.value=.82;
  const direction=new THREE.Vector3(-.55,.52,.6).normalize();u.sunPosition.value.copy(direction);
  const envScene=new THREE.Scene();const envSky=sky.clone();envScene.add(envSky);
  const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(envScene,.04,.1,1000);scene.environment=environment.texture;scene.environmentIntensity=.85;pmrem.dispose();
  const sun=new THREE.DirectionalLight('#fff0d8',3.6);sun.position.copy(direction).multiplyScalar(90);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:10,far:180});sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;sun.shadow.radius=2;scene.add(sun,sun.target);
  return {update(position){sun.position.copy(position).addScaledVector(direction,90);sun.target.position.copy(position);}};
}

export function prepareModel(root){
  root.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;object.material.envMapIntensity=1;}});return root;
}

// Batch the stationary circuit before adding the animated car.
export function batchScenery(scene){
  scene.updateMatrixWorld(true);
  const groups=new Map();
  scene.traverse(object=>{
    if(!object.isMesh||Array.isArray(object.material)||!object.material.isMeshStandardMaterial)return;
    const signature=Object.keys(object.geometry.attributes).sort().join(',');
    const key=[object.material.uuid,signature,Boolean(object.geometry.index),object.castShadow,object.receiveShadow].join('|');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(object);
  });
  for(const objects of groups.values()){
    if(objects.length<2)continue;
    const geometries=objects.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));
    const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
    if(!geometry)continue;
    const merged=new THREE.Mesh(geometry,objects[0].material);merged.castShadow=objects[0].castShadow;merged.receiveShadow=objects[0].receiveShadow;merged.name='Static scenery';
    objects.forEach(o=>o.removeFromParent());scene.add(merged);
  }
}
