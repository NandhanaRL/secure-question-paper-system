# Database Setup & Cloud Deployment Guide

This document outlines how to deploy the Secure JIT System database to a Managed Cloud PostgreSQL provider (e.g., Supabase, Neon, AWS RDS) and how to securely initialize it.

## 1. Creating the Cloud Database
1. Create a project in your preferred provider (e.g., Supabase).
2. Note the **Connection String** (URI). For production Node.js/Prisma apps, ensure you are using a **connection pooler** URL (usually port `6543` in Supabase) and append `?pgbouncer=true` if required by the provider.

## 2. Required Environment Variables
In your cloud deployment environment (Vercel, Railway, Heroku, AWS), set the following environment variables. **Never hardcode these in your codebase.**

```env
# The cloud database connection string
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[db]?schema=public"

# A secure 64-character random string (e.g., generated via `openssl rand -hex 32`)
JWT_SECRET="your-secure-random-string"

# Initial Admin Credentials (used during the seeding phase)
ADMIN_EMAIL="admin@securejit.com"
ADMIN_PASSWORD="super-secure-password"
```

## 3. Running Migrations & Seeding (Cloud Deployment)

When deploying the backend application, you must apply the database schema and seed the initial administrator account.

In your CI/CD pipeline or deployment configuration (e.g., Railway build command), run:
```bash
# Applies the schema without resetting data (Safe for Production)
npm run db:migrate

# Seeds the initial admin user using the ADMIN_EMAIL and ADMIN_PASSWORD variables
npm run db:seed
```

> [!IMPORTANT]
> The `db:seed` script will automatically skip creation if an admin with that email already exists, making it safe to run on every deployment.

## 4. Required Tables Overview
The schema contains the following heavily indexed tables optimized for JIT performance:
- `User`: Stores encrypted credentials and RBAC roles.
- `Question`: The secure Question Bank. Indexed heavily on `[status, difficulty]` for hyper-fast randomized queries during JIT generation.
- `Exam`: Stores the examination schedule. Indexed on `[status]` for fast active-session lookups.
- `ExamBlueprint`: 1-to-1 mapping with Exams, storing the JSON distribution rules.
- `Session`: Tracks active candidate/center sessions.
- `AuditLog`: Append-only table recording every JIT extraction and login attempt. Indexed by `[timestamp]` and `[userId]`.

## 5. Local Development Workflow
If you are developing locally, you can use a local PostgreSQL instance or Docker:
```bash
# 1. Start a local Postgres container
docker run --name secure-jit-pg -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# 2. Update your local .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"

# 3. Push the schema and seed
npx prisma db push
npm run db:seed
```

> [!WARNING]
> Use `npx prisma db push` only for rapid local development. Always use `npm run db:migrate` (`prisma migrate deploy`) for cloud deployments to prevent accidental data loss.
