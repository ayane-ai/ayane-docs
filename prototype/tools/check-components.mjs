/* Component source/coverage gate; supplements the existing strict build checks. */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFile(path.join(root,p),'utf8');
const context={window:{}};vm.runInNewContext(await read('src/spec/components.data.js'),context);
const inventory=context.window.AyaneComponentInventory;
const manifest=JSON.parse(await read('tools/manifest.json'));const html=await read(manifest.out);
const errors=[];const assert=(ok,message)=>{if(!ok)errors.push(message);};
assert(inventory.components.length===29,'Expected 29 current component entries');
assert(new Set(inventory.components.map(c=>c.id)).size===inventory.components.length,'Unique inventory ids');
for(const id of inventory.excludedExamples||[])assert(!html.includes('id="'+id+'"'),'Removed example returned: '+id);
for(const item of inventory.components){
 assert(html.includes('id="'+item.demo+'"'),'Missing example '+item.id+' -> '+item.demo);
 try{await fs.access(path.join(root,item.source));}catch{errors.push('Missing component source '+item.source);}
 assert(item.selectors.length>0&&['客户端组件','通用组件'].includes(item.purpose)&&item.uses,'Incomplete metadata '+item.id);
}
let count=0;const numbers=[];
for(const file of (await fs.readdir(path.join(root,'src/spec/demos'))).filter(n=>n.endsWith('.html'))){
 const text=await read('src/spec/demos/'+file);
 const frames=[...text.matchAll(/<div class="demo-frame[^>]*>/g)];
 for(const frame of frames){const tail=text.slice(frame.index+frame[0].length);assert(/^\s*<span class="demo-label"/.test(tail),'First child must label frame: '+file);}
 for(const match of text.matchAll(/class="demo-no">(\d+)<\/span>/g)){count++;numbers.push(Number(match[1]));}
 assert(!/data-proto="(?:client|admin)"/.test(text),'Example must not claim a real prototype mount: '+file);
}
assert(count===13&&new Set(numbers).size===13&&numbers.every(n=>n>=1&&n<=13),'13 uniquely numbered component rows');
for(const file of ['client.css','nav.css']){
 const text=await read('src/components/'+file);
 assert(!/(?:#[0-9a-f]{3,8}\b|rgba?\()/i.test(text),'New component color literals: '+file);
}
assert(!html.includes('src/components/client-history.css'),'Retired stylesheet must not be built');
const buttonDemo=await read('src/spec/demos/button.html');assert((buttonDemo.match(/class="demo-frame/g)||[]).length===1,'Button variants must share one canvas');
for(const file of (await fs.readdir(path.join(root,'src/spec/demos'))).filter(n=>n.endsWith('.html'))){
 const text=await read('src/spec/demos/'+file);assert(!/旧客户端|旧版|历史示例|不接回客户端|旧手机|data-lifecycle="legacy"/.test(text),'Outdated component copy in '+file);
}
assert(inventory.components.every(item=>!JSON.stringify(item).match(/旧客户端|旧版|历史示例|不接回客户端|仅历史/)),'Inventory must describe current usage');
const view=await read('src/views/client.css');
assert(!/\.(?:login-input|login-submit|message-bubble|user-card|profile-modal)\b[^{}]*\{/.test(view),'Extracted components must not remain duplicated in client view');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('✓ 当前组件覆盖 29 / 29 · 13 类展示 · 共享定义与示例隔离通过');
