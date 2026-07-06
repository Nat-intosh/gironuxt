<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { formatDateFrench, formatDateRangeFrench } from '~/utils/formatDate'

const { findOne, find } = useStrapi()
const config = useRuntimeConfig()
const nuxtApp = useNuxtApp()

const { data: events, refresh } = await useAsyncData(
  'events',
  () => find('events', { 
    populate: ['cover', 'event_category'],
    filters: {
      $or: [
        { date: { $gte: new Date().toISOString() } },
        { end_date: { $gte: new Date().toISOString() } }
      ]
    }
  }),
  { server: true, lazy: false }
)

const { data: services } = await useAsyncData(
  'services',
  () => find('services'),
  { getCachedData: (key) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] }
)

const { data: actions } = await useAsyncData(
  'actions',
  () => find('actions', { populate: ['image'] }),
  { getCachedData: (key) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] }
)

const { data: global } = await useAsyncData(
  'global',
  () => find('global', { populate: ['defaultSeo', 'favicon', 'pride_banner'] }),
  { getCachedData: (key) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] }
)

const { data: assoAdherentes } = await useAsyncData(
  'assoAdherentes',
  () => find('asso-adherentes', { populate: ['Image'] }),
  { getCachedData: (key) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] }
)

const { data: partenaires } = await useAsyncData(
  'partenaires',
  () => find('partenaires', { populate: ['Image'] }),
  { getCachedData: (key) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] }
)

const { data: collectifs } = await useAsyncData(
  'collectifs',
  () => find('collectifs', { populate: ['Image'] }),
  { getCachedData: (key) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] }
)

const { data: homeArticlesResponse } = await useAsyncData('home-articles', () =>
  find('articles', {
    populate: ['cover', 'category', 'author'],
    // On trie d'abord par is_highlighted (les "true" en premier), puis par date de publication
    sort: ['is_highlighted:desc', 'publishedAt:desc'],
    // On limite le résultat à 2 articles max
    pagination: { limit: 2 }
  })
)

const homeArticles = computed(() => homeArticlesResponse.value?.data || [])

const getImageUrl = (item: any) => {
  const path = item.cover?.formats?.small?.url 
    || item.cover?.formats?.thumbnail?.url 
    || item.cover?.url
    || item.pride_banner?.formats?.large?.url
    || item.pride_banner?.url
    || item.Image?.formats?.thumbnail?.url
    || item.image?.formats?.small?.url
    || item.image?.formats?.thumbnail?.url
    || item.image?.url
  
  if (!path) return ''
  // If already absolute, return as-is
  if (path.startsWith('http')) return path
  // Otherwise prepend Strapi base URL
  return `${strapiPublicUrl}${path}`
}

const serviceItems = computed(() => (services.value?.data as any[]) || [])
const actionsItems = computed(() => (actions.value?.data as any[]) || [])
const partenairesItems = computed(() => (partenaires.value?.data as any[]) || [])
const assoAdherentesItems = computed(() => (assoAdherentes.value?.data as any[]) || [])
const collectifsItems = computed(() => (collectifs.value?.data as any[]) || [])

const upcomingEvents = computed(() => {
  if (!events.value?.data) return []
  

// Helper: does an event overlap a given time window?
const eventOverlaps = (event: any, windowStart: Date, windowEnd: Date) => {
  const start = new Date(event.date)
  start.setHours(0, 0, 0, 0)
  const end = event.end_date ? new Date(event.end_date) : new Date(event.date)
  end.setHours(23, 59, 59, 999) // include full last day
  return start <= windowEnd && end >= windowStart
}

const today = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

 const now = today()
  return events.value.data
    .filter((event: any) => {
      // Use end_date if available, otherwise fall back to date
      const endStr = event.end_date || event.date
      const end = new Date(endStr)
      end.setHours(23, 59, 59, 999) // include the full last day
      return end >= now
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)
})

const strapiUrl = config.public.strapi?.url || "http://localhost:1337"
const strapiPublicUrl = config.public.strapi.strapiPublicUrl || "http://localhost:1337"

const targetPrideDate = computed(() => {
  const date = global.value?.data?.pride_date;
  return date ? new Date(date) : new Date('2026-05-30T14:00:00');
})

const countdownLabel = ref('')
let countdownInterval: ReturnType<typeof setInterval> | undefined

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${days} jour${days > 1 ? 's' : ''} ${hours} heure${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''} et ${seconds} seconde${seconds > 1 ? 's' : ''}`
}

const updateCountdown = () => {
  const now = new Date()
  const diff = targetPrideDate.value.getTime() - now.getTime()

  countdownLabel.value = diff <= 0
    ? 'quelques temps'
    : formatCountdown(diff)
}

onMounted(() => {
  updateCountdown()
  countdownInterval = window.setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownInterval !== undefined) {
    clearInterval(countdownInterval)
  }
})

//API CLE
const MAILERLITE_API_KEY = config.public.mailerlite.apiKey;

// State variables for user feedback
const isLoading = ref(false);
const apiError = ref(null);
const apiSuccess = ref(null);

/**
 * Handles the form submission logic.
 */
const subscribeToNewsletter = async () => {
  // 1. Get the input element and its value
  const emailInput = document.getElementById('input-group-1');
  const email = emailInput.value.trim();

  if (!email) {
    apiError.value = 'Please enter an email address.';
    return;
  }

  // 2. Set loading state and clear previous messages
  isLoading.value = true;
  apiError.value = null;
  apiSuccess.value = null;

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use the Bearer token standard for authorization
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    if (!response.ok) {
      // Handle API specific errors (e.g., invalid email format)
      const errorData = await response.json();
      console.error("API Error Details:", errorData);
      apiError.value = `Une erreur s'est produite (Status: ${response.status})`;
    } else {
      // Success!
      apiSuccess.value = "On t'a ajouté à la newsletter ! Merci de ton soutien 💜";
      // Clear input field on success
      (emailInput).value = ''; 
    }
  } catch (e) {
    // Handle network errors (e.g., no internet connection)
    apiError.value = 'Une erreur réseau s\'est produite. Veuillez vérifier votre connexion internet.';
  } finally {
    // 3. Reset loading state regardless of success or failure
    isLoading.value = false;
  }
};

</script>

<template>

<!-- HERO -->
  <section>
    <div class="py-32 md:py-48 bg-[url(~/assets/img/hero-bg.webp)] degragay bg-no-repeat bg-cover mask-clip-content">
      <div class="flex flex-col-reverse gap-10 md:flex-row px-4 lg:px-0 max-w-6xl mx-auto"> 
            <div class="text-left">
                <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
                    Le Girofard
                </h1>
                <p class="text-xl md:text-2xl font-semibold text-black pt-2">
                  Le Centre LGBTQIAP+ de Bordeaux.
                </p>

                <p class="text-left text-md md:text-lg mt-8 text-black max-w-lg">
                  Le Girofard est le centre pour les personnes lesbiennes, gays, bi·es, trans, intersexes, non binaires et leurs allié·es de Bordeaux. Il a pour objectif d’être un lieu d’accueil, d’écoute et de convivialité.</p>
                <div class="flex items-center gap-4 mt-8">
                    <a class="px-8 py-3 rounded-[10px] bg-white hover:bg-gray-200 border border-gray-200 text-black active:scale-95 transition-all" type="button" href="https://www.helloasso.com/associations/girofard">
                        nous soutenir
                    </a>
                    <a class="px-5 py-3 rounded-[10px] bg-[#78E0AF] text-black font-semibold flex items-center gap-2 hover:bg-indigo-600/5 active:scale-95 transition-all" type="button" href="/contact">
                        <span>nous contacter</span>
                    </a>
                </div>
            </div>
        </div>
      </div>
    </section>
    
    <!-- SERVICES -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0  pt-32 pb-16">
        <h2 class="text-base uppercase text-zinc-900">Nos services & activités</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Qu'est-ce qu'on propose ici ?</p>
        <div class="grid mb-8 bg-neutral-primary-soft border border-black/10 rounded-[10px] shadow-xs md:mb-12 md:grid-cols-4 grid-cols-2 pt-4 bg-[#F5FEF6]">
          <article v-for="item in serviceItems" :key="item.id" class="h-full">
            <figure class="flex flex-col h-full items-left px-4 py-8 md:p-8 text-left border-b border-black/10 rounded-t-[10px] md:rounded-t-none md:rounded-d-[10px] border-e">
                  <blockquote class="max-w-2xl mx-auto text-body h-full flex flex-col">
                      <h3 class="text-lg font-semibold text-heading">{{item.name}}</h3>
                      <p class="my-4 flex-1">{{item.short_description}}</p>
                      <nuxt-link :to="item.is_an_activity ? `/activities#${item.slug}` : `/services/${item.slug}`" class="underline lg:hover:underline">en apprendre plus</nuxt-link>
                  </blockquote>
              </figure>
            </article>     
        </div>
      </div>
    </section>
    <!-- ACTIONS -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos interventions</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Qu'est-ce qu'on fait ?</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article v-for="(item, i) in actionsItems" :key="item.id" class="h-full">
            <div class="flex items-stretch md:gap-4 h-full rounded-[10px] py-4 overflow-hidden" :class="[i % 2 !== 0 ? 'flex-row-reverse md:flex-row' : '']">
              <img class="object-cover w-1/4 md:w-1/5 h-full rounded-[10px]" :src="getImageUrl(item)" alt="">
              <div class="flex flex-1 flex-col justify-between leading-normal px-4 md:py-0">
                <h5 class="text-lg font-semibold text-heading mb-2">{{item.name}}</h5>
                <p class="text-body">{{item.short_description}}</p>
                <nuxt-link :to="`/actions#${item.slug}`" class="underline lg:hover:underline mt-4">en apprendre plus</nuxt-link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
    <!-- AGENDA -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">L'agenda</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On se voit quand ?</p>
        <div class="flex flex-row gap-4 overflow-x-auto md:overflow-x-visible">
          <article v-for="item in upcomingEvents" :key="item.id" class="flex-shrink-0 w-80 md:w-auto md:flex-1 md:max-w-sm">
            <div class="flex  p-2 border border-black/10 hover:border-black/20 transition-all duration-200 rounded-xl h-full bg-[#F5FEF6]">
              <img v-if="item.cover" :src="getImageUrl(item)" alt="Event cover" class="max-w-[118px] h-full rounded-lg object-cover aspect-3/4" />
              <div class="ml-4">
                <div class="mt-2 text-sm text-zinc-600 flex items-center gap-1.5">
                  {{ formatDateRangeFrench(item.date, item.end_date) }}
                </div>
                <h3 class="text-lg text-zinc-900 mt-4 break-normal font-semibold">{{item.name}}</h3>
                <p class="text-sm w-fit text-zinc-600 border rounded-full px-2 mt-2 border-zinc-400">{{item.event_category?.category}}</p>
                <p class="pt-4 text-base text-zinc-600 break-normal whitespace-normal line-clamp-2">{{item.shortdescription}}</p>
                <p class="text-sm mt-4 mb-2 text-zinc-600 flex items-center gap-1.5">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ item.place }}
                </p>
              </div>
            </div>
          </article>
        </div>
        <div class="mt-6">
          <NuxtLink to="/calendar" class="text-zinc-900 hover:underline underline font-semibold">Voir tous les événements →</NuxtLink>
        </div>
      </div>
    </section>
    <!-- PRIDE -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Pride</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6 mr-32 lg:mr-0">Viens prendre la place dans la rue !</p>
        <div class="rounded-[10px] border border-black/5 bg-[#F5FEF6] p-6 lg:p-6">
          <img v-if="global?.data" :src="getImageUrl(global?.data)" alt="Pride banner" class="w-full rounded-[10px] border border-black/5 object-cover mb-8" />
          <div class="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] items-center">
            <div>
              <!-- <p class="text-sm uppercase tracking-[0.3em] text-zinc-900/80 mb-3">Pride</p> -->
              <h2 class="text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">On marche dans <span class="font-black text-[#0F172A]">{{ countdownLabel }}</span></h2>
              <p class="text-base text-zinc-700 max-w-2xl">{{global?.data?.pride_description || "Cette année on fête les 30 ans des fiertés à Bordeaux, alors on fait tout notre possible pour que vous passiez un super moment :)"}}</p>
            </div>
            <div class="flex flex-col gap-4">
              <a
                :href="global?.data?.pride_benevole_link || '#'"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-left justify-center rounded-[10px] border border-zinc-900 bg-white px-6 py-4 text-base font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Devenir bénévole
              </a>
              <NuxtLink
                :to="{ path: '/calendar', query: { categories: ['Fiertés 2026', 'QG Des Fiertés'] } }"
                class="inline-flex items-left justify-center rounded-[10px] bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-zinc-800"
              >
                Découvrir le programme des fiertés
              </NuxtLink>
            </div>
          </div>
          <iframe 
            v-if="global?.data?.pride_map" 
            class="w-full mt-8 pt-[-12px] lg:aspect-video aspect-square rounded-[10px]" 
            :src="global?.data?.pride_map"
          ></iframe>        
        </div>
      </div>
    </section>
    <!-- ACTUALITES -->
    <section class="py-16">
      <div class="max-w-6xl mx-auto px-4 lg:px-0">
        <h2 class="text-base uppercase text-zinc-900">Actualités</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On est pas peu fier∙e∙s de ces actus</p>
        
        </div>

        <!-- Grille des 2 articles (reprise du design de la page blog) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 max-w-6xl px-4 lg:px-0 mx-auto">
          <NuxtLink 
            v-for="article in homeArticles" 
            :key="article.id" 
            :to="`/blog/${article.slug}`"
            :class="[
              'relative rounded-xl bg-[#F5FEF6] border border-black/5 overflow-hidden transition-all flex flex-col border border-gray-100'
            ]"
          >
            <!-- Badge "À la une" -->
            <div v-if="article.is_highlighted" class="absolute top-4 right-4 bg-[#78E0AF] text-green-900 text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              À la une
            </div>

            <!-- Image de couverture -->
            <div class="h-64 overflow-hidden bg-gray-100">
              <img 
                v-if="article.cover" 
                :src="getImageUrl(article)" 
                :alt="article.cover.alternativeText || article.title"
                class="w-full h-full object-cover"
              />
            </div>
            
            <!-- Contenu de la carte -->
            <div class="p-6 flex flex-col flex-grow">
              <span v-if="article.category" class="text-sm text-[#14663E] font-semibold uppercase tracking-wider mb-2">
                {{ article.category.name }}
              </span>
              <h3 class="text-2xl font-bold mb-3 text-gray-900">{{ article.title }}</h3>
              <p class="text-gray-600 mb-6 line-clamp-3">{{ article.description }}</p>
              
              <div class="mt-auto flex items-center text-sm text-gray-500 font-medium">
                <span v-if="article.author" class="mr-4">Par {{ article.author.name }}</span>
                <span>{{ formatDateFrench(article.publishedAt) }}</span>
              </div>
            </div>
          </NuxtLink>
          <div class="mt-6">
            <NuxtLink to="/blog" class="text-zinc-900 hover:underline underline font-semibold">Voir tout le blog →</NuxtLink>
          </div>
        </div>

        <!-- Bouton "Voir tout" visible uniquement sur Mobile -->
      
    </section>

    <!-- Section À propos / Histoire du Girofard -->
    <section class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
      <div class="container mx-auto">
        <!-- En-tête de la section -->
        <h2 class="text-base uppercase text-zinc-900">À propos</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6 mr-32 lg:mr-0">Mais c'est quoi le Girofard ?</p>

        <!-- Grille des 3 cartes -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8">
          
          <!-- Carte 1 : Histoire -->
          <div class="bg-[#F5FEF6] p-8 rounded-[10px] border border-black/5 transition-all transform flex flex-col">
            <div class="w-14 h-14 bg-[#f1dcf1] text-[#925FB6] rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-4 text-gray-900">Notre Histoire</h3>
            <div class="text-gray-600 space-y-3 flex-grow">
              <p>
                En 2007, neuf associations luttant pour les droits LGBTQIAP+ décident de se réunir afin de créer un centre dédié à notre communauté.
              </p>
              <p>
                Suite à une Assemblée Constituante le <strong>15 Mars 2007</strong> : Le Girofard est né. C'est aujourd'hui un rassemblement associatif unique, dont le CA est composé d'un maximum de 12 associations et 8 personnes physiques.
              </p>
            </div>
          </div>

          <!-- Carte 2 : L'Équipe -->
          <div class="bg-[#F5FEF6] p-8 rounded-[10px] border border-black/5 transition-all transform flex flex-col">
            <div class="w-14 h-14 bg-[#cbeaf3] text-cyan-600 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-4 text-gray-900">Notre Équipe</h3>
            <div class="text-gray-600 space-y-3 flex-grow">
              <p>
                L'association est portée par une équipe salariée pluridisciplinaire : co-direction, chef·fe de service, chargé de mission médiateur en santé pair, animatrice socio-culturelle, comptable et psychologue.
              </p>
              <p>
                Des <strong>bénévoles</strong> s'engagent également à nos côtés sur des missions longues ou ponctuelles, ainsi que des volontaires en service civique et des stagiaires.
              </p>
            </div>
            <!-- <div class="mt-6 pt-6 border-t border-gray-100">
              <a href="mailto:candidature@le-girofard.org" class="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-2 transition-colors">
                Nous rejoindre en stage
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div> -->
          </div>

          <!-- Carte 3 : Le CA -->
          <div class="bg-[#F5FEF6] p-8 rounded-[10px] border border-black/5 transition-all transform flex flex-col">
            <div class="w-14 h-14 bg-[#ffe2eb] text-[#de487f] rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 class="text-2xl font-bold mb-4 text-gray-900">Le Conseil d'Administration</h3>
            <div class="text-gray-600 space-y-3 flex-grow">
              <p>
                Composé de 10 à 20 membres (60% de personnes morales, 40% physiques), il se réunit mensuellement.
              </p>
              <p>
                Il a pour rôle d'approuver le budget, de gérer les fonds, de définir les orientations stratégiques, et d'élire le bureau. Le CA veille également à la bonne avancée des projets.
              </p>
              <p class="text-sm italic mt-4">
                * Les salarié·e·s peuvent assister aux réunions du CA, mais sans droit de vote.
              </p>
            </div>
          </div>
          <div class="mt-6">
            <NuxtLink to="/faq#docs" class="text-zinc-900 hover:underline underline font-semibold">Voir les rapports d'activité →</NuxtLink>
          </div>
        </div>
      </div>
    </section>
    <!-- NEWSLETTER -->
    <section>
      <div class="pt-16">
        <div class="w-full max-w-6xl mx-auto bg-[#f9b8bb] py-16 px-8 lg:px-8 mb-16 lg:rounded-[10px]">
          <h2 class="text-base uppercase text-zinc-900">Newsletter</h2>
          <p class="text-2xl font-semibold text-black mb-6">Tu veux recevoir nos p'tites news dans ta boite mail ?</p>
          <p class="text-base text-black max-w-2xl mb-6">On t'enverra pas de spam, juste des infos sur nos événements, nos actions et tout ce qui se passe au Girofard !</p>
          <div class="flex flex-col md:flex-row gap-4">
          <!-- Input Field -->
            <div class="flex-grow">
              <input 
                  type="text" 
                  id="input-group-1" 
                  v-model="emailInputLocal" 
                  class="block w-full px-4 py-4 bg-neutral-secondary-medium rounded-[10px] border border-zinc-900 focus:bg-white text-heading text-base rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body transition-all" 
                  placeholder="giradresse@mail.com"
              >
            </div>
            
            <!-- The clickable button (REPLACING THE <a> TAG) -->
            <button
              @click="subscribeToNewsletter"
              :disabled="isLoading"
              class="inline-flex items-center flex-shrink-0 justify-center rounded-[10px] border border-zinc-900 bg-white px-6 py-4 text-base font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading">Envoi...</span>
              <span v-else>s'abonner à la newsletter</span>
            </button>
            </div>
          

            <div v-if="apiError" class="text-red-500 mt-3 text-sm">{{ apiError }}</div>
            <div v-if="apiSuccess" class="text-green-600 mt-3 text-sm">{{ apiSuccess }}</div>
        </div>

        <!-- Display Feedback Messages -->
      </div>
    </section>
    <!-- FAQ -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16 hidden">
        <h2 class="text-base uppercase text-zinc-900">FAQ</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Des questions qu'on nous pose souvent</p>
      </div>
    </section>
    <!-- AUTRES COLLECTIFS -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos collectifs</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Retrouvez les aussi au Girofard !</p>
        <div class="flex flex-row gap-6 overflow-x-scroll ">
          <article v-for="item in collectifsItems" :key="item.id" class="flex-shrink-0 w-[192px]">
            <div class="transition-all duration-200 rounded-xl">
                <img v-if="item.Image" :src="getImageUrl(item)" alt="Event cover" class="w-[128px] border border-black/10 rounded-full object-cover aspect-square" />
                <h3 class="text-lg text-zinc-900 mt-4 break-normal font-semibold">{{item.Name}}</h3>
                <p class="pt-4 text-base text-zinc-600 break-normal whitespace-normal line-clamp-4">{{item.Short_description}}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <!-- ASSOS -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos assos adhérentes</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On est très bien entouré∙es</p>
        <div class="flex flex-row gap-6 overflow-x-scroll ">
          <article v-for="item in assoAdherentesItems" :key="item.id" class="flex-shrink-0 w-[192px]">
            <div class="transition-all duration-200 rounded-xl">
                <img v-if="item.Image" :src="getImageUrl(item)" alt="Event cover" class="w-[128px] border border-black/10 rounded-full object-cover aspect-square" />
                <h3 class="text-lg text-zinc-900 mt-4 break-normal font-semibold">{{item.Name}}</h3>
                <p class="pt-4 text-base text-zinc-600 break-normal whitespace-normal line-clamp-4">{{item.Short_description}}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <!-- PARTENAIRES -->
    <section>
      <div   class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos partenaires</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On les remercie jamais assez</p>
        <div class="flex flex-row gap-6 overflow-x-scroll ">
          <article v-for="item in partenairesItems" :key="item.id" class="flex-shrink-0 w-[192px]">
            <div class="transition-all duration-200 rounded-xl">
                <img v-if="item.Image" :src="getImageUrl(item)" alt="Event cover" class="w-[128px] border border-black/10 rounded-full object-cover aspect-square" />
                <h3 class="text-lg text-zinc-900 mt-4 break-normal font-semibold">{{item.Name}}</h3>
                <p class="pt-4 text-base text-zinc-600 break-normal whitespace-normal line-clamp-4">{{item.Short_description}}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
    <!-- DEVELOPPEMENT -->
    <section class="hidden"> 
      <div class="text-center bg-[#A09FE3] py-32 flex flex-col md:items-center justify-center">
        <h2 class="text-4xl font-semibold text-black mb-2">Le site est encore en développement</h2>
        <p class="text-lg md:text-xl text-black px-2"><br />Pour toute demande, n'hésitez pas à nous contacter ou à passer au local !</p>
      </div>
    </section>
</template>
