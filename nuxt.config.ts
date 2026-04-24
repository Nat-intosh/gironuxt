// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/strapi', '@nuxt/image'],
  strapi: {
    token: "ba719062ee94fe36eaea5730a83f760c4154571738e9df24cb0d06053f46308e67136326a51e71f212a7f2318195dda816b1c806237aaced7b8c3a55692c3e943ef47fbdef08183edbe46d98cc85faab7208203d0c3522bc3eaadfbd38adb1191787b0709ee661926dba65074e13aebfc0379c3858f8b80201845ab8d3851075"
  }
})