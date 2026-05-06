<script setup lang="ts">


useSeoMeta
({
  title: 'Le Girofard - Centre LGBTQIAP+ de Bordeaux',
  ogTitle: 'Le Girofard - Centre LGBTQIAP+ de Bordeaux',
  description: 'Le Centre LGBTQIAP+ de Bordeaux. Centre pour les personnes lesbiennes, gays, bi·es, trans, intersexes, non binaires et leurs allié·es de Bordeaux.',
  ogDescription: 'Le Centre LGBTQIAP+ de Bordeaux. Centre pour les personnes lesbiennes, gays, bi·es, trans, intersexes, non binaires et leurs allié·es de Bordeaux.',
  ogImage: 'https://admin.le-girofard.org/uploads/strapilogo_eced016137.png',
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