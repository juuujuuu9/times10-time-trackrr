# Vercel Environment Variables Setup

## The Issue
The production API is connecting to a different database than the one we've been checking locally. This is why the `due_date` column error persists.

## Solution
You need to set the correct `DATABASE_URL` in your Vercel dashboard.

## Steps to Fix

### 1. Get Your Production Database URL
The database URL should be:
```
postgresql://neondb_owner:***@ep-blue-silence-afokhoq0-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### 2. Set Environment Variable in Vercel
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add or update `DATABASE_URL` with the correct value
5. Make sure it's set for "Production" environment
6. Redeploy your project

### 3. Alternative: Check Current Vercel Environment
You can also check what DATABASE_URL is currently set in Vercel:
1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to "Settings" → "Environment Variables"
4. Check if `DATABASE_URL` is set and what value it has

## Verification
After setting the correct DATABASE_URL:
1. Redeploy your project
2. Try creating a task again
3. The error should be resolved

## Why This Happened
- Your local environment doesn't have DATABASE_URL set
- Vercel production environment has a different DATABASE_URL
- The production API is connecting to a database that's missing the `due_date` column
- We need to ensure Vercel uses the correct database URL
