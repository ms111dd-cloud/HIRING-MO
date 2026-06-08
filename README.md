# HIRING MO — نظام إدارة التوظيف
### روّاد الخليج للمدارس الدولية

نظام متكامل لأتمتة دورة التوظيف من رفع السيرة الذاتية حتى إصدار العرض الوظيفي.

---

## 🚀 تشغيل المشروع محلياً

### 1. المتطلبات
- Node.js 18+
- مفتاح OpenAI API

### 2. التثبيت
```bash
git clone https://github.com/YOUR_USERNAME/HIRING-MO.git
cd HIRING-MO
npm run install:all
```

### 3. إعداد متغيرات البيئة
```bash
cp .env.example .env
# عدّل الملف وأضف OPENAI_API_KEY
```

### 4. تشغيل المشروع
```bash
npm run dev
```

### 5. إنشاء الحسابات الافتراضية
افتح المتصفح:
```
POST http://localhost:5000/api/auth/seed
```
أو من Terminal:
```bash
curl -X POST http://localhost:5000/api/auth/seed
```

---

## 🌐 النشر على Railway

1. ارفع على GitHub
2. افتح [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. أضف المتغيرات في Railway:
   - `OPENAI_API_KEY`
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. في Railway → Settings → Build Command: `npm run build`
5. Start Command: `npm start`

---

## 👥 الحسابات الافتراضية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| HR Manager | hr@hiringmo.com | admin123 |
| المشرفة الأكاديمية | supervisor@hiringmo.com | super123 |
| المقابل | interviewer@hiringmo.com | inter123 |

---

## 📁 هيكل المشروع

```
HIRING-MO/
├── backend/
│   ├── routes/         # API endpoints
│   ├── services/       # DB, OpenAI, Notifications
│   ├── middleware/     # Auth & permissions
│   ├── uploads/        # CVs, templates, offers
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/      # Dashboard, CVUpload, Candidates, Interviews, JobOffers, Templates
│       ├── components/ # Layout, Sidebar
│       └── context/    # Auth state
└── package.json
```

---

## 🔧 قوالب Word

في ملف Word، استخدم هذه المتغيرات:
- `{{CANDIDATE_NAME}}` — اسم المرشح
- `{{JOB_TITLE}}` — المسمى الوظيفي
- `{{BASIC_SALARY}}` — الراتب الأساسي
- `{{HOUSING_ALLOWANCE}}` — بدل السكن
- `{{TRANSPORT_ALLOWANCE}}` — بدل النقل
- `{{TOTAL_SALARY}}` — إجمالي الراتب
- `{{START_DATE}}` — تاريخ المباشرة
- `{{BRANCH}}` — الفرع
- `{{DATE_TODAY}}` — تاريخ اليوم
