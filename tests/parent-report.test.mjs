import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
let server,Report,analyze,Panel;
before(async()=>{
 server=await createServer({configFile:'./vite.config.ts',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 ({IndividualPerformanceReportView:Report}=await server.ssrLoadModule('/individualPerformance/report.tsx'));
 ({ParentContactPanel:Panel}=await server.ssrLoadModule('/individualPerformance/ParentContactPanel.tsx'));
 ({runIndividualPerformanceAnalysis:analyze}=await server.ssrLoadModule('/individualPerformance/analytics.ts'));
});
after(async()=>server?.close());
const context={studentName:'طالب تجريبي',paperTitle:'ورقة تجريبية',schoolName:'مدرسة تجريبية',grade:'التاسع',section:'1',subject:'العلوم',academicYear:'2026',educationDirectorate:'مسقط',assessmentType:'اختبار',teacherName:'معلم',analysisDate:'2026-11-18'};
const questions=[{id:'q1',label:'س1',maxScore:4,skill:'الفهم'}];
const inputs=[{questionId:'q1',score:2,errorType:'لم يرمز نوع الخطأ',teacherNote:''}];
const record={parentPhone:'92345678',contacts:[{id:'1',date:'2026-11-18',method:'اتصال',status:'تم التواصل',agreement:'متابعة تدريب',evidence:'ملاحظة المعلم',skill:'الفهم',baseline:50,followupDate:'2026-11-25',followupPercent:'75',followupNote:'تحسن في التفسير'}]};
test('يظهر التواصل المسجل ومقارنة المهارة في التقرير الختامي',()=>{
 const result=analyze(context,questions,inputs);
 const html=renderToStaticMarkup(React.createElement(Report,{result,parentRecord:record}));
 for(const value of ['توثيق التواصل مع ولي الأمر','متابعة تدريب','ملاحظة المعلم','75%','25 نقطة مئوية']) assert.ok(html.includes(value),value);
});
test('لا يعرض التقرير تواصلًا وهميًا قبل التسجيل',()=>{
 const html=renderToStaticMarkup(React.createElement(Report,{result:analyze(context,questions,inputs)}));
 assert.ok(!html.includes('توثيق التواصل مع ولي الأمر والمتابعة'));
});
test('تظهر الرسالة وسجل التواصل القابل للمراجعة',()=>{
 const html=renderToStaticMarkup(React.createElement(Panel,{result:analyze(context,questions,inputs),record,onChange:()=>{}}));
 assert.ok(html.includes('فتح محادثة ولي الأمر'));
 assert.ok(html.includes('https://wa.me/96892345678?text='));
 assert.ok(html.includes('متابعة تدريب'));
 assert.ok(html.includes('25 نقطة مئوية'));
});
test('يجمع عنوان التشخيص مع لوحة القرار وعنوان التواصل مع سجله',()=>{
 const html=renderToStaticMarkup(React.createElement(Report,{result:analyze(context,questions,inputs),parentRecord:record}));
 assert.match(html,/data-pdf-keep="true"[^>]*>\s*<h2[^>]*>.*?خريطة التشخيص وأولويات التدخل.*?لوحة القرار التشخيصي/s);
 assert.match(html,/<section[^>]*data-pdf-keep="true"[^>]*>\s*<h2[^>]*>.*?توثيق التواصل مع ولي الأمر والمتابعة.*?متابعة تدريب/s);
});
