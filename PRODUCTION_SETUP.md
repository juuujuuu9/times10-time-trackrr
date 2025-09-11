# Production Environment Setup

This document outlines the environment variables needed for production deployment.

## Required Environment Variables

### Database
```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### Email Service (Resend)
```env
RESEND_API_KEY=re_your_resend_api_key_here
```

### Application URLs
```env
# Primary production URL (used for email links)
PUBLIC_SITE_URL=https://trackr.times10.net

# Alternative URL (used as fallback)
BASE_URL=https://trackr.times10.net

# Legacy URL (for backward compatibility)
SITE_URL=https://trackr.times10.net
```

### Slack Integration (Optional)
```env
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret
```

## URL Configuration Priority

The application uses the following priority order for determining the base URL:

1. `PUBLIC_SITE_URL` (recommended for production)
2. `BASE_URL` (fallback)
3. `SITE_URL` (legacy)
4. `https://trackr.times10.net` (hardcoded fallback)

## Email Links

All email links (password reset, invitations, task assignments) will use:
- **Production**: `https://trackr.times10.net`
- **Development**: `http://localhost:4321`

## Vercel Deployment

For Vercel deployment, set these environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with the appropriate value
4. Make sure to set them for "Production" environment

## Domain Configuration

The application is configured to use `trackr.times10.net` as the primary domain for:
- Email links
- Password reset URLs
- Invitation URLs
- Task assignment notifications

If you need to change the domain, update the hardcoded fallback in:
- `src/utils/url.ts`
- All API endpoints that generate email links

## Testing Email URLs

To test that email URLs are working correctly:

1. Set up a test user account
2. Request a password reset
3. Check the email for the reset link
4. Verify the link points to `https://trackr.times10.net/reset-password?token=...`

## Troubleshooting

### Emails showing localhost URLs
- Check that `PUBLIC_SITE_URL` is set in your production environment
- Verify the environment variable is available at build time
- Check the Vercel deployment logs for environment variable issues

### Email delivery issues
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for delivery status
- Ensure your domain is verified in Resend
