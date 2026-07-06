<script setup lang="ts">
import { computed } from 'vue'

const { find } = useStrapi()
const config = useRuntimeConfig()
const { $marked } = useNuxtApp()

const renderMarkdown = (text: string) => {
  return $marked ? $marked(text) : ''
}

// Appel API pour le Single Type "legalnotice"
// Strapi renvoie directement l'objet, on n'a pas besoin de filtrer par slug
const { data: pageResponse } = await useAsyncData('support-us', () =>
  find('support-us', {
    populate: ['blocks', 'blocks.file', 'blocks.files']
  })
)

// On récupère directement les données de la page
const pageData = computed(() => pageResponse.value?.data)

// Outils pour les médias
const getStrapiMedia = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const strapiUrl = config.public.strapi?.url || 'http://localhost:1337'
  return `${strapiUrl}${url}`
}

const isImage = (mime: string) => mime?.startsWith('image/')
</script>

<template>
  <section>
    <div class="py-24 md:py-32 bg-[#D8D8FF] bg-no-repeat bg-cover">
      <div class="px-4 lg:px-0 max-w-6xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
          Nous soutenir
        </h1>
        <p class="text-md md:text-lg mt-8 text-black max-w-lg">
          Découvre ici les différents moyens de soutenir les activités du Girofard. Que ce soit pour les activités à l'anéne ou le mois des fiertés, on a toujours besoin de soutiens !
        </p>
      </div>
    </div>
  </section>
  <section>
    <div v-if="pageData.blocks" class="space-y-10 max-w-4xl mx-auto py-16">
      <template v-for="block in pageData.blocks" :key="block.id">

        <div 
          v-if="block.__component === 'shared.rich-text'" 
          class="prose prose-lg max-w-none text-gray-800" 
          v-html="$md(block.body)"
        ></div>

        <blockquote 
          v-else-if="block.__component === 'shared.quote'" 
          class="p-6 italic border-l-4 border-[#14663E] bg-gray-50 rounded-r-lg"
        >
          <p class="text-xl text-gray-800 mb-2">« {{ block.body }} »</p>
          <footer v-if="block.title" class="text-gray-500 font-semibold">— {{ block.title }}</footer>
        </blockquote>

        <div v-else-if="block.__component === 'shared.media' && block.file">
          <img 
            v-if="isImage(block.file.mime)" 
            :src="getStrapiMedia(block.file.url)" 
            :alt="block.file.alternativeText || block.file.name" 
            class="w-full rounded-xl shadow-md h-auto" 
          />
          
          <a 
            v-else 
            :href="getStrapiMedia(block.file.url)" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="flex items-center gap-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-fit border border-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#14663E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="font-medium text-gray-800">Télécharger : {{ block.file.name }}</span>
          </a>
        </div>

        <div v-else-if="block.__component === 'shared.slider' && block.files" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <img 
            v-for="file in block.files" 
            :key="file.id" 
            :src="getStrapiMedia(file.url)" 
            :alt="file.alternativeText || file.name" 
            class="w-full h-64 object-cover rounded-lg shadow-sm" 
          />
        </div>

        <div 
          v-else-if="block.__component === 'shared.embed' && block.code" 
          class="my-10 w-full flex justify-center [&>iframe]:w-full [&>iframe]:h-auto [&>iframe]:aspect-video [&>iframe]:rounded-xl [&>iframe]:shadow-lg"
          v-html="block.code"
        ></div>

        <div 
          v-else-if="block.__component === 'shared.big-button' && block.link" 
          class="my-12 flex justify-center"
        >
          <a 
            :href="block.link" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-block rounded-[10px] px-5 py-3 bg-[#78E0AF] text-black font-semibold items-center gap-2 hover:bg-indigo-600/5 active:scale-95 transition-all transform"
          >
            {{ block.text || 'En savoir plus' }}
          </a>
        </div>

      </template>
    </div>
  </section>
</template>