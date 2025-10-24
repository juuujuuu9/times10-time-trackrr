import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import * as dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config({ path: '.env.local' });
dotenv.config();

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: false,
    },
  }),
  integrations: [
    tailwind({
      config: { path: './tailwind.config.mjs' },
      applyBaseStyles: false,
    }),
    react(),
  ],
  vite: {
    define: {
      'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL || ''),
      'process.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY || ''),
      'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL || ''),
      'process.env.PUBLIC_SITE_URL': JSON.stringify(process.env.PUBLIC_SITE_URL || ''),
      'process.env.SLACK_SIGNING_SECRET': JSON.stringify(process.env.SLACK_SIGNING_SECRET || ''),
      'process.env.SLACK_CLIENT_ID': JSON.stringify(process.env.SLACK_CLIENT_ID || ''),
      'process.env.SLACK_CLIENT_SECRET': JSON.stringify(process.env.SLACK_CLIENT_SECRET || ''),
      'process.env.BUNNY_STORAGE_ZONE_NAME': JSON.stringify(process.env.BUNNY_STORAGE_ZONE_NAME || ''),
      'process.env.BUNNY_STORAGE_ZONE_PASSWORD': JSON.stringify(process.env.BUNNY_STORAGE_ZONE_PASSWORD || ''),
      'process.env.BUNNY_STORAGE_ZONE_REGION': JSON.stringify(process.env.BUNNY_STORAGE_ZONE_REGION || ''),
      'process.env.BUNNY_CDN_URL': JSON.stringify(process.env.BUNNY_CDN_URL || ''),
      'import.meta.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL || ''),
      'import.meta.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY || ''),
      'import.meta.env.BASE_URL': JSON.stringify(process.env.BASE_URL || ''),
      'import.meta.env.PUBLIC_SITE_URL': JSON.stringify(process.env.PUBLIC_SITE_URL || ''),
      'import.meta.env.SLACK_SIGNING_SECRET': JSON.stringify(process.env.SLACK_SIGNING_SECRET || ''),
      'import.meta.env.SLACK_CLIENT_ID': JSON.stringify(process.env.SLACK_CLIENT_ID || ''),
      'import.meta.env.SLACK_CLIENT_SECRET': JSON.stringify(process.env.SLACK_CLIENT_SECRET || ''),
      'import.meta.env.BUNNY_STORAGE_ZONE_NAME': JSON.stringify(process.env.BUNNY_STORAGE_ZONE_NAME || ''),
      'import.meta.env.BUNNY_STORAGE_ZONE_PASSWORD': JSON.stringify(process.env.BUNNY_STORAGE_ZONE_PASSWORD || ''),
      'import.meta.env.BUNNY_STORAGE_ZONE_REGION': JSON.stringify(process.env.BUNNY_STORAGE_ZONE_REGION || ''),
      'import.meta.env.BUNNY_CDN_URL': JSON.stringify(process.env.BUNNY_CDN_URL || ''),
    }
  }
});