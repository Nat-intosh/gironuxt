<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const { find } = useStrapi()
const config = useRuntimeConfig()
const { $marked } = useNuxtApp()

const renderMarkdown = (text: string) => {
  return $marked ? $marked(text) : ''
}

// CORRECTION 1 : On nomme bien la variable "serviceResponse"
const { data: serviceResponse } = await useAsyncData(`service-${route.params.slug}`, () =>
  find('services', {
    filters: { slug: route.params.slug },
    populate: ['blocks', 'blocks.file', 'blocks.files', 'link_faq_category', 'link_calendar_category']
  }),
  { dedupe: 'defer',
    server: true,
    lazy: false,
   }
)

// Maintenant, serviceResponse existe bien !
const service = computed(() => serviceResponse.value?.data?.[0])

// 2. Récupération des FAQs liées (uniquement si une catégorie FAQ est liée au service)
const { data: faqsResponse } = await useAsyncData(`service-faqs-${route.params.slug}`, () => {
  const faqCatId = service.value?.link_faq_category?.id
  if (!faqCatId) return Promise.resolve(null)
  
  return find('faqs', {
    filters: {
      // Modifie "faq_category" si le nom de ta relation dans la collection "faq" est différent
      faq_category: { id: faqCatId } 
    },
  })
})
const serviceFaqs = computed(() => faqsResponse.value?.data || [])

// 3. Récupération des Événements liés (uniquement si une catégorie Agenda est liée)
const { data: eventsResponse } = await useAsyncData(`service-events-${route.params.slug}`, () => {
  const eventCatId = service.value?.link_calendar_category?.id
  if (!eventCatId) return Promise.resolve(null)
  
  return find('events', {
    filters: {
      // Modifie "event_category" si le nom de ta relation dans la collection "event" est différent
      event_category: { id: eventCatId },
      // Optionnel : ne récupérer que les événements à venir (date >= aujourd'hui)
      date: { $gte: new Date().toISOString().split('T')[0] }
    },
    populate: ['cover', 'event_category'],
    sort: ['date:asc'], // Du plus proche au plus lointain
    pagination: { limit: 4 } // On limite à 4 pour l'aperçu
  })
})
const upcomingEvents = computed(() => eventsResponse.value?.data || [])

// Outils de formatage
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Fonction pour l'agenda (ex: "Du 12 mai au 14 mai")
const formatDateRangeFrench = (start: string, end: string) => {
  if (!start) return ''
  const startDate = new Date(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  if (!end || start === end) return startDate
  const endDate = new Date(end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return `Du ${startDate} au ${endDate}`
}

// --- LOGIQUE POUR L'ACCORDÉON FAQ ---
const openId = ref<number | null>(null)
const toggle = (id: number) => {
  openId.value = openId.value === id ? null : id
}

const getStrapiMedia = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const strapiUrl = config.public.strapi?.url || 'http://localhost:1337'
  return `${strapiUrl}${url}`
}

const isImage = (mime: string) => mime?.startsWith('image/')
</script>


<template>
  <!-- On s'assure que l'article est bien chargé avant d'afficher -->
  <div v-if="service" class="container mx-auto px-4 py-12 max-w-4xl">
    
    <!-- En-tête de l'article -->
    <header class="mb-10 text-center py-16">
      <span class="text-[#14663E] font-semibold uppercase tracking-wider">
        Accompagnement
      </span>
      <h1 class="text-4xl md:text-5xl font-bold mt-4 mb-6 text-gray-900">{{ service.name }}</h1>
      <div class="text-gray-500 flex lg:items-center lg:justify-center gap-4 text-lg">
        <span>{{ service.short_description }}</span>
      </div>
    </header>

    <!-- Image de couverture -->
    <div v-if="service.icon" class="mb-12 rounded-2xl overflow-hidden shadow-lg">
      <img 
        :src="getStrapiMedia(service.cover.url)" 
        :alt="service.cover.alternativeText || service.title" 
        class="w-full h-auto object-cover max-h-[500px]" 
      />
    </div>

    <!-- Le corps de l'article (Dynamic Zones) -->
    <div class="space-y-10">
      <template v-for="block in service.blocks" :key="block.id">

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
        <!-- <div v-else-if="block.__component === 'shared.slider' && block.files" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <img 
            v-for="file in block.files" 
            :key="file.id" 
            :src="getStrapiMedia(file.url)" 
            :alt="file.alternativeText || file.name" 
            class="w-full h-64 object-cover rounded-lg shadow-sm" 
          />
        </div> -->

        <div v-else-if="block.__component === 'shared.slider' && block.files" class="mt-8 flex place-content-center align-center">
          <div class="flex gap-[-8px] pb-4 max-w-6xl">
            <div
              v-for="file in block.files"
              :key="file.id"
              class="flex-shrink-0 snap-start"
              :class="file.id % 2 === 0 ? 'rotate-[-3deg]' : 'rotate-[3deg]'"
            >
              <img
                :src="getStrapiMedia(file.url)"
                :alt="file.alternativeText || file.name"
                class="h-32 md:h-48 w-auto rounded-[10px] object-cover shadow-md border border-black/10"
              />
            </div>
          </div>
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

      </div> <section v-if="upcomingEvents.length > 0" class="pt-32">
      <p class="text-2xl font-semibold text-zinc-900 mb-8">Les prochaines dates</p>
      
      <div class="flex flex-row gap-4 overflow-x-auto md:overflow-x-visible pb-4">
        <article v-for="item in upcomingEvents" :key="item.id" class="flex-shrink-0 w-80 md:w-auto md:flex-1 md:max-w-sm">
          <div class="flex p-2 border border-black/10 hover:border-black/20 transition-all duration-200 rounded-xl h-full bg-[#F5FEF6]">
            
            <img 
              v-if="item.cover" 
              :src="getStrapiMedia(item.cover.url)" 
              alt="Event cover" 
              class="max-w-[118px] w-full h-full rounded-lg object-cover aspect-[3/4]" 
            />
            
            <div class="ml-4 flex flex-col justify-center">
              <div class="mt-2 text-sm text-[#14663E] font-medium flex items-center gap-1.5">
                {{ formatDateRangeFrench(item.date, item.end_date) }}
              </div>
              
              <h3 class="text-lg text-zinc-900 mt-2 break-normal font-semibold leading-tight">{{ item.name }}</h3>
              
              <p v-if="item.event_category" class="text-xs w-fit text-zinc-600 border rounded-full px-2 mt-2 border-zinc-400">
                {{ item.event_category.name || item.event_category.category }}
              </p>
              
              <p class="pt-3 text-sm text-zinc-600 break-normal whitespace-normal line-clamp-2">
                {{ item.shortdescription || item.description }}
              </p>
              
              <p v-if="item.place" class="text-sm mt-3 mb-1 text-zinc-600 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ item.place }}
              </p>
            </div>

          </div>
        </article>
      </div>
      
      <div class="mt-8">
        <NuxtLink to="/calendar" class="text-[#14663E] hover:text-black-600 hover:underline font-semibold transition-colors">
          Voir l'agenda complet →
        </NuxtLink>
      </div>
    </section>


    <section v-if="serviceFaqs.length > 0" class="pt-16">
      <p class="text-2xl font-semibold text-zinc-900 mb-8">Des questions qu'on nous pose souvent</p>

      <div class="space-y-3">
        <div
          v-for="faq in serviceFaqs"
          :key="faq.id"
          class="rounded-2xl border overflow-hidden transition-all duration-200"
          :class="openId === faq.id ? 'bg-[#F5FEF6] border-[#78E0AF]' : 'bg-white border-zinc-200 hover:border-zinc-300'"
        >
          <button
            class="w-full flex items-center justify-between px-6 py-5 text-left gap-4 outline-none focus:ring-2 focus:ring-[#78E0AF] focus:ring-inset"
            @click="toggle(faq.id)"
          >
            <span class="text-base font-semibold text-zinc-900">{{ faq.question }}</span>
            <span
              class="flex-shrink-0 w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 transition-all duration-300"
              :class="openId === faq.id ? 'rotate-45 bg-[#14663E] border-[#14663E] text-white' : ''"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </span>
          </button>

          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[1000px]"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 max-h-[1000px]"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-show="openId === faq.id" class="px-6 pb-6">
              <div
                class="pt-4 border-t border-[#78E0AF]/30 prose prose-sm max-w-none text-zinc-600"
                v-html="$md(faq.answer)"
              ></div>
            </div>
          </Transition>
        </div>
      </div>
      
      <div class="mt-8">
        <NuxtLink to="/faq" class="text-[#14663E] hover:text-black-600 hover:underline font-semibold transition-colors">
          Consulter toute la FAQ →
        </NuxtLink>
      </div>
    </section>
    </div>
  

  <!-- État de chargement ou 404 -->
  <!-- <div v-else class="container mx-auto px-4 py-24 text-center">
    <h2 class="text-2xl font-bold text-gray-600">Chargement de l'article...</h2>
  </div> -->
</template>