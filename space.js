const host=document.getElementById('space');
let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionButton=document.getElementById('motion');
function motionLabel(){motionButton.innerHTML=`모션 ${motion?'켜짐':'꺼짐'} <span>↗</span>`;motionButton.setAttribute('aria-pressed',String(!motion));}
motionButton.onclick=()=>{motion=!motion;motionLabel();};motionLabel();
try {
  const THREE=await import('./vendor/three.module.js');
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(0,.4,11);
  scene.add(new THREE.AmbientLight(0x7d81c7,2));
  const light=new THREE.DirectionalLight(0xe5d7ff,4);light.position.set(-3,4,5);scene.add(light);
  const rim=new THREE.DirectionalLight(0x9fffde,2);rim.position.set(4,-1,-2);scene.add(rim);
  const system=new THREE.Group();system.rotation.z=-.3;scene.add(system);
  const material=new THREE.MeshStandardMaterial({color:0x9684cf,roughness:.78,metalness:.15});
  const planet=new THREE.Mesh(new THREE.SphereGeometry(1.43,64,48),material);system.add(planet);
  const ringMaterial=new THREE.MeshStandardMaterial({color:0x9d8bc6,side:THREE.DoubleSide,transparent:true,opacity:.6,roughness:.9});
  for(let i=0;i<5;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(1.85+i*.15,1.93+i*.15,128),ringMaterial);ring.rotation.x=Math.PI*.40;system.add(ring);}
  const orbit=new THREE.Group();scene.add(orbit);
  for(let i=0;i<3;i++){const points=[];for(let j=0;j<=160;j++){const t=j/160*Math.PI*2;points.push(new THREE.Vector3(Math.cos(t)*(3.1+i*.38),0,Math.sin(t)*(3.1+i*.38)));}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x748391,transparent:true,opacity:.13}));line.rotation.z=.22;line.rotation.x=.35;orbit.add(line);}
  const moon=new THREE.Mesh(new THREE.SphereGeometry(.17,24,16),new THREE.MeshStandardMaterial({color:0xd7fc87,roughness:.5}));scene.add(moon);
  const count=500,positions=new Float32Array(count*3);for(let i=0;i<positions.length;i++)positions[i]=(Math.random()-.5)*25;
  const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3)),new THREE.PointsMaterial({color:0xc2d3ed,size:.028,transparent:true,opacity:.65}));scene.add(stars);
  const particles=new Float32Array(180*3),directions=[];for(let i=0;i<180;i++){directions.push(new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize());}
  const burstMaterial=new THREE.PointsMaterial({color:0xd7fc87,size:.045,transparent:true,opacity:0});
  const burst=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(particles,3)),burstMaterial);scene.add(burst);
  let energy=0,targetScale=1,angle=0,dragging=false,lastX=0,lastY=0,targetX=0,targetY=0;
  host.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;host.setPointerCapture(e.pointerId);});
  host.addEventListener('pointermove',e=>{if(!dragging)return;targetY+=(e.clientX-lastX)*.006;targetX=Math.max(-.7,Math.min(.7,targetX+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY;});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>host.addEventListener(type,()=>dragging=false));
  window.addEventListener('orbit-value',e=>{const v=e.detail.value,h=((Math.abs(v)*.037)%1);material.color.setHSL(h,.34,.6);targetScale=.87+Math.min(Math.log10(Math.abs(v)+1),8)*.045;document.getElementById('planet-name').textContent='PLANET '+(v===0?'ZERO':String(v));document.getElementById('planet-description').textContent=v===0?'당신의 첫 번째 숫자를 기다리는 중':'이 숫자만의 색으로 빛나는 행성';if(e.detail.burst&&motion)energy=1;});
  function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
  let last=performance.now();
  renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(motion){angle+=dt*.22;system.rotation.y+=dt*.045;stars.rotation.y+=dt*.006;}system.rotation.x+=(targetX-system.rotation.x)*.06;system.rotation.y+=(targetY-system.rotation.y)*.025;system.position.y=motion?Math.sin(angle*1.7)*.1:0;system.scale.lerp(new THREE.Vector3(targetScale,targetScale,targetScale),.045);moon.position.set(Math.cos(angle)*3.25,Math.sin(angle)*.6,Math.sin(angle)*2);if(energy>0){energy=Math.max(0,energy-dt*.6);burstMaterial.opacity=motion?energy:0;const radius=1.5+(1-energy)*5;directions.forEach((d,i)=>{particles[i*3]=d.x*radius;particles[i*3+1]=d.y*radius;particles[i*3+2]=d.z*radius;});burst.geometry.attributes.position.needsUpdate=true;}renderer.render(scene,camera);});
  host.querySelector('.fallback-planet').remove();
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('scene-status').textContent='3D 연결이 끊겼어요. 새로고침하면 복구됩니다.';});
} catch(error){document.getElementById('scene-status').textContent='3D를 불러오지 못했어요. 계산기는 사용할 수 있어요.';motionButton.disabled=true;console.warn('3D unavailable:',error);}
