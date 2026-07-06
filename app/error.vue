<script setup lang="ts">
import NotFoundPage from './pages/404.vue'
const props = defineProps<{ error?: { statusCode?: number; message?: string } }>()
</script>

<template>
    <Navbar />
  <div>
    <NotFoundPage v-if="props.error?.statusCode === 404" />
    <div v-else class="min-h-screen flex items-center justify-center p-8 text-slate-900">
      <div class="max-w-xl text-center">
        <h1 class="text-5xl font-bold mt-5 mb-4">Oops, une petite erreur est survenue</h1>
        <p class="text-xl font-semibold mb-6">On s'en occupe vite, promis. <br> La Girotcheam est déjà sur le coup.</p>
        <p class="text-lg mb-6">{{ props.error?.statusCode || 'Erreur' }} - {{ props.error?.message || 'Une erreur est survenue.' }}</p>
        <nuxt-link to="/" class="inline-flex items-center justify-center rounded-[10px] bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800">
          Retour à l'accueil
        </nuxt-link>
        <img class="mt-12 h-[300px]lg:h-[540px]" src="https://admin.le-girofard.org/uploads/medium_Marche_inla_ae2fb2bee2.jpg" alt="Une illustration sur la marche de stonewall" />
        <p class="pt-2 mb-8"> Illustration : <a href="https://www.instagram.com/inlassablee_/" class="underline" target="blank">Inlassablee</a></p>
      </div>
    </div>
  </div>
  <Footer />
</template>
