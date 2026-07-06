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
const { data: pageResponse } = await useAsyncData('legalnotice', () =>
  find('legalnotice', {
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
  <div v-if="pageData" class="container mx-auto px-4 py-20 max-w-4xl">
    
    <header class="mb-16 text-center">
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Mentions légales</h1>
      <div class="w-24 h-1 bg-[#14663E] mx-auto rounded-full"></div>
    </header>

    <div v-if="pageData.blocks" class="space-y-10">
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
    <div v-else class="text-center text-gray-500 py-10">
      Contenu en cours de rédaction...
    </div>
  </div>

  <div v-else class="container mx-auto px-4 py-24 text-center">
    <div class="animate-pulse flex flex-col items-center gap-4">
      <div class="h-8 bg-gray-200 rounded w-1/3"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      <div class="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
</template>