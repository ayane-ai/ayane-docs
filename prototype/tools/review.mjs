/* Local HTTP-only regression runner. Reuses the project's Chrome/CDP review approach.
 * node tools/review.mjs --url http://127.0.0.1:PORT/ --baseline-url http://127.0.0.1:PORT/baseline
 * Reports and screenshots are fresh outputs under .review/runs; old baselines are never deleted.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { createHash } from 'node:crypto';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=Object.fromEntries(process.argv.slice(2).reduce((out,value,i,all)=>{if(value.startsWith('--'))out.push([value.slice(2),all[i+1]&&!all[i+1].startsWith('--')?all[i+1]:true]);return out;},[]));
if(args.region&&!['all','client','admin','components','tokens'].includes(args.region))throw Error('Unknown review region');
if(args.mode==='both')args.mode='embedded,fullscreen';
if(args.mode&&String(args.mode).split(',').some(mode=>!['embedded','fullscreen'].includes(mode)))throw Error('Unknown review mode');
function localUrl(value){const url=new URL(value);if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname))throw Error('Only explicitly served loopback HTTP pages are supported');return url.href;}
let temporaryServer=null;
if(args.url && args['baseline-artifact'])throw Error('baseline-artifact requires the automatic local HTTP server');
let target;
if(args.url) target=localUrl(args.url);
else {
 const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'tools','manifest.json'),'utf8'));
 const artifact=args.artifact?path.resolve(args.artifact):path.resolve(ROOT,manifest.out);
 if(!/\.html?$/i.test(artifact))throw Error('Review artifacts must be HTML files');
 if(!args.artifact&&!artifact.startsWith(ROOT+path.sep))throw Error('Manifest artifact escaped prototype');
 await fs.access(artifact);
 const baselineArtifact=args['baseline-artifact']?path.resolve(args['baseline-artifact']):null;
 if(baselineArtifact){if(!/\.html?$/i.test(baselineArtifact))throw Error('Baseline must be HTML');await fs.access(baselineArtifact);}
 temporaryServer=http.createServer(async(req,res)=>{const pathname=new URL(req.url,'http://127.0.0.1').pathname;if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}if((pathname!=='/'&&!(pathname==='/baseline'&&baselineArtifact))||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end();return;}try{const bytes=await fs.readFile(pathname==='/baseline'?baselineArtifact:artifact);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(500);res.end();}});
 await new Promise(resolve=>temporaryServer.listen(0,'127.0.0.1',resolve));
 target=localUrl('http://127.0.0.1:'+temporaryServer.address().port+'/');
}

const baseline=args['baseline-url']?localUrl(args['baseline-url']):args['baseline-artifact']?localUrl(new URL('baseline',target).href):null;
const stamp=new Date().toISOString().replace(/[:.]/g,'_');
const outDir=path.resolve(args.out||path.join(ROOT,'.review','runs',stamp));
const allowed=path.resolve(ROOT,'.review');
if(!outDir.startsWith(allowed+path.sep))throw Error('Output must stay inside prototype/.review');
try{await fs.access(outDir);throw Error('Refusing to overwrite an existing review output directory');}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.mkdir(path.join(outDir,'shots'),{recursive:true});
const data=JSON.parse(await fs.readFile(path.join(ROOT,'tools','client-regression.json'),'utf8'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chromePath=args.chrome||'C:/Program Files/Google/Chrome/Application/chrome.exe';
await fs.access(chromePath);
const profile=path.join(outDir,'chrome-profile');
await fs.mkdir(profile);
const chrome=spawn(chromePath,['--headless=new','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-extensions','--disable-background-networking','--disable-features=Translate,MediaRouter','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
let chromeErrors='';chrome.stderr.on('data',bytes=>{chromeErrors+=bytes.toString();});
const artifactHash=async()=>createHash('sha256').update(await (await fetch(target)).text()).digest('hex');
const report={artifactSha256:await artifactHash(),baselineSha256:baseline?createHash('sha256').update(await (await fetch(baseline)).text()).digest('hex'):null,url:target,baselineUrl:baseline,startedAt:new Date().toISOString(),output:outDir,states:[],blindSpots:['file:// was not opened','real keyboard and safe-area insets','real DPR > 1','real media devices and 2D/3D runtimes']};
let ws;let seq=0;const pending=new Map();let events=[];
try{
 let port;
 for(let i=0;i<120;i++){try{port=Number((await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{}await sleep(100);}
 if(!port)throw Error('Chrome did not create its local review endpoint: '+chromeErrors.slice(-500));
 const version=await (await fetch('http://127.0.0.1:'+port+'/json/version')).json();
 report.userAgent=version['User-Agent'];
 ws=new WebSocket(version.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const item=pending.get(message.id);pending.delete(message.id);clearTimeout(item.timer);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);}else events.push(message);};
 function send(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method));},30000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
 const created=await send('Target.createTarget',{url:'about:blank'});
 const attached=await send('Target.attachToTarget',{targetId:created.targetId,flatten:true});
 const cmd=(method,params)=>send(method,params,attached.sessionId);
 async function evaluate(expression){const result=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
 await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Log.enable');
 function pageHelpers(region,credentials){
  const root=document.querySelector('[data-proto="'+region+'"]')||document.getElementById('sec-'+region);
  const q=(selector,scope=root)=>scope.querySelector(selector);
  const qAll=(selector,scope=root)=>Array.from(scope.querySelectorAll(selector));
  const assert=(condition,message)=>{if(!condition)throw Error('ASSERT: '+message);};
  function visible(node){if(!node||!node.getClientRects().length)return false;for(let n=node;n&&n.nodeType===1;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return true;}
  function click(selector,scope=root){const node=q(selector,scope);assert(visible(node),'click target visible: '+selector);assert(!node.disabled,'click target enabled: '+selector);node.focus({preventScroll:true});node.click();}
  function fill(selector,text){const node=q(selector);assert(visible(node),'input visible: '+selector);node.value=text;node.dispatchEvent(new Event('input',{bubbles:true}));}
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function wait(fn){for(let i=0;i<80;i++){if(fn())return;await sleep(25);}assert(false,'state did not arrive');}
  function queryWidth(){const s=getComputedStyle(root);return root.offsetWidth-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth);}
  const isPhone=()=>queryWidth()<768;
  async function login(){fill('#login-account',credentials.account);fill('#login-password',credentials.password);click('#login-submit');await wait(()=>q('#login-shell').hidden&&!q('#app-frame').hidden);assert(q('#login-shell').hidden&&!q('#app-frame').hidden,'authenticated app must be visible');}
  async function media(id,on){if(q('#'+id).getAttribute('aria-checked')===String(on))return;click('#'+id);if(q('#client-permission-layer').classList.contains('is-open')){await wait(()=>visible(q('#client-permission-layer')));assert(q('#client-permission-description').textContent.includes('不会'),'permissions must explicitly be simulated');click('#client-permission-allow');}assert(q('#'+id).getAttribute('aria-checked')===String(on),'media state '+id);}
  function key(value,shift=false){document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:value,shiftKey:shift,bubbles:true,cancelable:true}));}
  return {root,q,qAll,assert,visible,click,fill,sleep,wait,queryWidth,isPhone,login,media,key};
 }
 const helper=(region)=>'const {root,q,qAll,assert,visible,click,fill,sleep,wait,queryWidth,isPhone,login,media,key}=('+pageHelpers.toString()+')('+JSON.stringify(region)+','+JSON.stringify(data.credentials)+');\n';
 const run=(region,code)=>evaluate('(async()=>{'+helper(region)+code+'})()');
 async function size(w,h){await cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await cmd('Emulation.setTouchEmulationEnabled',{enabled:w<768,maxTouchPoints:w<768?5:1});}
 function geometry(region){
  const root=document.querySelector('[data-proto="'+region+'"]')||document.getElementById('sec-'+region);
  const visible=node=>node&&node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden'&&!node.closest('[hidden]');
  const rect=node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};};
  const stage=rect(root),style=getComputedStyle(root);
  const viewport={w:document.documentElement.clientWidth,h:document.documentElement.clientHeight};
  const contentWidth=root.offsetWidth-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth);
  const outside=[],small=[],blocked=[],workbenchOcclusion=[];
  const critical=region==='client'?['#sidebar-toggle','#client-mode-toggle','#client-voice-input','#client-voice-output','#client-vision','#client-history-open','#client-send','#mobile-companion','#mobile-profile','#vision-collapse','#vision-restore']:region==='admin'?['#admin-login-password-toggle','#nav-toggle','#role-switch','#chaos-toggle','#topbar-bell']:[];
  const overlay=root.querySelector('.modal-layer.is-open, .ai-selector.is-open, .drawer.is-open, .popover.is-open, .sidenav.is-open');
  for(const selector of critical){const node=root.querySelector(selector);if(!visible(node))continue;const r=rect(node);if(r.x<stage.x-1||r.right>stage.right+1||r.y<stage.y-1||r.bottom>stage.bottom+1)outside.push({selector,rect:r});let hitWidth=node.offsetWidth,hitHeight=node.offsetHeight;for(const pseudo of ['::before','::after']){const p=getComputedStyle(node,pseudo);if(p.content!=='none'&&p.content!=='normal'){hitWidth=Math.max(hitWidth,parseFloat(p.width)||0);hitHeight=Math.max(hitHeight,parseFloat(p.height)||0);}}if(hitWidth<43||hitHeight<43)small.push({selector,w:hitWidth,h:hitHeight});if(!overlay&&r.x+r.w/2>=0&&r.right-r.w/2<viewport.w&&r.y+r.h/2>=0&&r.bottom-r.h/2<viewport.h){const hit=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);if(hit&&!node.contains(hit)){const record={selector,by:hit.id||hit.className||hit.tagName};if(!root.contains(hit)&&!root.closest('.region-fullscreen-layer'))workbenchOcclusion.push(record);else blocked.push(record);}}}
  const scrollOverflow=[];
  for(const selector of region==='admin'?['.admin-shell','.topbar','.page-head','.filter-bar']:['.client-layout','.scene-toolbar','.client-toolbar-controls','.composer','.client-profile-view']){const node=root.querySelector(selector);if(visible(node)&&node.scrollWidth>node.clientWidth+2)scrollOverflow.push({selector,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth});}
  return {stage,viewport,contentWidth,layout:root.dataset.layout||null,outside,small,blocked,workbenchOcclusion,scrollOverflow,activeElement:document.activeElement?.id||null};
 }


 async function visibleDemoAssets(id){
  const scope=document.getElementById(id);if(!scope)return [];
  await new Promise(resolve=>requestAnimationFrame(resolve));
  const images=Array.from(scope.querySelectorAll('img')).filter(image=>{const r=image.getBoundingClientRect();const s=getComputedStyle(image);return r.width&&r.height&&r.right>0&&r.bottom>0&&r.left<document.documentElement.clientWidth&&r.top<document.documentElement.clientHeight&&s.visibility!=='hidden';});
  await Promise.race([Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});}))),new Promise(resolve=>setTimeout(resolve,1800))]);
  return images.filter(image=>!image.complete||!image.naturalWidth).map(image=>image.currentSrc||image.src);
 }

 function demoGeometry(id){
  const frame=document.getElementById(id);if(!frame?.classList.contains('demo-frame'))return null;
  const bounds=frame.getBoundingClientRect();const outside=[],small=[];
  const shown=node=>{for(let n=node;n&&n.nodeType===1;n=n.parentElement){const s=getComputedStyle(n);if(n.hidden||s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;}return !!node.getClientRects().length;};
  for(const node of frame.querySelectorAll('button,input,textarea,select,summary')){
   if(node.disabled||!shown(node))continue;
   const r=node.getBoundingClientRect();let width=node.offsetWidth,height=node.offsetHeight;
   for(const pseudo of ['::before','::after']){const p=getComputedStyle(node,pseudo);if(p.content==='none'||p.content==='normal')continue;width=Math.max(width,parseFloat(p.width)||0);height=Math.max(height,parseFloat(p.height)||0);}
   if(width<43||height<43)small.push({id:node.id,tag:node.tagName,label:node.getAttribute('aria-label')||node.textContent.trim().slice(0,25),width,height});
   const scrollParent=node.closest('.drawer-body,.modal-body,.table-scroll');
   if(!scrollParent&&(r.left<bounds.left-1||r.right>bounds.right+1||r.top<bounds.top-1||r.bottom>bounds.bottom+1))outside.push({id:node.id,label:node.textContent.trim().slice(0,25)});
  }
  return {frame:id,width:frame.clientWidth,height:frame.clientHeight,outside,small};
 }

 const jobs=[];
 const wanted=args.region||'all';
 const wantedModes=args.mode?String(args.mode).split(','):['embedded','fullscreen'];
 if(wanted==='all'||wanted==='client')for(const sc of data.client){for(const mode of wantedModes.filter(mode=>!sc.modes||sc.modes.includes(mode))){jobs.push({...sc,mode,baseline:false});if(baseline&&sc.baseline)jobs.push({...sc,mode,baseline:true});}}
 for(const region of ['admin','components','tokens'])if(wanted==='all'||wanted===region){for(const sc of data.other[region])for(const mode of region==='admin'?wantedModes:['embedded'])jobs.push({...sc,region,mode,auth:false});}
 const selected=args.filter?jobs.filter(job=>job.name.includes(String(args.filter))):jobs;
 if(!selected.length)throw Error('No scenarios matched; an empty run cannot pass');
 console.log('review jobs:',selected.length,'output:',outDir);
 for(const job of selected){
  const item={name:job.name,region:job.region,mode:job.mode,baseline:!!job.baseline,viewport:[job.w,job.h],requestedCanvasWidth:job.canvasWidth||null,assertions:0};
  const tag=(job.baseline?'baseline-':'')+job.region+'-'+job.mode+'-'+job.name;
  try{
   await size(job.w,job.h);events=[];
   const url=new URL(job.baseline?baseline:target);url.hash='sec-'+job.region;url.searchParams.set('reviewCase',tag+'-'+report.states.length);
   await cmd('Page.navigate',{url:url.href});
   for(let i=0;i<100;i++){try{if(events.some(event=>event.method==='Page.loadEventFired')&&await evaluate("document.readyState==='complete' && !!window.AyaneSpec"))break;}catch{}await sleep(50);}
   await evaluate("(async()=>{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1200))]);await Promise.race([Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}))),new Promise(r=>setTimeout(r,1800))]);window.AyaneSpec.showPage("+JSON.stringify(job.region)+");window.AyaneSpec.setView();})()");
   if(job.mode==='fullscreen')await run(job.region,"click('#fullscreen-"+job.region+"-open',document);await sleep(60);");
   if(job.focus)await evaluate('window.AyaneSpec.locate('+JSON.stringify('component:'+job.focus)+')');
   if(job.auth)await run(job.region,'await login();');
   if(job.setup)await run(job.region,job.setup);
   // Use native browser keyboard events; synthetic KeyboardEvent cannot activate a button.
   for(const step of job.keyboard||[]){
    const keyMap={ArrowLeft:{key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37},ArrowRight:{key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39},ArrowDown:{key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40},ArrowUp:{key:'ArrowUp',code:'ArrowUp',windowsVirtualKeyCode:38},Home:{key:'Home',code:'Home',windowsVirtualKeyCode:36},End:{key:'End',code:'End',windowsVirtualKeyCode:35},Enter:{key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'},Space:{key:' ',code:'Space',windowsVirtualKeyCode:32,text:' '},Tab:{key:'Tab',code:'Tab',windowsVirtualKeyCode:9},Escape:{key:'Escape',code:'Escape',windowsVirtualKeyCode:27}};
    const key=keyMap[step.key];if(!key)throw Error('Unsupported keyboard step: '+step.key);
    const {text,...description}=key;
    const params={...description,modifiers:step.shift?8:0};
    await cmd('Input.dispatchKeyEvent',{type:text?'keyDown':'rawKeyDown',...params,...(text?{text,unmodifiedText:text}:{})});
    await cmd('Input.dispatchKeyEvent',{type:'keyUp',...params});
    item.keyboardSteps=(item.keyboardSteps||0)+1;
    for(const expression of step.expect||[]){try{await run(job.region,'await wait(()=>('+expression+')); assert(('+expression+'),'+JSON.stringify(expression)+');');item.assertions++;}catch(error){throw Error('Keyboard '+step.key+': '+expression+' — '+error.message);}}
   }
   if(job.drag){
    const before=await evaluate('(()=>{const p=document.getElementById('+JSON.stringify(job.drag.panel)+'),h=p.querySelector("[data-demo-drag-handle]"),r=h.getBoundingClientRect();return {left:p.offsetLeft,top:p.offsetTop,x:r.left+12,y:r.top+r.height/2};})()');
    await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x,y:before.y});
    await cmd('Input.dispatchMouseEvent',{type:'mousePressed',x:before.x,y:before.y,button:'left',buttons:1,clickCount:1});
    await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x+job.drag.dx,y:before.y+job.drag.dy,button:'left',buttons:1});
    await cmd('Input.dispatchMouseEvent',{type:'mouseReleased',x:before.x+job.drag.dx,y:before.y+job.drag.dy,button:'left',buttons:0,clickCount:1});
    const after=await evaluate('(()=>{const p=document.getElementById('+JSON.stringify(job.drag.panel)+'),f=p.closest(".demo-frame");return {left:p.offsetLeft,top:p.offsetTop,right:p.offsetLeft+p.offsetWidth,bottom:p.offsetTop+p.offsetHeight,w:f.clientWidth,h:f.clientHeight};})()');
    item.drag={before,after};if(Math.abs(after.left-before.left)+Math.abs(after.top-before.top)<4)throw Error('Native drag did not move the window');if(after.left<0||after.top<0||after.right>after.w+1||after.bottom>after.h+1)throw Error('Dragged window escaped its frame');item.assertions+=2;
   }
   if(job.pointerButton){
    const code='document.querySelector('+JSON.stringify(job.pointerButton)+')';
    const sample=()=>evaluate('(()=>{const n='+code+',s=getComputedStyle(n),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,background:s.backgroundColor,transform:s.transform,active:n.matches(":active"),hover:n.matches(":hover")};})()');
    const before=await sample();await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x,y:before.y});await sleep(180);const hover=await sample();
    await cmd('Input.dispatchMouseEvent',{type:'mousePressed',x:before.x,y:before.y,button:'left',buttons:1,clickCount:1});await sleep(180);const active=await sample();
    await cmd('Input.dispatchMouseEvent',{type:'mouseReleased',x:before.x,y:before.y,button:'left',buttons:0,clickCount:1});
    item.pointerButton={before,hover,active};if(!hover.hover||before.background===hover.background||!active.active||active.transform==='none')throw Error('Hover/active button states were not rendered');item.assertions+=3;
   }
   await sleep(job.settle??90);
   const expressions=job.expect||[];
   for(const expression of expressions){if(job.baseline&&expression.includes('client-demo-notice'))continue;if(job.baseline&&expression.includes('data-agent-id'))continue;if(job.baseline&&expression.includes('call-button'))continue;await run(job.region,'await wait(()=>('+expression+')); assert(('+expression+'),'+JSON.stringify(expression)+');');item.assertions++;}
   if(!job.baseline){await evaluate("(()=>{if(document.title!=='绫音 · 设计规范与交互原型')throw Error('workbench title was overwritten');})()");item.assertions++;}
   if(job.region==='admin'){
    if(job.expectedRoute==='login'||job.name.startsWith('a01')||job.name.startsWith('a02')||job.name.startsWith('a03'))await run('admin',"assert(visible(q('#admin-login-shell')),'admin login visible');");
    else await run('admin',"assert(!q('#admin-shell').hidden,'admin must really be logged in');");
    item.assertions++;
   }
   if(job.region==='components'||job.region==='tokens'){await run(job.region,"assert(visible(root),'documentation page active');");item.assertions++;}
   if(job.resize){for(const view of job.resize){await size(view.w,view.h);await sleep(120);for(const expression of expressions){await run(job.region,'assert(('+expression+'),'+JSON.stringify(expression)+');');item.assertions++;}}}
   if(job.region==='client'&&job.name.match(/^(login-|user-profile-|about-)/)) item.protectedStyles=await evaluate("Object.fromEntries(['#login-submit','#login-password-toggle','.mobile-user-card','#user-card-edit','#user-card-signout'].map(selector=>{const style=getComputedStyle(document.querySelector('[data-proto=client] '+selector));return [selector,Object.fromEntries(['color','backgroundColor','backgroundImage','borderTopWidth','borderRadius','fontSize'].map(key=>[key,style[key]]))]}))");
   if(job.focus){const missing=await evaluate('('+visibleDemoAssets.toString()+')('+JSON.stringify(job.focus)+')');if(missing.length)throw Error('Visible example assets not ready: '+missing.join(', '));}
   if(job.focus){item.demoGeometry=await evaluate('('+demoGeometry.toString()+')('+JSON.stringify(job.focus)+')');if(item.demoGeometry&&(item.demoGeometry.outside.length||item.demoGeometry.small.length))throw Error('Component geometry: '+JSON.stringify(item.demoGeometry));}
   item.geometry=await evaluate('('+geometry.toString()+')('+JSON.stringify(job.region)+')');
   if(['client','admin'].includes(job.region)&&!job.baseline){const g=item.geometry;if(g.outside.length||g.small.length||g.blocked.length||g.scrollOverflow.length)throw Error('Geometry assertion: '+JSON.stringify({outside:g.outside,small:g.small,blocked:g.blocked,overflow:g.scrollOverflow}));}
   const shot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   item.screenshot='shots/'+tag+'.png';await fs.writeFile(path.join(outDir,item.screenshot),Buffer.from(shot.data,'base64'));
   item.exceptions=events.filter(e=>e.method==='Runtime.exceptionThrown').map(e=>e.params.exceptionDetails.exception?.description||e.params.exceptionDetails.text);
   const logErrors=events.filter(e=>e.method==='Log.entryAdded'&&e.params.entry.level==='error').map(e=>e.params.entry);
   item.assetErrors=logErrors.filter(e=>e.source==='network'&&/avatars\.githubusercontent\.com/.test((e.url||'')+' '+e.text)).map(e=>e.text+' '+(e.url||''));
   item.consoleErrors=events.filter(e=>e.method==='Runtime.consoleAPICalled'&&e.params.type==='error').map(e=>e.params.args.map(a=>a.value||a.description).join(' ')).concat(logErrors.filter(e=>!(e.source==='network'&&/avatars\.githubusercontent\.com/.test((e.url||'')+' '+e.text))).map(e=>e.text));
   if(item.exceptions.length||item.consoleErrors.length)throw Error('JavaScript/console errors');
   item.status='passed';
  }catch(error){item.status='failed';item.error=String(error.message);try{item.geometry||=await evaluate('('+geometry.toString()+')('+JSON.stringify(job.region)+')');const shot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});item.screenshot='shots/'+tag+'-failed.png';await fs.writeFile(path.join(outDir,item.screenshot),Buffer.from(shot.data,'base64'));}catch{}}
  report.states.push(item);console.log(item.status.toUpperCase(),tag,item.error||'');
  await fs.writeFile(path.join(outDir,'audit.json'),JSON.stringify(report,null,2)+'\n');
 }
 if(await artifactHash()!==report.artifactSha256)throw Error('Artifact changed while the review was running; results cannot be accepted');
 report.protectedStyleComparisons=[];
 for(const oldState of report.states.filter(state=>state.baseline&&state.protectedStyles)){const current=report.states.find(state=>!state.baseline&&state.name===oldState.name&&state.mode===oldState.mode&&state.region===oldState.region);if(!current)continue;const same=JSON.stringify(current.protectedStyles)===JSON.stringify(oldState.protectedStyles);report.protectedStyleComparisons.push({name:oldState.name,mode:oldState.mode,equal:same});if(!same){current.status='failed';current.error='Protected computed styles differ from archived baseline';}}
 report.finishedAt=new Date().toISOString();
 report.summary={total:report.states.length,passed:report.states.filter(s=>s.status==='passed').length,failed:report.states.filter(s=>s.status==='failed').length,assertions:report.states.reduce((n,s)=>n+s.assertions,0),assetErrors:report.states.reduce((n,s)=>n+(s.assetErrors?.length||0),0)};
 await fs.writeFile(path.join(outDir,'audit.json'),JSON.stringify(report,null,2)+'\n');
 const summary=['# HTTP 原型回归结果','','- 开始：'+report.startedAt,'- 结束：'+report.finishedAt,'- 通过：'+report.summary.passed+' / '+report.summary.total,'- 断言：'+report.summary.assertions,'- 外链资源错误：'+report.summary.assetErrors,'','## 失败场景',...report.states.filter(s=>s.status==='failed').map(s=>'- '+s.region+'/'+s.mode+'/'+s.name+': '+s.error),'','## 验证边界','- 全部页面通过本机 HTTP 访问，未打开 file://。','- 截图为浏览器可视区域；嵌入画布 100% 下被外壳裁切或 HUD 遮挡记录在 workbenchOcclusion，需平移查看，不冒充业务控件互相遮挡。','- 真机软键盘、安全区、DPR > 1、实际设备和真实形象运行时未验证。','- 外链资源错误单独报告，不当作脚本错误隐藏。',''].join('\n');
 await fs.writeFile(path.join(outDir,'summary.md'),summary);
 console.log(JSON.stringify(report.summary));
 await send('Browser.close').catch(()=>{});
 process.exitCode=report.summary.failed?1:0;
}catch(error){report.fatal=String(error.stack||error);await fs.writeFile(path.join(outDir,'audit.json'),JSON.stringify(report,null,2)+'\n');console.error(error);process.exitCode=1;}
finally{if(temporaryServer)temporaryServer.close();if(ws)ws.close();for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('Review closed'));}pending.clear();await fs.writeFile(path.join(outDir,'chrome.log'),chromeErrors);if(chrome.exitCode===null)chrome.kill();}
