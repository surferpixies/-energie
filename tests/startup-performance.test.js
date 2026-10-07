const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
(async()=>{
 // Le journal s'affiche avant la relecture distante du compte.
 let releaseUser,rendered=0;
 const client={auth:{getSession:async()=>({data:{session:{user:{id:'owner'}}}}),getUser:()=>new Promise(r=>{releaseUser=r}),onAuthStateChange:()=>{}}};
 const auth=vm.createContext({client,session:null,db:{settings:{demoMode:true}},render:()=>{rendered++;},dismissSplash:()=>{},prepareLocalJournalForSession:()=>{},loadDemoAccess:async()=>{},setTimeout:()=>{},showExperienceLaunchIfNeeded:()=>{}});
 vm.runInContext(source.slice(source.indexOf('  async function initAuth()'),source.indexOf('  // Le service worker demeure réservé')),auth);
 const startup=auth.initAuth();await new Promise(setImmediate);assert.equal(rendered,1);releaseUser({data:{user:{id:'owner'}},error:null});await startup;
 // Les images du guide ne bloquent plus le chargement de l'application.
 assert.ok(!fs.readFileSync(require.resolve('../index.html'),'utf8').includes('<script src="onboarding-images.js'));
 let script,loads=0;
 const guide=vm.createContext({window:{},document:{createElement:()=>({remove:()=>{}}),head:{appendChild:x=>{script=x;loads++;}}}});
 vm.runInContext(source.slice(source.indexOf('  let energyGuideImagesPromise'),source.indexOf('  async function openEnergyGuide')),guide);
 const images=guide.loadEnergyGuideImages();assert.equal(guide.loadEnergyGuideImages(),images);assert.equal(loads,1);script.onload();await images;
 // La mémoire des scénarios reste en RAM, les usages réels gardent leur sauvegarde.
 let saves=0,events=0;
 const memory={learnMany:()=>({learnedCount:1}),replaceState:x=>x,diagnostics:()=>({active:0})};
 const modules={utils:{},database:{foods:[],legacyFoods:[],byId:new Map()},recipes:{recipes:[]},memory:{loadLocal:()=>memory,saveLocal:()=>{saves++;}},parser:{parseMeal:()=>({})},confidence:{},profile:{}};
 const brain=vm.createContext({window:{EnergieBrainModules:modules,dispatchEvent:()=>{events++;}},console:{info:()=>{}},CustomEvent:class{}});
 vm.runInContext(fs.readFileSync(require.resolve('../brain/index.js'),'utf8'),brain);
 brain.window.Brain.learnMeals([],{persist:false});brain.window.Brain.replaceMemoryState({}, {persist:false});assert.equal(saves,0);assert.equal(events,0);
 brain.window.Brain.learnMeals([]);brain.window.Brain.replaceMemoryState({});assert.equal(saves,2);assert.equal(events,1);
 // Cache du service worker : URL exacte versionnée, nouvel actif, réseau et hors ligne.
 const listeners={},stores=new Map(),origin='https://example.test';let fetches=0,offline=false;
 function getCache(name){if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {match:async r=>m.get(r.url||r),put:async(r,v)=>m.set(r.url||r,v),keys:async()=>[...m.keys()].map(url=>({url}))};}
 const sw=vm.createContext({self:{location:{origin},clients:{claim:async()=>{}},skipWaiting:()=>{},addEventListener:(name,fn)=>listeners[name]=fn},caches:{open:async name=>getCache(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},URL,setTimeout,clearTimeout,fetch:async r=>{fetches++;if(offline)throw Error('offline');return {ok:true,body:r.url,clone(){return this}};}});
 vm.runInContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),sw);
 const asset=origin+'/app.js?v=1';await getCache('energie-runtime-v3.56.175').put(asset,{body:'cached'});
 let activation;listeners.activate({waitUntil:p=>activation=p});await activation;
 async function request(url,mode='no-cors'){let response;const waits=[];listeners.fetch({request:{url,method:'GET',mode},respondWith:p=>response=p,waitUntil:p=>waits.push(p)});const result=await response;await Promise.all(waits);return result;}
 assert.equal((await request(asset)).body,'cached');assert.equal(fetches,0);
 await request(origin+'/app.js?v=2');assert.equal(fetches,1);await request(origin+'/app.js?v=2');assert.equal(fetches,1);
 await request(origin+'/','navigate');offline=true;assert.equal((await request(origin+'/','navigate')).body,origin+'/');assert.equal((await request(asset)).body,'cached');
 console.log('Démarrage : affichage avant réseau, guide différé, mémoire fictive sans écriture, cache versionné et hors ligne OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
