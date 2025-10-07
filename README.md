# Cursor Guides

This folder contains all the documentation files referenced in the cursor rules for the Times10 Time Tracker project.

## File Organization

### Core Rules
- **`cursor-task-prompts.md`** - Main cursor rules and task prompts
- **`extension-proposal.md`** - Template for API extension proposals

### Field Mapping & API Patterns
- **`API_FIELD_MAPPING_PATTERNS.md`** - Comprehensive field mapping patterns
- **`DURATION_EDITING_PATTERNS.md`** - Duration editing specific patterns
- **`TIME_EDITING_GUIDE.md`** - Time editing workflow guide

### Build & Deployment
- **`VERCEL_BUILD_TROUBLESHOOTING.md`** - Vercel build failure troubleshooting

## Usage

All references in cursor rules now point to files in this folder using the `/cursor-guides/` path prefix.

### Quick Reference
- **Main rules**: `/cursor-guides/cursor-task-prompts.md`
- **API extensions**: `/cursor-guides/extension-proposal.md`
- **Field mapping**: `/cursor-guides/API_FIELD_MAPPING_PATTERNS.md`
- **Build issues**: `/cursor-guides/VERCEL_BUILD_TROUBLESHOOTING.md`

## Maintenance

When adding new cursor rule documentation:
1. Add the file to this folder
2. Update references in `cursor-task-prompts.md`
3. Update this README if needed
4. Keep all cursor-related documentation centralized here

This organization ensures all cursor rules and their referenced documentation are easily discoverable and maintainable.
