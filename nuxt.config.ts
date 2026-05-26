export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/strapi', '@nuxt/image'],  // removed tailwindcss modules
  css: ['./app/assets/css/main.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
  runtimeConfig: {
    public: {
      strapi: {
        strapiPublicUrl: process.env.NUXT_PUBLIC_STRAPI_PUBLIC_URL || 'http://localhost:1337',
        url: process.env.NUXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
      },
      mailerlite: {
        apiKey: process.env.NUXT_PUBLIC_MAILERLITE_API_KEY || "acab"
      }
    }
  },
  strapi: {
    url: process.env.NUXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
    token: process.env.NUXT_PUBLIC_STRAPI_TOKEN || "..."
  },
})