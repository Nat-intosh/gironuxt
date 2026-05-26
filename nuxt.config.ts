export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/strapi', '@nuxt/image'], 
  
  css: ['./app/assets/css/main.css'],
  

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