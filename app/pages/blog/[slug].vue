<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const { find } = useStrapi()
const config = useRuntimeConfig()
const { $marked } = useNuxtApp()

const renderMarkdown = (text: string) => {
  return $marked ? $marked(text) : ''
}
// On récupère l'article en filtrant par le slug de l'URL
// On utilise `populate` pour dire à Strapi de nous renvoyer aussi les relations imbriquées (catégorie, fichiers du composant media, etc.)
const { data: articleResponse } = await useAsyncData(`article-${route.params.slug}`, () =>
  find('articles', {
    filters: { slug: route.params.slug },
    populate: ['cover', 'author', 'category', 'blocks', 'blocks.file', 'blocks.files']
  })
)

// Strapi renvoie toujours un tableau lorsqu'on filtre, donc on prend le premier élément [0]
const article = computed(() => articleResponse.value?.data?.[0])

// Outils de formatage
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getStrapiMedia = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const strapiUrl = config.public.strapi?.url || 'http://localhost:1337'
  return `${strapiUrl}${url}`
}

// Vérifie si le type mime commence par 'image/'
const isImage = (mime: string) => mime?.startsWith('image/')
</script>


<template>
  <!-- On s'assure que l'article est bien chargé avant d'afficher -->
  <div v-if="article" class="container mx-auto px-4 py-12 max-w-4xl">
    
    <!-- En-tête de l'article -->
    <header class="mb-10 text-center">
      <span v-if="article.category" class="text-[#14663E] font-semibold uppercase tracking-wider">
        {{ article.category.name }}
      </span>
      <h1 class="text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">{{ article.title }}</h1>
      <div class="text-gray-500 flex items-center justify-center gap-4 text-sm">
        <span v-if="article.author">Rédigé par {{ article.author.name }}</span>
        <span>•</span>
        <span>{{ formatDate(article.publishedAt) }}</span>
      </div>
    </header>

    <!-- Image de couverture -->
    <div v-if="article.cover" class="mb-12 rounded-2xl overflow-hidden shadow-lg">
      <img 
        :src="getStrapiMedia(article.cover.url)" 
        :alt="article.cover.alternativeText || article.title" 
        class="w-full h-auto object-cover max-h-[500px]" 
      />
    </div>

    <!-- Le corps de l'article (Dynamic Zones) -->
    <div class="space-y-10">
      <template v-for="block in article.blocks" :key="block.id">

        <!-- Bloc : Texte Riche (Markdown) -->
        <div 
          v-if="block.__component === 'shared.rich-text'" 
          class="prose prose-lg max-w-none text-gray-800" 
          v-html="$md(block.body)"
        ></div>

        <!-- Bloc : Citation -->
        <blockquote 
          v-else-if="block.__component === 'shared.quote'" 
          class="p-6 italic border-l-4 border-[#14663E] bg-gray-50 rounded-r-lg"
        >
          <p class="text-xl text-gray-800 mb-2">« {{ block.body }} »</p>
          <footer v-if="block.title" class="text-gray-500 font-semibold">— {{ block.title }}</footer>
        </blockquote>

        <!-- Bloc : Média (Image ou Fichier à télécharger) -->
        <div v-else-if="block.__component === 'shared.media' && block.file">
          <!-- Si le fichier est une image -->
          <img 
            v-if="isImage(block.file.mime)" 
            :src="getStrapiMedia(block.file.url)" 
            :alt="block.file.alternativeText || block.file.name" 
            class="w-full rounded-xl shadow-md h-auto" 
          />
          
          <!-- Si le fichier est un document (PDF, Word, etc.) -->
          <a 
            v-else 
            :href="getStrapiMedia(block.file.url)" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="flex items-center gap-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-fit border border-gray-200"
          >
            <!-- Icône de téléchargement -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#14663E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="font-medium text-gray-800">Télécharger : {{ block.file.name }}</span>
          </a>
        </div>

        <!-- Bloc : Slider (Carrousel d'images) -->
        <div v-else-if="block.__component === 'shared.slider' && block.files" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <img 
            v-for="file in block.files" 
            :key="file.id" 
            :src="getStrapiMedia(file.url)" 
            :alt="file.alternativeText || file.name" 
            class="w-full h-64 object-cover rounded-lg shadow-sm" 
          />
        </div>

        <!-- BLOC EMBED -->
        <div 
          v-else-if="block.__component === 'shared.embed' && block.code" 
          class="my-10 w-full flex justify-center [&>iframe]:w-full [&>iframe]:h-auto [&>iframe]:aspect-video [&>iframe]:rounded-xl [&>iframe]:shadow-lg"
          v-html="block.code"
        ></div>

        <!-- NOUVEAU BLOC : Gros Bouton -->
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
  </div>

  <!-- État de chargement ou 404 -->
  <div v-else class="container mx-auto px-4 py-24 text-center">
    <h2 class="text-2xl font-bold text-gray-600">Chargement de l'article...</h2>
  </div>
</template>