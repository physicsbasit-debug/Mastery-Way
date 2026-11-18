import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
let server, storage;
before(async () => {
 const values=new Map();
 globalThis.window={localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}};
 server=await createServer({configFile:'./vite.config.ts',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 storage=await server.ssrLoadModule('/shared/workspaceAutosave.ts');
});
after(async()=>{await server?.close();delete globalThis.window;});
test('يحفظ بيانات كل مسار مستقلًا ويستعيدها ثم يمسح المسار المطلوب فقط',()=>{
 storage.saveWorkspace('group-test',{scores:[0,29.5,30]});
 storage.saveWorkspace('individual-test',{score:1.5});
 assert.deepEqual(storage.loadWorkspace('group-test',null),{scores:[0,29.5,30]});
 storage.clearWorkspace('group-test');
 assert.equal(storage.loadWorkspace('group-test',null),null);
 assert.deepEqual(storage.loadWorkspace('individual-test',null),{score:1.5});
});
test('يرجع القيمة الافتراضية عند رفض البيانات المحفوظة',()=>{
 storage.saveWorkspace('invalid-test',{score:'bad'});
 assert.deepEqual(storage.loadWorkspace('invalid-test',{score:0},v=>typeof v.score==='number'),{score:0});
});
