import { Entity, Layer, Texture, RenderTarget, StandardMaterial, Color, Vec2, PIXELFORMAT_RGBA8, FILTER_LINEAR, ADDRESS_CLAMP_TO_EDGE, CULLFACE_NONE } from 'playcanvas';
import { MIRROR } from './room.js';

export function createMirror(scene,character,room) {
  const {app}=scene;
  const fullLayer=new Layer({name:'MirrorCharacter'});
  const bodyLayer=new Layer({name:'FirstPersonBody'});
  const surfaceLayer=new Layer({name:'MirrorSurface'});
  app.scene.layers.push(fullLayer);app.scene.layers.push(bodyLayer);app.scene.layers.push(surfaceLayer);
  const worldId=app.scene.layers.getLayerByName('World').id;
  character.setLayers([fullLayer.id]);
  const body=character.addOverlaySplat([bodyLayer.id]);
  // Only the eye camera hides head/neck/hair. The mirror uses the complete,
  // unchanged splat with the SAME live armature, not a prerecorded image.
  const groups=new Uint8Array(body.numSplats);
  const {indices,weights}=body.splatWeights;const names=character.armature.rigBoneNames;
  for(let i=0;i<groups.length;i++) {
    let headWeight=0;
    for(let j=0;j<4;j++){const n=names[indices[i*4+j]]||'';if(n==='head'||n.startsWith('neck_')||n.startsWith('FACIAL_'))headWeight+=weights[i*4+j];}
    groups[i]=headWeight>.25?1:0;
  }
  body.setSplatGroups(groups,2);body.setVariantMask([1,0]);
  scene.cameraEntity.camera.layers=[worldId,bodyLayer.id,surfaceLayer.id];
  const texture=new Texture(app.graphicsDevice,{name:'live-mirror',width:768,height:1280,format:PIXELFORMAT_RGBA8,mipmaps:false,minFilter:FILTER_LINEAR,magFilter:FILTER_LINEAR,addressU:ADDRESS_CLAMP_TO_EDGE,addressV:ADDRESS_CLAMP_TO_EDGE});
  const target=new RenderTarget({colorBuffer:texture,depth:true});
  const camera=new Entity('mirror-camera',app);
  camera.addComponent('camera',{layers:[worldId,fullLayer.id],renderTarget:target,priority:-10,nearClip:.05,farClip:24,clearColor:new Color(.65,.68,.61)});
  app.root.addChild(camera);
  camera.setEulerAngles(0,180,0);
  let eye={x:0,y:1.69,z:1};
  // Off-axis projection through the physical mirror opening. The near plane
  // is placed just in front of the wall, avoiding wall geometry in reflection.
  camera.camera.calculateProjection=matrix=>{
    const d=Math.max(.15,eye.z-MIRROR.z),near=d+.035;
    const l=(eye.x-MIRROR.x-MIRROR.width/2)*near/d;
    const r=(eye.x-MIRROR.x+MIRROR.width/2)*near/d;
    const b=(MIRROR.y-MIRROR.height/2-eye.y)*near/d;
    const t=(MIRROR.y+MIRROR.height/2-eye.y)*near/d;
    matrix.setFrustum(l,r,b,t,near,24);
  };
  const material=new StandardMaterial();material.diffuse=new Color(0,0,0);material.emissive=new Color(1,1,1);material.emissiveMap=texture;material.emissiveMapTiling=new Vec2(-1,-1);material.emissiveMapOffset=new Vec2(1,1);material.useLighting=false;material.cull=CULLFACE_NONE;material.update();
  const plane=room.mesh('live-mirror','plane',[MIRROR.x,MIRROR.y,MIRROR.z],[MIRROR.width,1,MIRROR.height],material);
  plane.setEulerAngles(90,0,0);plane.render.layers=[surfaceLayer.id];plane.render.castShadows=false;
  return {body,camera,texture,groups,update(position){
    eye={x:position.x,y:position.y,z:position.z};
    const forward=scene.cameraEntity.forward,dx=MIRROR.x-eye.x,dy=MIRROR.y-eye.y,dz=MIRROR.z-eye.z;
    // A mirror behind the player cannot contribute pixels. Skip its second
    // rendering pass while looking away, but keep the shared animation alive.
    camera.enabled=forward.x*dx+forward.y*dy+forward.z*dz>0;
    camera.setPosition(eye.x,eye.y,2*MIRROR.z-eye.z);camera.camera.nearClip=Math.max(.15,eye.z-MIRROR.z)+.035;
  },dispose(){camera.destroy();plane.destroy();target.destroy();texture.destroy();material.destroy();}};
}
