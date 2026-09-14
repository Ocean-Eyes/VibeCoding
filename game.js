const $=id=>document.getElementById(id);
try {
const THREE=await import('./vendor/three.module.js');
const [{GLTFLoader},{lighting,surfaceTexture,prepareModel,batchScenery}]=await Promise.all([import('./vendor/loaders/GLTFLoader.js'),import('./visuals.js')]);
const manager=new THREE.LoadingManager();manager.onProgress=(_url,loaded,total)=>{$('overlay-text').textContent=`?? ?? ${loaded} / ${total}`;};const loader=new GLTFLoader(manager);
const [bodyAsset,wheelAsset,rockAsset]=await Promise.all(['coupe-body.glb','coupe-wheel.glb','sandstone.glb'].map(file=>loader.loadAsync('./assets/'+file)));
[bodyAsset,wheelAsset,rockAsset].forEach(asset=>prepareModel(asset.scene));
const renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.background=new THREE.Color('#d9e5df');scene.fog=new THREE.Fog('#d9e5df',100,280);
const camera=new THREE.PerspectiveCamera(53,1,.1,500);
const lightRig=lighting(scene,renderer);
const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
const sand=mat('#d5bd8b'),road=mat('#495352'),white=mat('#f2edcf'),red=mat('#bc624a'),green=mat('#71855b'),black=mat('#202b2d'),teal=mat('#278c7b',.35),glass=mat('#23484e',.2);
function box(w,h,d,m,x=0,y=0,z=0,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
const asphaltMap=surfaceTexture('road',renderer),sandMap=surfaceTexture('sand',renderer);
road.color.set('#ffffff');road.map=asphaltMap;road.bumpMap=asphaltMap;road.bumpScale=.025;road.roughness=.96;
sand.color.set('#ffffff');sand.map=sandMap;sand.bumpMap=sandMap;sand.bumpScale=.045;sandMap.repeat.set(190,190);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),sand);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const RX=62,RZ=43,WIDTH=14;
function ribbon(inner,outer,m,y){const pos=[],uv=[],indices=[];for(let i=0;i<=256;i++){const a=i/256*Math.PI*2;pos.push((RX+inner)*Math.cos(a),y,(RZ+inner)*Math.sin(a),(RX+outer)*Math.cos(a),y,(RZ+outer)*Math.sin(a));uv.push((RX+inner)*Math.cos(a)/12,(RZ+inner)*Math.sin(a)/12,(RX+outer)*Math.cos(a)/12,(RZ+outer)*Math.sin(a)/12);if(i<256){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;scene.add(mesh);}
ribbon(-WIDTH/2,WIDTH/2,road,.035);ribbon(-7.2,-6.9,white,.055);ribbon(6.9,7.2,white,.055);
for(let i=0;i<100;i++){const a=i/100*Math.PI*2;for(const offset of [-7.7,7.7]){const curb=box(.8,.11,2.6,i%2?white:red,(RX+offset)*Math.cos(a),.08,(RZ+offset)*Math.sin(a));curb.rotation.y=Math.atan2(-(RX+offset)*Math.sin(a),(RZ+offset)*Math.cos(a));}if(i%2===0){const stripe=box(.13,.015,1.5,white,RX*Math.cos(a),.06,RZ*Math.sin(a));stripe.rotation.y=Math.atan2(-RX*Math.sin(a),RZ*Math.cos(a));}}
// Start line across the road, near the eastern end of the circuit.
for(let x=0;x<14;x++)for(let z=0;z<2;z++)box(1,.025,.65,(x+z)%2?black:white,RX-6.5+x,.065,z*.65);
const gantry=mat('#e9dfc7');box(.45,7,.45,gantry,RX-9,3.5,0);box(.45,7,.45,gantry,RX+9,3.5,0);box(18.5,1.1,.5,black,RX,7,0);
function label(text,w=512,h=96){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#263a35';ctx.fillRect(0,0,w,h);ctx.fillStyle='#f0e8d2';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2);return new THREE.CanvasTexture(c);}
const sign=new THREE.Mesh(new THREE.PlaneGeometry(13,.9),new THREE.MeshBasicMaterial({map:label('DUST / DRIVE'),side:THREE.DoubleSide}));sign.position.set(RX,7,.27);scene.add(sign);
let seed=1234;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const obstacles=[];
const cactusMaterial=mat('#59654a');
function cactus(x,z,scale){const g=new THREE.Group();g.position.set(x,0,z);const m=cactusMaterial;function stem(ax,ay,bx,by,r){const a=new THREE.Vector3(ax,ay,0),b=new THREE.Vector3(bx,by,0),delta=b.clone().sub(a);const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.01,delta.length()-2*r),4,10),m);mesh.position.copy(a.add(b).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;g.add(mesh);}stem(0,0,0,3.5,.22);stem(0,1.9,.8,1.9,.15);stem(.8,1.85,.8,2.9,.15);stem(0,1.3,-.65,1.3,.13);stem(-.65,1.25,-.65,2,.13);g.scale.setScalar(scale);scene.add(g);obstacles.push({x,z,r:.8*scale});}
for(let i=0;i<105;i++){const a=random()*Math.PI*2,r=1.35+random()*1.5;const x=Math.cos(a)*RX*r,z=Math.sin(a)*RZ*r;if(i%3===0)cactus(x,z,.8+random());else{const rock=rockAsset.scene.clone(true);const size=1+random()*3;rock.scale.set(size,size*.65,size*.8);rock.position.set(x,size*.28,z);rock.rotation.set(random(),random()*6,random());rock.castShadow=true;scene.add(rock);obstacles.push({x,z,r:size*.85});}}
for(let i=0;i<18;i++){const a=i/18*Math.PI*2;const geometry=new THREE.ConeGeometry(26+random()*28,22+random()*35,32,7);const pos=geometry.attributes.position;for(let j=0;j<pos.count;j++){const x=pos.getX(j),y=pos.getY(j),z=pos.getZ(j);const noise=1+.12*Math.sin(x*.23+z*.17)+.08*Math.sin(y*.41+z*.21);pos.setXYZ(j,x*noise,y,z*noise);}geometry.computeVertexNormals();const mountain=new THREE.Mesh(geometry,mat(i%2?'#8c8170':'#9f927c'));mountain.position.set(Math.cos(a)*225,7,Math.sin(a)*200);mountain.rotation.y=random()*6;scene.add(mountain);}
// Infield structures and planting.
box(16,3.5,7,mat('#ded5bc'),0,1.75,-15);box(17,.4,8,mat('#727d73'),0,3.7,-15);for(let i=0;i<4;i++)box(2.4,1.6,.08,glass,-5.4+i*3.6,2,-11.45);box(6,.25,3,red,0,2.9,-9.9);for(let i=0;i<12;i++)cactus((random()-.5)*55,(random()-.5)*22,.5+random()*.7);
for(let i=0;i<9;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(.3,.9,12),red);cone.position.set(49,.45,-9-i*2);scene.add(cone);}
batchScenery(scene);
const modelBounds=new THREE.Box3().setFromObject(bodyAsset.scene).getSize(new THREE.Vector3()).toArray();
const car=new THREE.Group();scene.add(car);const body=new THREE.Group();body.add(bodyAsset.scene);car.add(body);
const wheels=[],front=[];
for(const x of [-1,1])for(const z of [-1.3,1.3]){
  const pivot=new THREE.Group();pivot.position.set(x,.48,z);car.add(pivot);
  const rolling=new THREE.Group();rolling.add(wheelAsset.scene.clone(true));pivot.add(rolling);
  wheels.push(rolling);if(z>0)front.push(pivot);
}
const WHEELBASE=2.6,MAX_STEER=THREE.MathUtils.degToRad(36);
const keys=new Set(),touch=new Set();let speed=0,heading=0,steer=0,paused=false,camMode=0,lap=1,lapTime=0,started=false,nextCheckpoint=1,best=null,noticeTime=5;let last=performance.now();
try{const saved=Number(localStorage.getItem('dust-best-v1'));if(saved>0&&Number.isFinite(saved))best=saved;}catch{}
function format(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`;}if(best)$('best').textContent=format(best);
function clearInputs(){keys.clear();touch.clear();document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('active'));}
function showNotice(text){$('notice').textContent=text;noticeTime=3;}
function setPause(value){paused=value;clearInputs();$('pause').setAttribute('aria-pressed',String(paused));$('overlay').hidden=!paused;$('overlay-title').textContent='일시정지';$('overlay-text').textContent='P 또는 계속하기를 누르세요.';$('resume').hidden=false;}
function reset(){car.position.set(60,.03,12);heading=-.25;speed=0;steer=0;lap=1;lapTime=0;started=false;nextCheckpoint=1;clearInputs();camera.position.set(62.2,4.3,3.5);showNotice('시계 방향으로 한 바퀴를 완주하세요');if(paused)setPause(false);}
$('reset').onclick=reset;$('camera').onclick=()=>{camMode=(camMode+1)%2;};$('pause').onclick=()=>setPause(!paused);$('resume').onclick=()=>setPause(false);
addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(!e.repeat){if(k==='p'||k==='escape')setPause(!paused);if(k==='r')reset();if(k==='c')camMode=(camMode+1)%2;}if(!paused)keys.add(k);});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{if(!paused)setPause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused)setPause(true);});
for(const b of document.querySelectorAll('[data-control]')){b.addEventListener('pointerdown',e=>{e.preventDefault();if(paused)return;b.setPointerCapture(e.pointerId);touch.add(b.dataset.control);b.classList.add('active');});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>{touch.delete(b.dataset.control);b.classList.remove('active');});}
function held(action,...codes){return touch.has(action)||codes.some(k=>keys.has(k));}
function physics(dt){const gas=held('gas','w','arrowup'),brake=held('brake','s','arrowdown'),handbrake=keys.has(' ');const steering=(held('left','a','arrowleft')?1:0)-(held('right','d','arrowright')?1:0);steer=THREE.MathUtils.damp(steer,steering,12,dt);const steeringAngle=steer*MAX_STEER/(1+(Math.abs(speed)/12)**2);const radial=Math.sqrt((car.position.x/RX)**2+(car.position.z/RZ)**2);const onRoad=Math.abs(radial-1)<.145;
if(gas)speed+= (speed<0?24:12)*dt;if(brake)speed-=(speed>0?30:8)*dt;const drag=(!gas&&!brake?1.6:.2)+(onRoad?.012:.07)*speed*speed+(handbrake?18:0);speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-drag*dt);speed=THREE.MathUtils.clamp(speed,-10,onRoad?43:18);if(Math.abs(speed)<.04)speed=0;
heading+=speed*Math.tan(steeringAngle)/WHEELBASE*(handbrake?1.35:1)*dt;const previous=car.position.clone();car.position.x+=Math.sin(heading)*speed*dt;car.position.z+=Math.cos(heading)*speed*dt;
for(const obstacle of obstacles){const dx=car.position.x-obstacle.x,dz=car.position.z-obstacle.z;if(dx*dx+dz*dz<(obstacle.r+1.1)**2){car.position.copy(previous);speed*=-.25;break;}}
if(Math.abs(car.position.x)>190||Math.abs(car.position.z)>160){car.position.copy(previous);speed*=-.2;}
car.rotation.y=heading;body.rotation.z=THREE.MathUtils.damp(body.rotation.z,-steer*speed*.002,5,dt);front.forEach(w=>w.rotation.y=steeringAngle);wheels.forEach(w=>w.rotation.x+=speed*dt/.45);
if(Math.abs(speed)>.2)started=true;if(started)lapTime+=dt;
const angle=(Math.atan2(car.position.z/RZ,car.position.x/RX)+Math.PI*2)%(Math.PI*2);const target=nextCheckpoint%4*Math.PI/2;const delta=Math.atan2(Math.sin(angle-target),Math.cos(angle-target));const forward=Math.sin(heading)*(-Math.sin(angle))+Math.cos(heading)*Math.cos(angle);
if(onRoad&&Math.abs(delta)<.14&&forward>.3&&speed>1){nextCheckpoint++;if(nextCheckpoint===5){if(!best||lapTime<best){best=lapTime;$('best').textContent=format(best);try{localStorage.setItem('dust-best-v1',String(best));}catch{}}showNotice(`LAP ${lap} · ${format(lapTime)}`);lap++;lapTime=0;nextCheckpoint=1;}}
}
const cameraTarget=new THREE.Vector3(),lookTarget=new THREE.Vector3();reset();$('overlay').hidden=true;
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;if(!paused){for(let i=0;i<3;i++)physics(dt/3);noticeTime=Math.max(0,noticeTime-dt);$('notice').style.opacity=noticeTime>0?'1':'0';}if(camMode===0){cameraTarget.set(car.position.x-Math.sin(heading)*8.6,3.8,car.position.z-Math.cos(heading)*8.6);lookTarget.set(car.position.x+Math.sin(heading)*5,1.1,car.position.z+Math.cos(heading)*5);}else{cameraTarget.set(car.position.x+1,35,car.position.z-22);lookTarget.copy(car.position);}camera.position.lerp(cameraTarget,1-Math.exp(-5*dt));camera.lookAt(lookTarget);$('speed').textContent=String(Math.round(Math.abs(speed)*3.6));$('speed-bar').style.width=`${Math.abs(speed)/43*100}%`;$('gear').firstChild.textContent=speed<-.1?'R ':speed>.1?'D ':'N ';$('lap').textContent=String(lap).padStart(2,'0');$('time').textContent=format(lapTime);lightRig.update(car.position);renderer.render(scene,camera);});
$('scene').addEventListener('webglcontextlost',e=>{e.preventDefault();setPause(true);$('overlay-title').textContent='3D 연결이 끊겼습니다';$('overlay-text').textContent='페이지를 새로고침해주세요.';$('resume').hidden=true;});
// Read-only diagnostic snapshot for browser checks.
window.driveState=()=>({speed,heading,x:car.position.x,z:car.position.z,paused,lap,lapTime,camMode,nextCheckpoint,steer,wheelAngle:front[0].rotation.y,wheelRoll:wheels[0].rotation.x,modelSource:'Blender 4.5',modelBounds,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
}catch(error){$('overlay').hidden=false;$('overlay-title').textContent='3D를 실행할 수 없습니다';$('overlay-text').textContent='최신 Chrome 또는 Edge에서 하드웨어 가속을 켜고 다시 접속해주세요.';console.error(error);}
