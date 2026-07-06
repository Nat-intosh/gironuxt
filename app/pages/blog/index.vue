<template>
  <!-- Hero -->
  <section>
    <div class="py-24 md:py-32 bg-[#D8D8FF] bg-no-repeat bg-cover">
      <div class="px-4 lg:px-0 max-w-6xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
          Notre blog
        </h1>
        <p class="text-md md:text-lg mt-8 text-black max-w-lg">
          On a plein d'actualités au Giro, tu pourras retrouver ici certaines d'entre elles. Elles sont rédigées par les salarié∙es, les stagiaires, et les bénévoles du Girofard !
        </p>
      </div>
    </div>
  </section>
  <div class="container max-w-6xl mx-auto py-12 px-4 lg:px-0">
    <div class="mb-8">
        <!-- <h2 class="text-base uppercase text-zinc-900">L'agenda</h2> -->
        <p class="text-2xl font-semibold text-zinc-900 mb-4">Nos dernières news</p>

        <span class="text-sm font-medium text-zinc-700">Filtrer les articles :</span>
        <!-- Système de filtre par catégories -->
        <div class="flex flex-wrap gap-2 mt-2 pb-4">
          <button 
            @click="selectedCategory = 'Toutes'"
            :class="['inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition focus:outline-none', selectedCategory === 'Toutes' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 hover:border-zinc-600 bg-white text-zinc-700 hover:bg-[#F5FEF6] hover:text-zinc-900']"
          >
            Toutes
          </button>
          <button 
            v-for="category in categories" 
            :key="category"
            @click="selectedCategory = category"
            :class="['inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition focus:outline-none', selectedCategory === category ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 hover:border-zinc-600 bg-white text-zinc-700 hover:bg-[#F5FEF6] hover:text-zinc-900']"
          >
            {{ category }}
          </button>
        </div>
        
      </div>

    <!-- Grille des articles -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <NuxtLink 
        v-for="article in filteredArticles" 
        :key="article.id" 
        :to="`/blog/${article.slug}`"
        class="bg-[#F5FEF6] relative rounded-xl border border-black/5 overflow-hidden transition-shadow flex flex-col"
      >

      <!-- Badge "À la une" -->
        <div v-if="article.is_highlighted" class="absolute top-4 right-4 bg-[#78E0AF] text-green-900 text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          À la une
        </div>
        
        <!-- Image de couverture -->
        <div class="h-48 overflow-hidden bg-gray-100">
          <img 
            v-if="article.cover" 
            :src="getStrapiMedia(article.cover.url)" 
            :alt="article.cover.alternativeText || article.title"
            class="w-full h-full object-cover"
          />
        </div>
        
        <!-- Contenu de la carte -->
        <div class="p-6 flex flex-col flex-grow">
          <span v-if="article.category" class="text-sm text-[#14663E] font-semibold uppercase tracking-wider mb-2">
            {{ article.category.name }}
          </span>
          <h2 class="text-xl font-semibold mb-3 text-gray-900">{{ article.title }}</h2>
          <p class="text-gray-600 mb-4 line-clamp-3">{{ article.description }}</p>
          
          <div class="mt-auto flex items-center text-sm text-gray-500">
            <span v-if="article.author" class="mr-4">Par {{ article.author.name }}</span>
            <span>{{ formatDate(article.publishedAt) }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Message si aucun article -->
    <div v-if="filteredArticles.length === 0" class="text-center text-gray-500 py-12">
      Aucun article trouvé pour cette catégorie.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const { find } = useStrapi()
const config = useRuntimeConfig()

// Récupération des articles avec la couverture, la catégorie et l'auteur
const { data: articlesResponse } = await useAsyncData('articles', () =>
  find('articles', {
    populate: ['cover', 'category', 'author']
  })
)

const articles = computed(() => articlesResponse.value?.data || [])

// Extraction des catégories uniques pour générer les boutons de filtres
const categories = computed(() => {
  const cats = articles.value
    .map(article => article.category?.name)
    .filter(Boolean) // Retire les articles sans catégorie
  
  return [...new Set(cats)] // Enlève les doublons
})

// Gestion de l'état du filtre
const selectedCategory = ref('Toutes')

// Filtrage réactif des articles
// Filtrage et Tri réactif des articles
const filteredArticles = computed(() => {
  // 1. On filtre d'abord par catégorie
  let result = articles.value
  if (selectedCategory.value !== 'Toutes') {
    result = result.filter(article => article.category?.name === selectedCategory.value)
  }

  // 2. On trie le résultat
  // On utilise [...result] pour créer une copie et ne pas muter le tableau d'origine
  return [...result].sort((a, b) => {
    // Règle 1 : Mettre en avant les articles highlight
    if (a.is_highlighted && !b.is_highlighted) return -1 // 'a' remonte
    if (!a.is_highlighted && b.is_highlighted) return 1  // 'b' remonte
    
    // Règle 2 : Si les deux sont highlight (ou aucun des deux), on trie par date la plus récente
    const dateA = new Date(a.publishedAt || a.createdAt).getTime()
    const dateB = new Date(b.publishedAt || b.createdAt).getTime()
    return dateB - dateA
  })
})

// Fonction utilitaire pour formater la date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('fr-FR', options)
}

// Fonction utilitaire pour construire l'URL de l'image
const getStrapiMedia = (url: string) => {
  if (url.startsWith('http')) return url
  const strapiUrl = config.public.strapi?.url || 'http://localhost:1337'
  return `${strapiUrl}${url}`
}
</script>