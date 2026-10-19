---
title: WhatsApp Evolution Gateway - ZimFurnitureHub
emoji: 💬
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# Evolution API v2 on Hugging Face Spaces ($0 Infrastructure)

This repository powers the WhatsApp Evolution API v2 gateway for KK Furnitures / ZimFurnitureHub. Hosted on Hugging Face Spaces (2 vCPU, 16 GB RAM free tier) with zero server maintenance costs.

---

## 1. Hugging Face Space Configuration

When creating your Hugging Face Space:
1. **Space Type:** Select **Docker** (Blank).
2. **Hardware:** Free 2 vCPU / 16 GB RAM.
3. Commit both `Dockerfile` and `README.md` to the Space repository.

### Environment Secrets (Space Settings > Variables and Secrets > New Secret)
Add these as **Secrets** (encrypted):

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `AUTHENTICATION_API_KEY` | Master API Key protecting Evolution API endpoints | `your-secure-random-token-here` |
| `DATABASE_CONNECTION_URI` | Supabase PostgreSQL URI (Appended with `?schema=evolution`) | `postgresql://postgres.[ref]:[pwd]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?schema=evolution` |
| `CACHE_REDIS_URI` | Upstash Redis connection string (TLS enabled) | `rediss://default:[password]@[endpoint].upstash.io:6379` |

> ⚠️ **CRITICAL ARCHITECTURAL PRO-TIP: Separate Database Schema**  
> Notice the `?schema=evolution` at the end of `DATABASE_CONNECTION_URI`.  
> Evolution API automatically executes Prisma migrations upon startup. Appending `?schema=evolution` isolates Evolution's internal tables (`Instance`, `Message`, `Chat`, etc.) in the `evolution` schema so they never conflict with your Next.js app tables (`wa_contacts`, `wa_messages`, `products`, `orders`) in the `public` schema.

---

### Environment Variables (Space Settings > Variables and Secrets > New Variable)
Add these as plain **Variables**:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `SERVER_PORT` | `7860` | Directs HTTP traffic to Hugging Face's container port |
| `DATABASE_ENABLED` | `true` | Enables PostgreSQL session persistence |
| `DATABASE_PROVIDER` | `postgresql` | Specifies PostgreSQL provider |
| `DATABASE_SAVE_DATA_INSTANCE` | `true` | Persists WhatsApp Baileys auth tokens in DB |
| `DATABASE_SAVE_DATA_NEW_MESSAGE` | `false` | **Do not** copy every message into Supabase (the app stores its own trimmed copy) |
| `DATABASE_SAVE_MESSAGE_UPDATE` | `false` | Skip delivery/read-receipt rows (very high volume) |
| `DATABASE_SAVE_DATA_CONTACTS` | `false` | Skip mirrored contact list |
| `DATABASE_SAVE_DATA_CHATS` | `false` | Skip mirrored chat list |
| `DATABASE_SAVE_DATA_LABELS` | `false` | Skip labels |
| `DATABASE_SAVE_DATA_HISTORIC` | `false` | Skip history sync on pairing |
| `CACHE_REDIS_ENABLED` | `true` | Uses Redis for fast ephemeral lock and token caching |
| `CACHE_REDIS_SAVE_INSTANCES` | `true` | Caches active session instances in Redis |
| `CACHE_LOCAL_ENABLED` | `false` | Disables container-local disk cache (which wipes on Space restart) |
| `WEBHOOK_GLOBAL_ENABLED` | `false` | Keep false so we configure instance-specific webhooks |
| `DEL_INSTANCE` | `false` | Prevents deleting instance credentials on disconnect |
| `LOG_LEVEL` | `ERROR,WARN,INFO` | Clean production logs |

---

## 2. Supabase SQL Preparation

Before starting Evolution API for the first time, execute this in your Supabase SQL Editor to prepare the isolated schema:

```sql
-- Create isolated schema for Evolution API internal tables
CREATE SCHEMA IF NOT EXISTS evolution;
GRANT ALL ON SCHEMA evolution TO postgres, service_role;
```

---

## 3. Verify Deployment

Once the Space builds and shows **Running**, test the health endpoint:
```bash
curl -H "apikey: <AUTHENTICATION_API_KEY>" https://<your-username>-<your-space-name>.hf.space/
```
Response:
```json
{
  "status": 200,
  "message": "Welcome to the Evolution API",
  "version": "2.x.x"
}
```

---

## 4. Run Instance Pairing Automation

In your local terminal or deployment runner, execute the setup script:
```bash
npx tsx setup-instance.ts
```
Follow the interactive CLI to generate the **8-digit pairing code** directly on your client's mobile phone!
