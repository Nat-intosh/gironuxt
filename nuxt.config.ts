import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  

  modules: ['@tailwindcss/vite', '@nuxtjs/strapi', '@nuxt/image'], 
  
  css: ['./app/assets/css/main.css'],
  
  // 2. Added the Vite plugin configuration here
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  
  runtimeConfig: {
    public: {
      strapi: {
        strapiPublicUrl: process.env.NUXT_PUBLIC_STRAPI_PUBLIC_URL || '',
        url: process.env.NUXT_PUBLIC_STRAPI_URL || ''
      },
      mailerlite: {
        apiKey: process.env.NUXT_PUBLIC_MAILERLITE_API_KEY || ''
      }
    }
  },
  
  strapi: {
    url: process.env.NUXT_PUBLIC_STRAPI_URL || '',
    token: process.env.NUXT_PUBLIC_STRAPI_TOKEN || ''
  },
})