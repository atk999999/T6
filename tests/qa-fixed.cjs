'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../public/game');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
function canvasRecorder(){
 let tr={x:0,y:0}, stack=[];const logs=[];
 const ctx=new Proxy({
  save(){stack.push({...tr})},restore(){assert(stack.length, 'unbalanced restore');tr=stack.pop()},
  translate(x,y){tr.x+=x;tr.y+=y},fillText(text){logs.push(String(text))},
  measureText(text){return {width:String(text).length*6}},
  createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}
 },{get(obj,key){if(key in obj)return obj[key];if(typeof key==='symbol')return;return ()=>{};}});
 return {ctx,logs,get translation(){return tr},get stackDepth(){return stack.length}};
}
function questEnv(seedStorage){
 const storage=seedStorage||new Map(), nodes=new Map(), canvas=canvasRecorder();
 function node(){return {style:{},hidden:true,innerHTML:'',textContent:'',getContext(){return canvas.ctx},appendChild(){},addEventListener(){},setAttribute(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};}
 const document={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},createElement(){return node()}};
 const p={x:221,y:314,hp:100,maxHp:100,mp:0,walk:0,dir:'down'};
 const mockMath=Object.create(Math);mockMath.random=()=>1;
 const env={console,Math:mockMath,document,p,window:{},Character:{},Image:class{set src(s){this._src=s}},
  localStorage:{getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,String(v))},removeItem(k){storage.delete(k)}},
  setTimeout(){return 1},clearTimeout(){},setInterval(){},clearInterval(){},
  Villagers:{day:3,minutes:480,sleepToNextDay(){this.day++;this.minutes=360;return this.day}},
  Quest1:{getState(){return 'completed'},registeredDay:null,STATES:{SELECTION_READY:'selection_ready'}}};
 vm.createContext(env); const run=code=>vm.runInContext(code,env);
 run(source('tieu-pham.js'));run(source('quest2.js'));
 return {Q:run('Quest2'),H:run('TieuPhamHome'),T:run('TieuPham'),p,env,storage,nodes,canvas};
}
function reachCountdown(e){
 const {Q,H,p,env}=e;
 Q.init();H.enter(p);H.sleepInBed(p);
 Q.update(2,2,p,env.Villagers);Q.update(2.5,4.5,p,env.Villagers);Q.update(4,8.5,p,env.Villagers);
 assert.equal(Q.getState(),'countdown_hide');
}
// QA-01: transform must be identical before/after every HUD draw, even during shake.
{
 const e=questEnv();reachCountdown(e);e.Q.chooseHideSpot('jar',e.p);
 for(let i=0;i<3;i++){
  e.Q.drawHUD(e.canvas.ctx,e.p,390,844,9+i,.016);
  assert.deepEqual(e.canvas.translation,{x:0,y:0});
  assert.equal(e.canvas.stackDepth,0);
 }
 console.log('PASS QA-01: no accumulated canvas translation or leaked save stack');
}
// QA-02: the real doorway triggers the scripted death branch (not a scene exit).
{
 const e=questEnv();reachCountdown(e);e.p.x=352;e.p.y=412;
 assert.equal(e.H.canWalk(e.p.x,e.p.y),true);
 assert.equal(e.H.checkTransition(e.p,0,1,1),true);
 assert.equal(e.Q.getState(),'attack_door_early');
 assert.equal(e.H.inside,true);
 assert.equal(e.p.y,398);
 console.log('PASS QA-02: doorway routes to attack_door_early and stays in scene');
}
// QA-03: zero HP must be treated as zero rather than default 100.
{
 const e=questEnv();e.p.hp=0;
 e.T.handleClickHUD(30,30,390,e.p);e.T.drawHUD(e.canvas.ctx,e.p,390,844,1,.016);
 assert(e.canvas.logs.some(s=>s.includes('Khí Huyết: 0/100 HP')));
 assert(!e.canvas.logs.some(s=>s.includes('Khí Huyết: 100/100 HP')));
 console.log('PASS QA-03: HP 0/100 displayed correctly');
}
// QA-04: do not write an identical state twice; forced writes still work.
{
 const data=new Map();let writeCount=0,clock=0;
 const c={console,window:{},document:{},
  Date:{now:()=>++clock*1000},
  localStorage:{setItem(k,v){data.set(k,v);if(k==='lang_du_lam_game_save_v1')writeCount++},getItem(k){return data.get(k)||null},removeItem(k){data.delete(k)}},
  p:{x:221,y:314,hp:100,maxHp:100},Villagers:{day:1,minutes:480},TieuPhamHome:{inside:false},TieuPham:{outfitIdx:0}};
 vm.createContext(c);const G=vm.runInContext(source('game-save.js')+'\nGameSave;',c);
 assert.equal(G.save(true),true);assert.equal(writeCount,1);
 assert.equal(G.save(false),false);assert.equal(G.save(false),false);assert.equal(writeCount,1);
 c.p.hp=70;assert.equal(G.save(false),true);assert.equal(writeCount,2);
 assert.equal(G.save(true),true);assert.equal(writeCount,3);
 assert.equal(G.load(c.p)!==null,true);assert.equal(G.save(false),false);assert.equal(writeCount,3);
 console.log('PASS QA-04: stable save dedupe, forced save, load dedupe');
}
// QA-05: ruined house cannot be re-entered, and loading the epilogue exits the old room.
{
 const data=new Map([['lang_du_lam_quest2_v1',JSON.stringify({version:1,state:'completed',completed:true,ruinsActive:true})]]);
 const e=questEnv(data);e.Q.init();assert.equal(e.Q.isVillageRuined(),true);
 e.p.x=221;e.p.y=296;
 assert.equal(e.H.checkTransition(e.p,0,-1,1),false);
 assert.equal(e.H.inside,false);
 e.H.enter(e.p);assert.equal(e.Q.restoreAfterLoad(e.p),'completed');
 assert.equal(e.H.inside,false);assert.deepEqual([e.p.x,e.p.y],[221,314]);
 const epilogue=questEnv(new Map([['lang_du_lam_quest2_v1',JSON.stringify({version:1,state:'ruins_explore',completed:false,ruinsActive:true})]]));
 epilogue.Q.init();epilogue.H.enter(epilogue.p);
 assert.equal(epilogue.Q.restoreAfterLoad(epilogue.p),'victory');
 assert.equal(epilogue.H.inside,false);
 console.log('PASS QA-05: no intact home after ruins, even after save/load');
}
// QA-06: physically-clamped dt at low FPS must not inflate the survival deadline.
for(const fps of [15,20,30,60]){
 const e=questEnv();reachCountdown(e);
 const dtPhysics=Math.min(1/fps,.035),dtReal=1/fps;
 for(let frame=0;frame<Math.round(10*fps)+2 && e.Q.getState()==='countdown_hide';frame++){
  e.Q.update(dtPhysics,frame/fps,e.p,e.env.Villagers,dtReal);
 }
 assert.equal(e.Q.getState(),'attack_timeout',`at ${fps} FPS`);
 console.log(`PASS QA-06: 10-second deadline at ${fps} FPS`);
}
// QA-07: ruined villagers must stop movement & talking, keep in-game clock and memorial.
{
 const nodes=new Map(),keys=[];
 const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,{hidden:true,style:{},textContent:'',innerHTML:'',onclick:null});return nodes.get(id)},addEventListener(){} };
 const env={console,document:doc,window:{},addEventListener(type,handler){keys.push(type)},
  Collision:{polygons:[],canWalk(){return true}},
  Quest2:{isVillageRuined(){return true},isWorldTimeFrozen(){return false}}};
 vm.createContext(env);
 vm.runInContext(source('npcs.js'),env);
 const V=vm.runInContext('Villagers',env);V.init();
 const first=V.list[0],oldX=first.x,oldY=first.y,oldDay=V.day,oldTime=V.minutes;
 V.update(1,2,{x:oldX,y:oldY,hp:100});
 assert.equal(V.minutes,oldTime+2);assert.equal(V.day,oldDay);
 assert.equal(first.x,oldX);assert.equal(first.y,oldY);
 assert.equal(V.nearest,null);
 assert.equal(V.talk({x:oldX,y:oldY,hp:100}),false);
 assert.equal(nodes.get('people').textContent,'Người xưa');
 nodes.get('people').onclick();
 assert.equal(nodes.get('dialog').hidden,false);
 assert(nodes.get('dialog-title').textContent.includes('Người xưa'));
 assert(nodes.get('dialog-body').textContent.includes('phế tích'));
 assert(nodes.get('clock').textContent.length>0,'world clock continues updating');
 console.log('PASS QA-07: NPC activity halted after ruins, memorial shown, time continues');
}
console.log('ALL 7 QA FIXES PASSED');
