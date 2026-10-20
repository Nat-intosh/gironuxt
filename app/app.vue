<script setup lang="ts">


useSeoMeta
({
  title: 'Le Girofard - Centre LGBTQIAP+ de Bordeaux',
  ogTitle: 'Le Girofard - Centre LGBTQIAP+ de Bordeaux',
  description: 'Le Centre LGBTQIAP+ de Bordeaux. Centre pour les personnes lesbiennes, gays, bi·es, trans, intersexes, non binaires et leurs allié·es de Bordeaux.',
  ogDescription: 'Le Centre LGBTQIAP+ de Bordeaux. Centre pour les personnes lesbiennes, gays, bi·es, trans, intersexes, non binaires et leurs allié·es de Bordeaux.',
  ogImage: 'https://admin.le-girofard.org/uploads/strapilogo_eced016137.png',
})

useHead({
  htmlAttrs: {
    class: 'scroll-smooth',
  },
  script: [
    {
      // Runs first, so the settings exist when the widget loads
      innerHTML: `window.LibredeskSettings = {
        baseURL: 'https://chat.le-girofard.org',
        inboxID: '344c9070-72d5-4ea4-a560-9ce33fa2ba65'
      };`,
    },
    {
      src: 'https://chat.le-girofard.org/widget.js',
      defer: true,
    },
  ],
})
  
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <Navbar />
    <NuxtPage />
    <Footer />
  </div>
</template>