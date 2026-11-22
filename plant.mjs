import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createPlant(host, select) {
  const scene = new T.Scene();
  scene.background = new T.Color('#102d38');
  const renderer = new T.WebGLRenderer({ antialias:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.domElement.setAttribute('aria-hidden','true');
  host.prepend(renderer.domElement);
  const camera = new T.OrthographicCamera(-11,11,6,-6,.1,150);
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enableDamping = true;
  controls.minZoom = .65;
  controls.maxZoom = 3.8;
  controls.maxPolarAngle = Math.PI * .49;
  function home() {
    camera.position.set(11,13,20);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    controls.target.set(0,.75,0);
    controls.update();
  }
  home();
  scene.add(new T.HemisphereLight('#d7efff','#375563',2.2));
  const light = new T.DirectionalLight('#ffffff',3);
  light.position.set(-4,9,5);
  scene.add(light);
  const fill = new T.DirectionalLight('#59d6ed',1.1);
  fill.position.set(5,4,-6);
  scene.add(fill);
  const mat = (color, metalness = .35) => new T.MeshStandardMaterial({color,metalness,roughness:.36});
  const steel = mat('#aebfc7');
  const dark = mat('#3b6175');
  const base = mat('#234451');
  const cyan = mat('#32b6e0');
  const amber = mat('#f39552');
  const teal = mat('#32b29a');
  const v = coords => new T.Vector3(...coords);
  function part(parent, geometry, material, x, y, z) {
    const mesh = new T.Mesh(geometry,material);
    mesh.position.set(x,y,z);
    parent.add(mesh);
    return mesh;
  }
  const box = (parent,sizes,material,x,y,z) => part(parent,new T.BoxGeometry(...sizes),material,x,y,z);
  const cylinder = (parent,r,h,material,x,y,z) => part(parent,new T.CylinderGeometry(r,r,h,32),material,x,y,z);
  const sphere = (parent,r,material,x,y,z) => part(parent,new T.SphereGeometry(r,18,12),material,x,y,z);
  box(scene,[19,.25,10],base,0,-.16,0);
  const grid = new T.GridHelper(19,38,'#4c6c78','#31515d');
  grid.scale.z = 10 / 19;
  grid.position.y = -.025;
  scene.add(grid);
  const equipment = {};
  const labels = new Map();
  function group(key,x,z,label,anchor = 2.5) {
    const g = new T.Group();
    g.position.set(x,0,z);
    g.userData.key = key;
    scene.add(g);
    equipment[key] = g;
    const el = document.createElement('span');
    el.className = 'scene-label';
    el.setAttribute('aria-hidden','true');
    host.append(el);
    labels.set(key,{el,label,point:v([x,anchor,z])});
    return g;
  }
  function tank(key,x,z,label) {
    const g = group(key,x,z,label,3.05);
    cylinder(g,.73,1.75,steel,0,1.48,0);
    sphere(g,.73,steel,0,2.35,0).scale.y = .44;
    sphere(g,.72,steel,0,.6,0).scale.y = .35;
    cylinder(g,.24,.14,dark,0,2.7,0);
    for (const dx of [-.46,.46]) for (const dz of [-.43,.43]) cylinder(g,.08,.63,dark,dx,.31,dz);
    cylinder(g,.13,1.12,steel,0,.75,.62).rotation.x = Math.PI/2;
    cylinder(g,.13,1.16,steel,0,1.8,-.58).rotation.x = Math.PI/2;
  }
  tank('tank',-7.7,1.75,'Tanque');
  tank('storage',-6.65,-2.6,'Almacén');
  const pump = group('pump',-5.45,2.85,'Bomba',1.35);
  box(pump,[1.45,.18,.9],dark,0,.09,0);
  cylinder(pump,.37,.78,teal,.07,.55,0).rotation.z = Math.PI/2;
  cylinder(pump,.33,.26,steel,-.48,.67,0).rotation.z = Math.PI/2;
  for (let rib = 0; rib < 5; rib++) cylinder(pump,.39,.035,dark,-.23 + .14*rib,.55,0).rotation.z = Math.PI/2;
  const regen = group('regen',-2.9,.6,'Placas',3.1);
  box(regen,[2.25,.16,1.9],dark,0,.11,0);
  const move = [];
  function endPlate(x, offset) {
    const plate = new T.Group();
    regen.add(plate);
    box(plate,[.19,2.25,1.75],teal,0,1.46,0).userData.component = 'frame';
    for (const y of [.9,1.95]) for (const z of [-.58,.58]) {
      const port = cylinder(plate,.19,.22,dark,Math.sign(x)*.15,y,z);
      port.rotation.z = Math.PI/2;
      port.userData.component = 'ports';
    }
    move.push({ object:plate,x,offset });
  }
  endPlate(-.69,-1.55);
  endPlate(.69,1.55);
  for (const y of [.4,2.66]) for (const z of [-.78,.78]) {
    const bolt = cylinder(regen,.045,4.6,steel,0,y,z);
    bolt.rotation.z = Math.PI/2;
    bolt.userData.component = 'bolts';
  }
  const channelFlows = [];
  for (let i = 0; i < 9; i++) {
    const plate = new T.Group();
    regen.add(plate);
    box(plate,[.046,1.93,1.42],i%2 ? steel : dark,0,1.46,0).userData.component = 'plates';
    for (const y of [.52,2.4]) {
      box(plate,[.064,.035,1.41],base,0,y,0).userData.component = 'gaskets';
    }
    for (const z of [-.69,.69]) {
      box(plate,[.064,1.86,.035],base,0,1.46,z).userData.component = 'gaskets';
    }
    for (let rib = 0; rib < 7; rib++) {
      const corrugation = box(plate,[.06,.035,.99],steel,0,.83 + rib*.19,0);
      corrugation.rotation.x = rib%2 ? .29 : -.29;
      corrugation.userData.component = 'plates';
    }
    const channel = sphere(regen,.078,i%2 ? cyan : amber,0,0,0);
    channel.userData.component = 'channels';
    channelFlows.push(channel);
    move.push({ object:plate,x:(i-4)*.128,offset:(i-4)*.36 });
  }
  function exchanger(key,x,z,label,accent) {
    const g = group(key,x,z,label,2.3);
    box(g,[1.48,.17,1.24],dark,0,.085,0);
    for (const dx of [-.43,.43]) cylinder(g,.08,.6,dark,dx,.34,0);
    cylinder(g,.48,1.43,steel,0,1.01,0).rotation.z = Math.PI/2;
    for (const dx of [-.7,.7]) cylinder(g,.49,.125,accent,dx,1.01,0).rotation.z = Math.PI/2;
    cylinder(g,.11,.68,accent,0,1.53,0);
    box(g,[.42,.26,.3],dark,0,1.9,0);
  }
  exchanger('heater',.4,2.85,'Calentador',amber);
  exchanger('cooler',-4.25,-2.6,'Enfriador',cyan);
  const hold = group('hold',3.4,2.5,'Retención',2.1);
  for (const x of [-.72,.78]) box(hold,[.12,1.22,1.74],dark,x,.63,0);
  const holdPoints = [[1.2,1.01,2.85],[2.25,1.01,2.85],[2.25,1.12,3.12],[4.43,1.12,3.12],
    [4.43,1.22,2.5],[2.35,1.22,2.5],[2.35,1.32,1.91],[4.6,1.32,1.91],[5.94,1.32,1.91]];
  const valve = group('valve',6.2,1.91,'Válvula',2.9);
  cylinder(valve,.23,1.08,dark,0,.55,0);
  sphere(valve,.36,steel,0,1.32,0);
  cylinder(valve,.19,.65,steel,0,1.72,0);
  cylinder(valve,.38,.29,amber,0,2.16,0);
  const colors = {cold:0x39b5f1,hot:0xff9c54,return:0xef6a87};
  const lines = [];
  function line(kind, route, points) {
    const curve = new T.CurvePath();
    for (let i = 1; i < points.length; i++) curve.add(new T.LineCurve3(v(points[i-1]),v(points[i])));
    const material = mat(colors[kind],.14);
    const pipe = new T.Group();
    scene.add(pipe);
    for (let i = 1; i < points.length; i++) {
      const a = v(points[i-1]), b = v(points[i]);
      const center = a.clone().lerp(b,.5);
      const tube = cylinder(pipe,.072,a.distanceTo(b),material,center.x,center.y,center.z);
      tube.quaternion.setFromUnitVectors(v([0,1,0]),b.sub(a).normalize());
      if (i < points.length - 1) sphere(pipe,.074,material,...points[i]);
    }
    const dots = Array.from({length:Math.max(2,Math.ceil(curve.getLength()/1.15))}, () =>
      sphere(scene,.106,new T.MeshBasicMaterial({color:colors[kind]}),0,0,0));
    lines.push({pipe,curve,length:curve.getLength(),route,dots,material,key:kind});
  }
  line('cold','always',[[-7.7,.75,2.9],[-6.15,.75,2.85]]);
  line('cold','regen',[[-4.7,.55,2.85],[-3.72,.55,2.85],[-3.72,.9,1.18]]);
  line('hot','regen',[[-2.07,.9,1.18],[-1.5,.9,1.18],[-1.5,1.01,2.85],[-.36,1.01,2.85]]);
  line('cold','base',[[-4.7,.55,2.85],[-4.7,.55,3.57],[-.36,.55,3.57],[-.36,1.01,2.85]]);
  line('hot','always',holdPoints);
  line('hot','outRegen',[[6.45,1.32,1.91],[7.15,1.32,1.91],[7.15,1.32,-.6],[-1.75,1.32,-.6],[-1.75,1.95,.02],[-2.08,1.95,.02]]);
  line('cold','outRegen',[[-3.72,1.95,.02],[-3.93,1.95,.02],[-3.93,1.01,-2.6],[-3.47,1.01,-2.6]]);
  line('hot','outBase',[[6.45,1.32,1.91],[7.6,1.32,1.91],[7.6,1.32,-2.6],[-3.47,1.01,-2.6]]);
  line('cold','product',[[-5.03,1.01,-2.6],[-5.57,1.01,-2.6],[-5.57,1.01,-1.45],[-6.65,1.8,-1.45]]);
  line('return','return',[[6.2,1.32,2.25],[6.2,1.32,4.2],[-8.76,1.32,4.2],[-8.76,1.32,.6],[-7.7,1.8,.6]]);

  let state = {running:false,conventional:false,diverted:false,exploded:false,flow:5000,points:[]};
  const visible = {
    always: () => true, regen: () => !state.conventional, base: () => state.conventional,
    outRegen: () => !state.conventional, outBase: () => state.conventional,
    product: () => true, return: () => true,
  };
  const active = route => route === 'return' ? state.diverted :
    !state.diverted || !['outRegen','outBase','product'].includes(route);
  function update(next) {
    state = next;
    regen.visible = !state.conventional;
    for (const [key,{el,label}] of labels) {
      const points = state.points.filter(point => point[0] === key);
      el.hidden = points.length === 0;
      const temps = points.map(point => point[2].toLocaleString('es-PE',{maximumFractionDigits:1}) + '°');
      el.textContent = label + ' · ' + temps.join(' / ');
    }
    for (const {pipe,route,material,key} of lines) {
      pipe.visible = visible[route]();
      material.color.setHex(active(route) ? colors[key] : 0x48616a);
    }
  }
  const ray = new T.Raycaster();
  let pressed;
  renderer.domElement.addEventListener('pointerdown',e => { pressed = [e.clientX,e.clientY]; });
  renderer.domElement.addEventListener('pointerup',e => {
    if (!pressed || Math.hypot(e.clientX-pressed[0],e.clientY-pressed[1]) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
    const hits = ray.intersectObjects(Object.values(equipment).filter(g => g.visible),true)
      .filter(hit => hit.object.visible);
    let object = hits[0]?.object;
    const component = object?.userData.component;
    while (object && !object.userData.key) object = object.parent;
    if (object) select(object.userData.key,component);
  });
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const horizontal = Math.max(10.35,6*h/w);
    const vertical = horizontal*h/w;
    Object.assign(camera,{left:-horizontal,right:horizontal,top:vertical,bottom:-vertical});
    camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);
  }
  new ResizeObserver(resize).observe(host);
  resize();
  let last = performance.now(), distance = 0, spread = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  renderer.setAnimationLoop(now => {
    const dt = Math.min(.05,(now-last)/1000);
    last = now;
    if (state.running && !reduced.matches) distance += dt * Math.min(8,Math.max(.3,state.flow/5000*2.5));
    spread += (Number(state.exploded)-spread) * (reduced.matches ? 1 : Math.min(1,dt*9));
    for (const {object,x,offset} of move) object.position.x = x + spread*offset;
    for (const [index,dot] of channelFlows.entries()) {
      const phase = (distance*.47+index*.19)%1;
      dot.visible = state.exploded && regen.visible && (index%2 === 1 || !state.diverted);
      dot.position.set((index-4)*(.128+spread*.36)+.07, index%2 ? .65+phase*1.6 : 2.25-phase*1.6,0);
    }
    for (const {pipe,curve,length,route,dots} of lines) {
      for (const [index,dot] of dots.entries()) {
        dot.visible = state.running && pipe.visible && active(route);
        if (dot.visible) dot.position.copy(curve.getPoint((distance/length+index/dots.length)%1));
      }
    }
    controls.update();
    renderer.render(scene,camera);
    for (const {el,point} of labels.values()) {
      const projected = point.clone().project(camera);
      el.style.left = (projected.x*.5+.5)*100 + '%';
      el.style.top = (.5-projected.y*.5)*100 + '%';
    }
  });
  return { update, home };
}
