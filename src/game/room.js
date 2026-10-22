import { Entity, StandardMaterial, Color, Texture, Vec2, ADDRESS_REPEAT } from 'playcanvas';

export const MIRROR = { x: 0, y: 1.26, z: -2.86, width: 1.45, height: 2.35 };
export const TARGETS = {
  mirror: { x:0, y:1.3, z:-2.65, radius:1.9, label:'전신 거울' },
  keys: { x:-2.65, y:.86, z:-.65, radius:1.55, label:'열쇠 챙기기' },
  door: { x:1.7, y:1.4, z:3.65, radius:1.45, label:'현관문 열기' },
};

export function buildRoom(scene) {
  const {app}=scene;
  const colliders=[];
  const owned=[];
  function mat(hex, roughness=.8, emissive=0) {
    const m=new StandardMaterial(); m.diffuse=new Color().fromString(hex);m.useMetalness=true;m.metalness=0;m.shininess=(1-roughness)*80;
    if(emissive) {m.emissive=m.diffuse.clone();m.emissiveIntensity=emissive;}
    m.update();owned.push(m);return m;
  }
  const materials={
    wall:mat('#d9d4c7'),accent:mat('#66766b'),trim:mat('#e7e0d0'),wood:mat('#aa7952'),darkwood:mat('#533f30'),
    cream:mat('#e5dfcf'),olive:mat('#7e8977'),green:mat('#3f5843'),gold:mat('#b9995e',.25),black:mat('#292d2a'),
    paper:mat('#f0eadc'),terra:mat('#ae7460'),glass:mat('#b4c8c4',.5,.5),sky:mat('#d2ded4',1,.65),
  };
  function mesh(name,type,pos,size,material,parent=app.root) {
    const e=new Entity(name,app);e.addComponent('render',{type,material,castShadows:true,receiveShadows:true});
    parent.addChild(e);e.setLocalPosition(...pos);e.setLocalScale(...size);return e;
  }
  const box=(name,pos,size,m,parent)=>mesh(name,'box',pos,size,m,parent);
  const sphere=(name,pos,size,m,parent)=>mesh(name,'sphere',pos,size,m,parent);
  const cylinder=(name,pos,size,m,parent)=>mesh(name,'cylinder',pos,size,m,parent);
  const block=(x,z,w,d)=>colliders.push({minX:x-w/2-.25,maxX:x+w/2+.25,minZ:z-d/2-.25,maxZ:z+d/2+.25});
  // Locally authored plank texture: deterministic grain, no network dependencies.
  const tc=document.createElement('canvas');tc.width=512;tc.height=512;const ctx=tc.getContext('2d');
  ctx.fillStyle='#b99470';ctx.fillRect(0,0,512,512);let seed=7421;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<1100;i++){ctx.strokeStyle=`rgba(76,47,25,${rand()*.07})`;ctx.beginPath();const y=rand()*512;ctx.moveTo(0,y);ctx.bezierCurveTo(150,y+rand()*4,330,y-rand()*4,512,y);ctx.stroke();}
  for(let i=0;i<8;i++){const y=i*64;ctx.fillStyle=i%2?'#ffffff06':'#35291e08';ctx.fillRect(0,y,512,64);ctx.fillStyle='#53423040';ctx.fillRect(0,y,512,1);ctx.fillRect((i%3)*170,y,1,64);}
  const floorTex=new Texture(app.graphicsDevice,{mipmaps:true,addressU:ADDRESS_REPEAT,addressV:ADDRESS_REPEAT});floorTex.setSource(tc);owned.push(floorTex);
  const floor=mat('#ffffff');floor.diffuseMap=floorTex;floor.diffuseMapTiling=new Vec2(2,2);floor.update();
  box('oak-floor',[0,-.08,.5],[8,.16,7],floor);
  box('mirror-wall',[0,1.55,-3.04],[8,.1+3, .15],materials.accent);
  box('entry-wall',[0,1.55,4.04],[8,3.1,.15],materials.wall);
  box('right-wall',[4.04,1.55,.5],[.15,3.1,7],materials.wall);
  // Window opening on the left; the light panel remains behind the frame.
  box('window-sill-wall',[-4.04,.43,.5],[.15,.86,7],materials.wall);
  box('window-top-wall',[-4.04,2.85,.5],[.15,.5,7],materials.wall);
  for(const z of [-2.5,3.5])box('window-side-wall',[-4.04,1.7,z],[.15,1.8,1],materials.wall);
  box('daylight',[-4.15,1.73,.5],[.05,1.8,5.2],materials.sky);
  box('window-sill',[-3.88,.91,.5],[.38,.12,5.1],materials.trim);
  for(const z of [-2,.5,3])box('window-frame',[-3.95,1.75,z],[.13,1.72,.055],materials.trim);
  box('window-crossbar',[-3.95,1.72,.5],[.13,.055,5],materials.trim);
  box('ceiling',[0,3.15,.5],[8,.15,7],materials.cream).render.castShadows=false;
  for(const z of [-2.96,3.96])box('skirting',[0,.08,z],[8,.16,.035],materials.trim);
  for(const x of [-3.96,3.96])box('skirting',[x,.08,.5],[.035,.16,7],materials.trim);
  // Mirror frame and shallow wooden ledge.
  for(const x of [-.79,.79])box('mirror-frame',[x,1.26,-2.92],[.09,2.51,.09],materials.darkwood);
  for(const y of [.01,2.51])box('mirror-frame',[0,y,-2.92],[1.67,.09,.09],materials.darkwood);
  box('mirror-ledge',[0,.045,-2.78],[1.8,.07,.35],materials.wood);
  block(0,-2.96,1.75,.2);
  // Desk beside the window, with actual small interactable keys.
  box('desk-top',[-2.7,.78,-.8],[1.75,.075,.85],materials.wood);
  for(const x of [-3.42,-1.98])for(const z of [-1.1,-.5])box('desk-leg',[x,.37,z],[.065,.74,.065],materials.darkwood);
  block(-2.7,-.8,1.75,.85);
  const book=box('journal',[-3,.84,-.9],[.33,.045,.43],materials.olive);book.setEulerAngles(0,-12,0);
  box('journal-pages',[-3,.845,-.9],[.315,.026,.415],materials.paper).setEulerAngles(0,-12,0);
  cylinder('ceramic-vase',[-3.25,.99,-1.02],[.15,.36,.15],materials.cream);
  for(let i=0;i<4;i++){const stem=cylinder('twig',[-3.25+(i-1.5)*.025,1.29,-1.02],[.009,.4,.009],materials.green);stem.setEulerAngles(0,0,(i-1.5)*15);sphere('leaf',[-3.25+(i-1.5)*.075,1.44,-1.02],[.1,.04,.055],materials.green).setEulerAngles(0,0,30+i*20);}
  const keys=new Entity('keys',app);app.root.addChild(keys);keys.setPosition(-2.47,.84,-.62);
  const ring=mesh('key-ring','torus',[0,0,0],[.065,.065,.065],materials.gold,keys);
  ring.setEulerAngles(0,0,0);
  for(const x of [-.025,.025]){box('key-shaft',[x,0,.055],[.012,.012,.085],materials.gold,keys);box('key-tooth',[x+.01,0,.08],[.025,.012,.015],materials.gold,keys);}
  cylinder('key-tray',[-2.47,.82,-.62],[.27,.015,.22],materials.terra);
  // Low sofa, cushions and a reading lamp along the right wall.
  box('sofa-base',[2.92,.28,.4],[1.6,.35,2.25],materials.olive);
  box('sofa-back',[3.6,.65,.4],[.27,.95,2.25],materials.olive);
  for(const z of [-.66,1.46])box('sofa-arm',[2.9,.56,z],[1.6,.65,.22],materials.olive);
  for(const z of [-.12,.92])box('seat-cushion',[2.78,.49,z],[1.23,.18,.94],materials.cream);
  sphere('pillow',[3.33,.83,-.05],[.3,.65,.65],materials.terra).setEulerAngles(0,0,-12);
  sphere('pillow',[3.33,.8,.82],[.3,.57,.6],materials.cream).setEulerAngles(0,0,-12);
  for(const x of [2.3,3.55])for(const z of [-.45,1.25])cylinder('sofa-foot',[x,.1,z],[.09,.2,.09],materials.darkwood);
  block(2.95,.4,1.7,2.3);
  cylinder('lamp-base',[3.25,.035,2.35],[.5,.07,.5],materials.black);
  cylinder('lamp-stem',[3.25,.8,2.35],[.035,1.6,.035],materials.gold);
  cylinder('linen-lampshade',[3.25,1.65,2.35],[.6,.42,.6],materials.cream);
  block(3.25,2.35,.45,.45);
  // Rug and reading table do not obstruct the central path.
  const rug=box('woven-rug',[.1,.008,.55],[2.1,.012,2.7],mat('#b7b4a0'));
  for(const x of [-.9,1.1])box('rug-border',[x,.016,.55],[.025,.006,2.55],materials.cream);
  for(const z of [-.72,1.82])box('rug-border',[.1,.016,z],[2,.006,.025],materials.cream);
  cylinder('side-table',[2.42,.61,2.5],[.63,.07,.63],materials.wood);
  cylinder('table-leg',[2.42,.31,2.5],[.1,.58,.1],materials.darkwood);
  cylinder('table-base',[2.42,.035,2.5],[.4,.05,.4],materials.darkwood);
  block(2.42,2.5,.65,.65);
  cylinder('cup',[2.42,.75,2.5],[.12,.2,.12],materials.cream);
  cylinder('coffee',[2.42,.852,2.5],[.102,.005,.102],materials.darkwood);
  // Plant and framed artwork make orientation landmarks.
  cylinder('plant-pot',[-2.85,.22,2.7],[.55,.44,.55],materials.terra);block(-2.85,2.7,.6,.6);
  for(let i=0;i<7;i++){const a=i*2.4;const x=-2.85+Math.sin(a)*.21,z=2.7+Math.cos(a)*.2;const stem=cylinder('plant-stem',[x,.73,z],[.012,1.05,.012],materials.green);stem.setEulerAngles(Math.sin(a)*15,0,Math.cos(a)*16);sphere('plant-leaf',[x+Math.sin(a)*.16,1.03+(i%3)*.12,z+Math.cos(a)*.15],[.27,.08,.45],i%2?materials.green:materials.olive).setEulerAngles(15,i*137,20);}
  box('art-frame',[2.55,1.95,-2.94],[1.23,1.05,.055],materials.darkwood);
  box('art-paper',[2.55,1.95,-2.9],[1.13,.95,.015],materials.paper);
  sphere('art-circle',[2.39,2.12,-2.88],[.44,.44,.012],materials.terra);
  box('art-stripe',[2.76,1.77,-2.865],[.35,.5,.012],materials.olive);
  // The exit remains closed until the playthrough is complete.
  box('door-frame',[1.7,1.17,3.94],[1.22,2.34,.13],materials.darkwood);
  const door=box('entry-door',[1.7,1.12,3.85],[1.08,2.23,.08],materials.wood);
  for(const y of [.66,1.68])box('door-panel',[1.7,y,3.797],[.85,.78,.025],materials.darkwood);
  box('door-handle',[1.31,1.02,3.74],[.18,.035,.045],materials.gold);
  box('entry-mat',[1.7,.012,3.18],[1.3,.02,.65],materials.olive);
  const sun=new Entity('afternoon-light',app);sun.addComponent('light',{type:'directional',color:new Color(1,.93,.83),intensity:.95,castShadows:true,shadowResolution:2048,shadowDistance:16,normalOffsetBias:.035,shadowBias:.2});sun.setEulerAngles(48,-65,0);app.root.addChild(sun);
  app.scene.ambientLight=new Color(.85,.87,.82);
  function allowed(x,z){return x>=-3.65&&x<=3.65&&z>=-2.5&&z<=3.55&&!colliders.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ);}
  return {keys,door,mesh,materials,allowed,colliders,dispose(){for(const r of owned)r.destroy();}};
}
