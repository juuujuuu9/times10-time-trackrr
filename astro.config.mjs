// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import 'dotenv/config';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
      'process.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY),
      'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL),
    }
  }
});