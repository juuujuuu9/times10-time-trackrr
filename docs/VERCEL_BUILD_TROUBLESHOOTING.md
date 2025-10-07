# Vercel Build Troubleshooting Guide

## Common Vercel Build Failures

### 1. Import Path Resolution Errors

**Error Pattern:**
```
Could not resolve "../../../db" from "src/pages/api/fix-manual-duration-entries.ts"
```

**Root Cause:** Incorrect relative import paths that don't match the actual directory structure.

**Solution Process:**

#### Step 1: Identify Directory Depth
```bash
# Count directory levels from file to src/
# src/pages/api/file.ts = 2 levels deep
# src/pages/api/admin/file.ts = 3 levels deep  
# src/pages/api/admin/subdir/file.ts = 4 levels deep
```

#### Step 2: Apply Correct Import Rules
- **2 levels deep**: `../../db`
- **3 levels deep**: `../../../db`
- **4 levels deep**: `../../../../db`

#### Step 3: Systematic Fix Commands
```bash
# Fix files at 2 levels deep (src/pages/api/*.ts)
find src/pages/api -maxdepth 1 -name "*.ts" | xargs sed -i '' 's|from '\''../../../db'\''|from '\''../../db'\''|g'

# Fix files at 3 levels deep (src/pages/api/admin/*.ts)
find src/pages/api/admin -name "*.ts" | xargs sed -i '' 's|from '\''../../db'\''|from '\''../../../db'\''|g'

# Fix files at 4 levels deep (src/pages/api/admin/*/[*].ts)
find src/pages/api/admin -type d -mindepth 3 -exec find {} -name "*.ts" \; | xargs sed -i '' 's|from '\''../../../db'\''|from '\''../../../../db'\''|g'
```

#### Step 4: Verify Build
```bash
npm run build
```

### 2. Directory Structure Reference

```
src/
├── db/                    # Target directory
├── pages/
│   ├── api/              # 2 levels: ../../db
│   │   ├── admin/        # 3 levels: ../../../db
│   │   │   ├── clients/  # 4 levels: ../../../../db
│   │   │   └── tasks/    # 4 levels: ../../../../db
│   │   ├── auth/         # 3 levels: ../../../db
│   │   ├── debug/        # 3 levels: ../../../db
│   │   ├── reports/      # 3 levels: ../../../db
│   │   ├── slack/        # 3 levels: ../../../db
│   │   ├── tasks/        # 3 levels: ../../../db
│   │   ├── time-entries/ # 3 levels: ../../../db
│   │   └── timers/       # 3 levels: ../../../db
│   └── admin/            # 2 levels: ../../db
│       ├── clients/      # 3 levels: ../../../db
│       ├── projects/     # 3 levels: ../../../db
│       ├── tasks/        # 3 levels: ../../../db
│       ├── users/        # 3 levels: ../../../db
│       └── reports/      # 3 levels: ../../../db
```

### 3. Prevention Checklist

**Before Every Deployment:**
- [ ] Run `npm run build` locally
- [ ] Check for "Could not resolve" errors
- [ ] Verify import paths match directory depth
- [ ] Test build completion

**When Adding New Files:**
- [ ] Count directory levels from file to `src/`
- [ ] Use correct number of `../` in imports
- [ ] Test build after adding new files
- [ ] Follow existing patterns in similar files

### 4. Quick Fix Commands

**Find problematic files:**
```bash
find src -name "*.ts" -o -name "*.astro" | xargs grep -l "from '\.\./\.\./\.\./db'"
```

**Fix all import paths systematically:**
```bash
# Fix 2-level files
find src/pages/api -maxdepth 1 -name "*.ts" | xargs sed -i '' 's|from '\''../../../db'\''|from '\''../../db'\''|g'

# Fix 3-level files  
find src/pages/api -type d -mindepth 2 -exec find {} -name "*.ts" \; | xargs sed -i '' 's|from '\''../../db'\''|from '\''../../../db'\''|g'

# Fix 4-level files
find src/pages/api -type d -mindepth 3 -exec find {} -name "*.ts" \; | xargs sed -i '' 's|from '\''../../../db'\''|from '\''../../../../db'\''|g'
```

### 5. Common Mistakes

❌ **Wrong:**
```typescript
// In src/pages/api/file.ts (2 levels deep)
import { db } from '../../../db'; // Too many ../
```

✅ **Correct:**
```typescript
// In src/pages/api/file.ts (2 levels deep)
import { db } from '../../db'; // Correct number of ../
```

### 6. Emergency Fix Process

1. **Identify the error** from Vercel build logs
2. **Count directory levels** from failing file to `src/`
3. **Apply correct import path** based on depth
4. **Test locally** with `npm run build`
5. **Commit and push** the fix
6. **Monitor Vercel deployment** for success

### 7. Automated Fix Script

```bash
#!/bin/bash
# fix-imports.sh - Automated import path fixer

echo "Fixing import paths for Vercel deployment..."

# Fix 2-level files
find src/pages/api -maxdepth 1 -name "*.ts" | xargs sed -i '' 's|from '\''../../../db'\''|from '\''../../db'\''|g'
find src/pages/api -maxdepth 1 -name "*.ts" | xargs sed -i '' 's|from '\''../../../db/schema'\''|from '\''../../db/schema'\''|g'

# Fix 3-level files
find src/pages/api -type d -mindepth 2 -exec find {} -name "*.ts" \; | xargs sed -i '' 's|from '\''../../db'\''|from '\''../../../db'\''|g'
find src/pages/api -type d -mindepth 2 -exec find {} -name "*.ts" \; | xargs sed -i '' 's|from '\''../../db/schema'\''|from '\''../../../db/schema'\''|g'

# Fix 4-level files
find src/pages/api -type d -mindepth 3 -exec find {} -name "*.ts" \; | xargs sed -i '' 's|from '\''../../../db'\''|from '\''../../../../db'\''|g'
find src/pages/api -type d -mindepth 3 -exec find {} -name "*.ts" \; | xargs sed -i '' 's|from '\''../../../db/schema'\''|from '\''../../../../db/schema'\''|g'

# Fix admin pages
find src/pages/admin -name "*.astro" | xargs sed -i '' 's|from '\''../../../db'\''|from '\''../../db'\''|g'
find src/pages/admin -name "*.astro" | xargs sed -i '' 's|from '\''../../../db/schema'\''|from '\''../../db/schema'\''|g'

# Fix admin subdirectories
find src/pages/admin -type d -mindepth 2 -exec find {} -name "*.astro" \; | xargs sed -i '' 's|from '\''../../db'\''|from '\''../../../db'\''|g'
find src/pages/admin -type d -mindepth 2 -exec find {} -name "*.astro" \; | xargs sed -i '' 's|from '\''../../db/schema'\''|from '\''../../../db/schema'\''|g'

echo "Import paths fixed. Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for deployment."
else
    echo "❌ Build failed. Check for remaining import issues."
fi
```

This guide should prevent future Vercel build failures and provide a systematic approach to fixing import path issues.
