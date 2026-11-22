/* SHAX Vault regression tests with a mocked ExtendScript host.
   These are logic tests, not a substitute for opening After Effects on Mac/Windows. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../jsx/host.jsx'), 'utf8');
let passes = 0;
function test(name, run) {
  try { run(); console.log('PASS:', name); passes++; }
  catch(e) { console.error('FAIL:',name, e.stack); process.exitCode=1; }
}
function buildContext(extra={}) {
  class File {constructor(name){this.fsName=String(name);this.name=path.posix.basename(this.fsName);this.exists=false;}}
  class Folder {constructor(name){this.fsName=String(name);this.name=path.posix.basename(this.fsName);this.exists=true;} create(){this.exists=true;return true;}}
  class CompItem {constructor(name,duration=10){this.id=1;this.name=name;this.duration=duration;this.time=0;this.frameDuration=.04;this.numLayers=0;this.layers={add:()=>({})};} openInViewer(){} }
  class FootageItem {constructor(name,file){this.name=name;this.file=file;this.comment='';} replace(file){this.file=file;this.replaced=true;} replaceWithSequence(file){this.file=file;this.replaced=true;}}
  class FolderItem {}
  const context={File,Folder,CompItem,FootageItem,FolderItem,ImportOptions:class{},ImportAsType:{PROJECT:1},CloseOptions:{DO_NOT_SAVE_CHANGES:2},PropertyType:{PROPERTY:10},isFinite,JSON,Date,Math,Number,String,RegExp,Error,Array,Object,console,
    app:{beginUndoGroup(){},endUndoGroup(){},project:{activeItem:null,numItems:0,rootFolder:{}}},...extra};
  vm.createContext(context);vm.runInContext(source,context,{filename:'host.jsx'});return context;
}

test('Apply requires an active destination comp and does not silently import',()=>{
  const c=buildContext();c.shax_assetMetaById=()=>({id:'x',_folder:{fsName:'/vault'},duration:10});
  let imports=0;c.shax_assetImportPack=()=>{imports++;throw Error('should not import')};
  const result=c.shax_applyAssetPack('x','true');
  assert.match(result,/ERROR.*Open the destination composition/);
  assert.equal(imports,0);
});

test('Apply aligns trimmed source motion to the destination playhead',()=>{
  const c=buildContext();const comp=new c.CompItem('New Project',20);comp.id=2;comp.time=6;
  const inserted={};comp.layers={add:()=>inserted};comp.numLayers=1;comp.layer=()=>({selected:false});
  c.app.project.activeItem=comp;
  const old=new c.CompItem('Character',10);old.id=3;
  c.shax_assetMetaById=()=>({id:'pack',compName:'Character',name:'Walking Character',contentStart:4,contentEnd:9,_folder:{fsName:'/vault'}});
  c.shax_assetImportPack=()=>({root:{},comp:old,items:3});
  const result=c.shax_applyAssetPack('pack','true');
  assert.match(result,/OK~~RK_FIELD~~INSERTED/);
  assert.equal(inserted.startTime,2);
  assert.equal(inserted.inPoint,6);
  assert.equal(inserted.outPoint,11);
  assert.equal(inserted.name,'Walking Character');
  assert.equal(inserted.selected,true);
});

test('Apply warns when playhead at end of composition',()=>{
  const c=buildContext();const comp=new c.CompItem('End',10);comp.time=9.99;c.app.project.activeItem=comp;
  c.shax_assetMetaById=()=>({id:'pack',_folder:{fsName:'/vault'}});
  let imported=false;c.shax_assetImportPack=()=>{imported=true};
  const result=c.shax_applyAssetPack('pack','true');
  assert.match(result,/ERROR.*Move the playhead earlier/);
  assert.equal(imported,false);
});

test('Relink uses the resource token instead of matching potentially duplicated filenames',()=>{
  const c=buildContext();
  const media=new c.FootageItem('character.png',new c.File('/old/device/character.png'));
  media.comment='original comment [SHAX_RSRC:R0002]';
  const manifest=[{key:'R0001',name:'character.png',originalName:'character.png',relativePath:'Resources/R0001_first/character.png',sequence:false},
                  {key:'R0002',name:'character.png',originalName:'character.png',relativePath:'Resources/R0002_second/character.png',sequence:false}];
  const old=c.File;
  c.File=class extends old{constructor(p){super(p);this.exists=this.fsName.endsWith('R0002_second/character.png')||this.fsName.endsWith('R0001_first/character.png');}};
  const other=new c.FootageItem('character.png',new c.File('/old/device/character.png'));
  other.comment='[SHAX_RSRC:R0001]';
  const result=c.shax_assetRelinkImportedMedia({_folder:{fsName:'/local/vault/pack'},resourceManifest:manifest},[media,other]);
  assert.equal(result.missing,0);assert.equal(result.relinked,2);
  assert.ok(media.file.fsName.includes('R0002_second'));
  assert.ok(other.file.fsName.includes('R0001_first'));
});

test('Relink catches missing packed resources',()=>{
  const c=buildContext();
  const it=new c.FootageItem('gone.png',new c.File('/old/gone.png'));
  it.comment='[SHAX_RSRC:R0001]';
  const result=c.shax_assetRelinkImportedMedia({_folder:{fsName:'/local/vault'},resourceManifest:[{key:'R0001',name:'gone.png',originalName:'gone.png',relativePath:'Resources/gone.png',sequence:false}]},[it]);
  assert.equal(result.missing,1);
});

test('Expression-only dependency is included when reducing a project',()=>{
  const c=buildContext();
  const character=new c.CompItem('Character');character.id=1;
  const controller=new c.CompItem('Controller');controller.id=2;
  const file=new c.FootageItem('Face.png',null);file.id=3;
  const property={propertyType:c.PropertyType.PROPERTY,canSetExpression:true,expression:'comp("Controller").layer("CTRL"); footage("Face.png");'};
  const layer={numProperties:1,property(i){return property;},source:null};
  character.numLayers=1;character.layer=()=>layer;
  controller.numLayers=0;
  const all=[character,controller,file]; c.app.project={numItems:all.length,item(i){return all[i-1]}};
  const keep=c.shax_assetExpressionKeepItems(character);
  assert.equal(keep.length,3);
  assert.ok(keep.includes(controller));
  assert.ok(keep.includes(file));
});

test('Dynamic expression dependency fails rather than silently losing the controller',()=>{
  const c=buildContext();const scene=new c.CompItem('Scene');scene.id=1;
  scene.numLayers=1;scene.layer=()=>({numProperties:1,property:()=>({propertyType:c.PropertyType.PROPERTY,canSetExpression:true,expression:'comp(nameVar).layer("x")'})});
  c.app.project={numItems:1,item:()=>scene};
  assert.throws(()=>c.shax_assetExpressionKeepItems(scene),/dynamic comp\(\)\/footage\(\)/);
});


test('Selected character includes parent rigs, matte and thisComp controller expressions',()=>{
  const c=buildContext();
  const ctrl={index:1,name:'CTRL',numProperties:0};
  const matte={index:2,name:'Mask',numProperties:0};
  const prop={propertyType:c.PropertyType.PROPERTY,canSetExpression:true,expression:'thisComp.layer("CTRL").transform.position'};
  const child={index:3,name:'Head',parent:ctrl,hasTrackMatte:true,trackMatteLayer:matte,numProperties:1,property:()=>prop};
  const comp=new c.CompItem('Character');comp.numLayers=3;const layers=[ctrl,matte,child];comp.layer=(i)=>layers[i-1];
  const selected=c.shax_assetExpandSelectedLayers(comp,[child]);
  assert.equal(Array.from(selected).join(','),'1,2,3');
});

test('Save succeeds when ExtendScript Project.save returns undefined, and restores original',()=>{
  const c=buildContext();c.Folder.userData={fsName:'/user'};
  const source=new c.CompItem('Walking Character',10);source.id=13;source.time=1;source.numLayers=1;
  source.layer=()=>({enabled:true,nullLayer:false,hasVideo:true,inPoint:2,outPoint:8});
  const original=new c.File('/author/character.aep');original.exists=true;
  let reopened=false, savedTo=null, meta=null, reductions=0;
  c.app.project={activeItem:source,file:original,save(file){if(file){file.exists=true;savedTo=file.fsName;this.file=file;}},close(){},reduceProject(){reductions++},numItems:1,item(){return source}};
  c.app.open=()=>{reopened=true};
  c.shax_assetRenderPreviewSequence=()=>({poster:'',frames:[],count:0});
  c.shax_assetExpressionKeepItems=()=>[source];
  c.shax_assetWriteJson=(file,data)=>{meta=data};
  const result=c.shax_saveAssetPack('Walk','Character','comp','true');
  assert.match(result,/^OK~~RK_FIELD~~/);
  assert.equal(savedTo.endsWith('asset.aep'),true);
  assert.equal(reopened,true);
  assert.equal(reductions,0,'lossless save must never reduce project');
  assert.equal(meta.version,3);
  assert.equal(meta.packMode,'lossless-full-project');
  assert.equal(meta.contentStart,2);
  assert.equal(meta.contentEnd,8);
});

test('Missing linked resources fail the save instead of pretending a broken pack is portable',()=>{
  const c=buildContext();c.Folder.userData={fsName:'/user'};
  const source=new c.CompItem('Character');source.numLayers=0;
  const original=new c.File('/author/source.aep');
  let reopened=false,removed=false;
  c.app.project={activeItem:source,file:original,save(){},close(){},reduceProject(){},numItems:0};
  c.app.open=()=>{reopened=true};
  c.shax_assetRenderPreviewSequence=()=>({poster:'',frames:[]});
  c.shax_assetExpressionKeepItems=()=>[source];
  c.shax_assetCopyResources=()=>({copied:0,missing:2,manifest:[]});
  c.shax_assetDeleteFolderRecursive=()=>{removed=true;return true};
  const result=c.shax_saveAssetPack('Fail','Character','comp','true');
  assert.match(result,/ERROR.*2 linked resource/);
  assert.equal(reopened,true);
  assert.equal(removed,true);
});

test('Lossless mode refuses auto-precompose of arbitrary selected layers',()=>{
  const c=buildContext();const scene=new c.CompItem('Scene');scene.numLayers=3;scene.selectedLayers=[{index:1}];c.app.project.activeItem=scene;
  let saved=false;c.app.project.save=()=>{saved=true};
  const output=c.shax_saveAssetPack('character','Character','selection','true');
  assert.match(output,/ERROR.*Selected Layers is temporarily disabled/);
  assert.equal(saved,false);
});
test('Lossless Vault refuses uncollected external resources',()=>{
  const c=buildContext();const scene=new c.CompItem('Scene');c.app.project.activeItem=scene;
  const output=c.shax_saveAssetPack('scene','Scene','comp','false');
  assert.match(output,/ERROR.*Pack Resources ON/);
});
console.log(`${passes} regression checks passed`);
