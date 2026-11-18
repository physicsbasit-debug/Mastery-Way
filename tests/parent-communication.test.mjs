import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'vite';
let server, m;
before(async()=>{server=await createServer({configFile:'./vite.config.ts',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});m=await server.ssrLoadModule('/individualPerformance/parentCommunication.ts');});
after(async()=>server?.close());
const context={studentName:'أحمد',schoolName:'مدرسة',grade:'التاسع',section:'1',subject:'العلوم',paperTitle:'اختبار',academicYear:'2026'};
const result={context,summary:{achievedMastery:false,masteryCutoffPercent:75},skills:[{skill:'المعرفة',percent:100},{skill:'التطبيق',percent:40}],priorities:[{skill:'التطبيق',percent:40}],plan:{parentRole:['متابعة حل سؤال مماثل.']}};
test('تستند الرسالة إلى أقوى مهارة وأولوية حقيقية دون ادعاء التواصل',()=>{const msg=m.buildParentMessage(result);assert.match(msg,/أحمد/);assert.match(msg,/المعرفة/);assert.match(msg,/التطبيق/);assert.doesNotMatch(msg,/تم التواصل/);});
test('لا تقترح ضعفًا إذا حقق الطالب الإتقان',()=>{const msg=m.buildParentMessage({...result,summary:{achievedMastery:true},priorities:[]});assert.doesNotMatch(msg,/يحتاج إلى دعم/);});
test('يفصل سجل الطلاب ويرفض هوية غير مكتملة',()=>{assert.equal(m.studentRecordKey({...context,studentName:''}),null);assert.notEqual(m.studentRecordKey(context),m.studentRecordKey({...context,studentName:'خالد'}));});
test('المقارنة تنتظر نتيجة صحيحة وتقارن النسبة للمهارة نفسها',()=>{assert.equal(m.compareFollowup(40,''),null);assert.equal(m.compareFollowup(40,'101'),null);assert.deepEqual(m.compareFollowup(40,'65'),{before:40,after:65,difference:25});});

test('تقدم رسالة ودودة وإجراء منزلي مرتبط بالمهارة بدل الاكتفاء بمدة المتابعة',()=>{
 const msg=m.buildParentMessage({...result,context:{...context,teacherName:'وليد',subject:'العلوم',paperTitle:'الاختبار القصير'},skills:[{skill:'المعرفة',percent:100},{skill:'القدرات العليا',percent:20}],priorities:[{skill:'القدرات العليا',percent:20}]});
 assert.match(msg,/ولي أمر الطالب/); assert.match(msg,/العلوم/); assert.match(msg,/تفسير|توضيح|سبب/); assert.match(msg,/سؤال/); assert.match(msg,/وليد/); assert.doesNotMatch(msg,/سنشارككم نتيجة المتابعة/);
});
test('تتجنب اختراع نقطة قوة عندما لا تبلغ مهارة حد الإتقان',()=>{
 const msg=m.buildParentMessage({...result,skills:[{skill:'الفهم',percent:30}],priorities:[{skill:'الفهم',percent:30}]});
 assert.doesNotMatch(msg,/أظهر.*أداءً جيدًا/); assert.match(msg,/شرح|يشرح/);
});
test('تقدم إثراءً مناسبًا إذا أتقن الطالب ولا تفترض وجود مهارة ضعيفة',()=>{
 const msg=m.buildParentMessage({...result,summary:{achievedMastery:true,masteryCutoffPercent:75},priorities:[],plan:{parentRole:['تشجيع الطالب على شرح فكرة أو تصميم سؤال جديد.']}});
 assert.doesNotMatch(msg,/يحتاج.*متابعة مهارة/); assert.match(msg,/شرح|سؤال/);
});

test('تبدأ الرسالة بمخاطبة ولي أمر الطالب مع اسمه المدخل',()=>{
 const msg=m.buildParentMessage({...result,context:{...context,studentName:'أحمد الحراصي'}});
 assert.ok(msg.startsWith('الفاضل/ ولي أمر الطالب أحمد الحراصي'));
 assert.match(msg,/السلام عليكم ورحمة الله وبركاته/);
});

test('يجهز رقم ولي الأمر العماني أو الدولي للرابط دون حفظ جهة اتصال',()=>{
 assert.equal(m.normalizeParentPhone('٩٢٣٤ ٥٦٧٨'),'96892345678');
 assert.equal(m.normalizeParentPhone('+968 9234 5678'),'96892345678');
 assert.equal(m.normalizeParentPhone('0096892345678'),'96892345678');
 assert.equal(m.normalizeParentPhone('+44 7700 900123'),'447700900123');
});
test('يرفض رقمًا ناقصًا أو يحتوي على أحرف بدل فتح محادثة خاطئة',()=>{
 for(const value of ['', '123', '٩٢٣٤٥٦٧', '9234abc5678','+9689234', '+968923456789']) assert.equal(m.normalizeParentPhone(value),null);
});
test('ينشئ رابط ولي الأمر مع ترميز الرسالة دون رقم المرسل',()=>{
 const url=m.parentWhatsappUrl('92345678','السلام عليكم');
 assert.equal(url,'https://wa.me/96892345678?text='+encodeURIComponent('السلام عليكم'));
 assert.equal(m.parentWhatsappUrl('abc','نص'),null);
});
