const fs=require('fs');
const src=fs.readFileSync(require('path').join(__dirname,'..','app.js'),'utf8');
const NAV_FIELDS=['nav','settingsOpen','topicsView','pathView','activePath','topic','currentRound','fromPath','fromPathTier','mode','tab','selectedCategory','checkpoint','checkpointAct'];
global.NAV_FIELDS=NAV_FIELDS;
let s=src.indexOf('function migrateNavSnapshot');
let e=src.indexOf('\n\n',src.indexOf('function applyNavSnapshot'));
eval(src.slice(s,src.indexOf('function applyNavSnapshot'))+src.slice(src.indexOf('function applyNavSnapshot'),e));
let fails=0;
function ck(l,c,d){console.log((c?'  ok   ':'  FAIL ')+l+(d?'  — '+d:''));if(!c)fails++;}

console.log('\n═══ v118 snapshot (old key) arriving at v119 ═══');
global.state={nav:'topics',topicsView:false,topic:'greetings',pathView:'list'};
// user was on the Topics LIST before deploying; entry written by v118
let old={nav:'topics',homeView:true,pathView:'list',topic:null,settingsOpen:false};
applyNavSnapshot(old);
ck('nav restored',state.nav==='topics');
ck('topicsView migrated from homeView',state.topicsView===true,'got '+state.topicsView);
ck('  (unmigrated this would stay false = stuck in the topic)',state.topicsView!==false);

console.log('\n═══ old key, INSIDE a topic ═══');
global.state={nav:'topics',topicsView:true};
applyNavSnapshot({nav:'topics',homeView:false,topic:'greetings'});
ck('topicsView false',state.topicsView===false);
ck('topic restored',state.topic==='greetings');

console.log('\n═══ v119 snapshot (new key) — migration must not interfere ═══');
global.state={nav:'dashboard',topicsView:true};
applyNavSnapshot({nav:'topics',topicsView:false,topic:'numbers'});
ck('new key wins',state.topicsView===false);

console.log('\n═══ both keys present (belt and braces) ═══');
global.state={nav:'x',topicsView:null};
applyNavSnapshot({nav:'topics',topicsView:false,homeView:true});
ck('new key takes precedence, old ignored',state.topicsView===false,'got '+state.topicsView);

console.log('\n═══ neither key ═══');
global.state={nav:'x',topicsView:true};
applyNavSnapshot({nav:'review'});
ck('topicsView untouched',state.topicsView===true);
ck('nav applied',state.nav==='review');

console.log('\n═══ null / undefined snapshot ═══');
applyNavSnapshot(null); applyNavSnapshot(undefined);
ck('no throw on empty snapshot',true);
console.log(fails?'\n'+fails+' FAILURES':'\nall migration scenarios pass');
process.exit(fails?1:0);
