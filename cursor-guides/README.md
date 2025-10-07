# Cursor Guides

This folder contains all cursor rules and development pattern documentation for the Times10 Time Tracker project.

## Purpose

This folder is specifically for **cursor-related documentation** that helps with:
- Development patterns and workflows
- Code organization rules
- Build and deployment troubleshooting
- API extension templates
- Field mapping patterns
- Testing patterns

## File Organization

### Core Rules
- **`cursor-task-prompts.md`** - Main cursor rules and task prompts
- **`extension-proposal.md`** - Template for API extension proposals

### Development Patterns
- **`API_FIELD_MAPPING_PATTERNS.md`** - Comprehensive field mapping patterns
- **`DURATION_EDITING_PATTERNS.md`** - Duration editing specific patterns
- **`TIME_EDITING_GUIDE.md`** - Time editing workflow guide

### Build & Deployment
- **`VERCEL_BUILD_TROUBLESHOOTING.md`** - Vercel build failure troubleshooting

### Analysis & Reference
- **`ROOT_MD_FILES_REFERENCE.md`** - Analysis of root-level documentation files

## Usage

All references in cursor rules point to files in this folder using the `/cursor-guides/` path prefix.

### Quick Reference
- **Main rules**: `/cursor-guides/cursor-task-prompts.md`
- **API extensions**: `/cursor-guides/extension-proposal.md`
- **Field mapping**: `/cursor-guides/API_FIELD_MAPPING_PATTERNS.md`
- **Build issues**: `/cursor-guides/VERCEL_BUILD_TROUBLESHOOTING.md`

## Adding New Documentation

### When to Add Here
Add documentation to this folder if it helps with:
- ✅ Development patterns and workflows
- ✅ Code organization and rules
- ✅ Build/deployment troubleshooting
- ✅ API development patterns
- ✅ Testing patterns
- ✅ Cursor-specific rules and guidelines

### When NOT to Add Here
Don't add documentation here if it's:
- ❌ General project documentation
- ❌ User guides and setup instructions
- ❌ Feature documentation
- ❌ API documentation (use `docs/api/` instead)

### Process for Adding New Files
1. **Check if it's cursor-related**: Does it help with development patterns?
2. **If YES**: Add to this folder
3. **Update references**: Update any references in `cursor-task-prompts.md`
4. **Update this README**: Add the new file to the organization section

## Maintenance

This folder is maintained as part of the cursor rules system. All cursor-related documentation should be centralized here for easy discovery and maintenance.