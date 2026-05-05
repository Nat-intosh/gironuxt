<script setup lang="ts">
import NotFoundPage from './pages/404.vue'
const props = defineProps<{ error?: { statusCode?: number; message?: string } }>()
</script>

<template>
    <Navbar />
  <div>
    <NotFoundPage v-if="props.error?.statusCode === 404" />
    <div v-else class="min-h-screen flex items-center justify-center p-8 bg-slate-50 text-slate-900">
      <div class="max-w-xl text-center">
        <h1 class="text-5xl font-bold mb-4">Erreur blip blap bloup</h1>
        <p class="text-lg mb-6">{{ props.error?.statusCode || 'Erreur' }} - {{ props.error?.message || 'Une erreur est survenue.' }}</p>
        <nuxt-link to="/" class="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
          Retour à l'accueil
        </nuxt-link>
      </div>
    </div>
  </div>
</template>
