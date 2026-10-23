import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const listeners={};const notifications=[];const opened=[]
const self={
 addEventListener:(name,handler)=>listeners[name]=handler,
 skipWaiting:()=>{},location:{origin:'https://your-site.example'},
 registration:{showNotification:async(title,options)=>notifications.push({title,...options})},
 clients:{claim:async()=>{},matchAll:async()=>[],openWindow:async url=>opened.push(url)},
}
vm.runInNewContext(await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),{self,URL})
let pending
listeners.push({data:{json:()=>({title:'New message',body:'Open NandiphaM',tag:'test',url:'https://attacker.test'})},waitUntil:p=>pending=p})
await pending
assert.equal(notifications[0].tag,'test')
assert.equal(notifications[0].data.url,'/')
listeners.push({data:{json:()=>{throw new Error('Invalid JSON')}},waitUntil:p=>pending=p})
await pending
assert.equal(notifications[1].title,'NandiphaM')
listeners.notificationclick({notification:{close:()=>{}},waitUntil:p=>pending=p})
await pending
assert.deepEqual(opened,['/'])
assert.equal(listeners.fetch,undefined,'Service worker must not cache private requests')
const updates=[]
self.clients.matchAll=async()=>[{postMessage:value=>updates.push(value.type)}]
listeners.push({data:{json:()=>({title:'New message'})},waitUntil:p=>pending=p})
await pending
assert.deepEqual(updates,['nandipham-update'],'Push must refresh the open conversation')
console.log('Service worker notification, fallback, safe click target and no-cache checks passed')
