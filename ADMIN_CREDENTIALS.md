# KK Furnitures Admin Dashboard - Credentials & Access Guide

## 1. Quick Access Credentials

| Field | Value |
|---|---|
| **Admin Portal URLs** | `/login` or `/admin-login` |
| **Username** | `adminuser1` |
| **Password** | `kkfurnitures1` |
| **Session Lifetime** | 7 Days (Persistent HttpOnly Cookie) |

---

## 2. Protected Routes

Any unauthenticated attempt to visit the following routes will immediately redirect to `/login`:

- **`/admin`** &mdash; Products & Catalog Management (Publish, Edit Pictures, Prices, Colors)
- **`/admin/stock`** &mdash; Stock & Asset Movement Tracker (Daily Purchases, Restocks, Sales Ledger)
- **`/admin/layby`** &mdash; Customer Layby Agreements & Installments
- **`/admin/leads`** &mdash; WhatsApp Sales Leads Pipeline
- **`/admin/messages`** &mdash; Live WhatsApp Inbox
- **`/admin/promises`** &mdash; EcoCash Promises & Showroom Visits
- **`/admin/whatsapp-analytics`** &mdash; Embedded WhatsApp Analytics
- **`/dashboard`** &mdash; AI Lead Qualification Platform & Live Chat Inspector

---

## 3. How Authentication Works

1. **Authentication Guard:** Next.js route proxy (`proxy.ts`) and layout guards (`app/admin/layout.tsx`, `app/dashboard/layout.tsx`) intercept requests.
2. **Session Cookie:** Upon successful login, a secure, HttpOnly, SameSite cookie (`kk_admin_session`) is issued.
3. **Log Out:** Admins can click the **Log Out** button in the top navigation bar at any time to invalidate the session and return to `/login`.

---

## 4. Customizing Credentials

To change the admin username or password in the future, set the following environment variables in `.env.local` or in your Vercel Project Settings:

```env
ADMIN_USERNAME=your_new_username
ADMIN_PASSWORD=your_new_secure_password
```
*(If unset, they automatically default to `adminuser1` and `kkfurnitures1`).*
