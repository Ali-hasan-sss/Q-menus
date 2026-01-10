# إصلاح مشكلة Cookie في Production

## المشكلة

عند استخدام Next.js Proxy (`NEXT_PUBLIC_PROXY_API=true`)، الـ `Set-Cookie` header لا يتم تمريره بشكل صحيح من Backend إلى Frontend، مما يسبب فشل authentication.

## الحل

### 1. إيقاف Proxy في Vercel Environment Variables

في Vercel Dashboard:
1. اذهب إلى **Settings** → **Environment Variables**
2. تأكد من وجود:
   ```
   NEXT_PUBLIC_API_URL=https://api.qmenussy.com
   NEXT_PUBLIC_SOCKET_URL=https://socket.qmenussy.com
   NEXT_PUBLIC_PROXY_API=false
   ```
3. **مهم جداً**: تأكد من أن `NEXT_PUBLIC_PROXY_API=false`

### 2. التحقق من Backend CORS Settings

في ملف `.env` على السيرفر (`/opt/qmenus/qmenus-backend/backend/.env`):

```env
NODE_ENV=production
FRONTEND_URL=https://www.qmenussy.com
ALLOWED_ORIGINS=https://www.qmenussy.com,https://qmenussy.com
```

**مهم**: يجب أن يحتوي `ALLOWED_ORIGINS` على:
- `https://www.qmenussy.com` (مع www)
- `https://qmenussy.com` (بدون www)

### 3. إعادة بناء وإعادة نشر

```bash
# على السيرفر (Backend)
cd /opt/qmenus/qmenus-backend/backend
npm run build:all
pm2 restart all

# في Vercel (Frontend)
# سيتم إعادة البناء تلقائياً عند push
```

## التحقق من الإصلاح

بعد إعادة النشر:

1. **في Browser Console** (F12):
   - يجب أن ترى: `API URL: https://api.qmenussy.com/api` (وليس `/api`)
   - يجب أن ترى: `🍪 Set-Cookie header from response: [...]` (وليس `undefined`)
   - يجب أن ترى: `✅ Cookie successfully set in browser!`

2. **في Network Tab**:
   - افتح POST request إلى `https://api.qmenussy.com/api/auth/login`
   - تحقق من Response Headers:
     - `Set-Cookie: auth-token=...; HttpOnly; Secure; SameSite=None`
     - `Access-Control-Allow-Origin: https://www.qmenussy.com`
     - `Access-Control-Allow-Credentials: true`

3. **في Application Tab → Cookies**:
   - يجب أن ترى `auth-token` cookie من `api.qmenussy.com`
   - الإعدادات: `HttpOnly: ✅`, `Secure: ✅`, `SameSite: None`

## لماذا Proxy لا يعمل مع Cookies?

Next.js rewrites (`/api` → backend) تمرر الطلبات عبر Next.js server. عند استخدام proxy:
- الـ `Set-Cookie` header قد لا يتم تمريره بشكل صحيح
- CORS headers قد لا تعمل بشكل صحيح مع cross-origin cookies
- Browser security policies تمنع cookies من domain مختلف عند استخدام proxy

الحل هو استخدام **اتصال مباشر** من Frontend إلى Backend مع CORS صحيح.
