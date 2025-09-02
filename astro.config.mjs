import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: false,
    },
  }),
  integrations: [tailwind(), react()],
  vite: {
    define: {
      'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL || ''),
      'process.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY || ''),
      'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL || ''),
      'process.env.SLACK_SIGNING_SECRET': JSON.stringify(process.env.SLACK_SIGNING_SECRET || ''),
      'process.env.SLACK_CLIENT_ID': JSON.stringify(process.env.SLACK_CLIENT_ID || ''),
      'process.env.SLACK_CLIENT_SECRET': JSON.stringify(process.env.SLACK_CLIENT_SECRET || ''),
    }
  }
});