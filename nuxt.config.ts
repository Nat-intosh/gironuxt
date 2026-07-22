import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: ['@tailwindcss/vite', '@nuxtjs/strapi', '@nuxt/image', 'nuxt-mail'], 
  
  css: ['./app/assets/css/main.css'],
  
  // 2. Added the Vite plugin configuration here
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  mail: {
    message: {
      from: 'no-reply@le-girofard.org',
      to: 'contact@le-girofard.org',
    },
    smtp: {
      service: 'gmail',
      auth: {
        user: 'no-reply@le-girofard.org',
        pass: process.env.GMAIL_APP_KEY,
      },
    },
  },
  
  runtimeConfig: {
    public: {
      strapi: {
        // Now that NUXT_PUBLIC_STRAPI_URL is correct, we point both here for the client
        strapiPublicUrl: process.env.NUXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
        url: process.env.NUXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
      },
      mailerlite: {
        apiKey: process.env.NUXT_PUBLIC_MAILERLITE_API_KEY || ''
      }
    }
  },
  
 strapi: {
    // The Nuxt module automatically intercepts the NUXT_STRAPI_URL environment variable 
    // for server requests, so we just leave the local fallback here.
    url: 'http://localhost:1337',
    token: process.env.NUXT_PUBLIC_STRAPI_TOKEN || ''
  },
})