# إعداد نسخة جديدة من قالب بوصلة الإتقان

## إنشاء المستودع

1. ارفع محتويات هذه الحزمة إلى مستودع GitHub جديد وفارغ.
2. من `Settings > General` فعّل خيار `Template repository`.
3. لإنشاء مشروع جديد استخدم `Use this template > Create a new repository`.

## GitHub Pages

1. افتح `Settings > Pages` في المشروع الجديد.
2. اختر `Source: GitHub Actions`.
3. نفّذ أي Commit على الفرع `main` وانتظر نجاح Workflow.

لا تحتاج إلى تعديل `vite.config.ts` عند تغيير اسم المستودع؛ مسار النشر يُستخرج تلقائيًا من اسم المستودع أثناء GitHub Actions.

## التشغيل المحلي

```bash
npm ci
npm run dev
```

## الفحص قبل النشر

```bash
npm run build
```

## ملفات لا تُرفع

- `node_modules/`
- `dist/`
- ملفات ZIP
- ملفات PDF التجريبية
- ملفات الأسرار أو `.env`
