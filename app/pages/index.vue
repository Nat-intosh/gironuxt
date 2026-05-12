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

const targetPrideDate = computed(() => new Date(global.value?.data?.pride_date)) || new Date('2026-05-30T14:00:00')
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
                    <a class="px-5 py-3 rounded-[10px] bg-[#78E0AF] text-black font-semibold flex items-center gap-2 hover:bg-indigo-600/5 active:scale-95 transition-all" type="button" href="mailto:contact@le-girofard.org">
                        <span>nous contacter</span>
                    </a>
                </div>
            </div>
        </div>
      </div>
    </section>
    
    <!-- SERVICES -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos services</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Qu'est-ce qu'on propose ici ?</p>
        <div class="grid mb-8 bg-neutral-primary-soft border border-default rounded-[10px] shadow-xs md:mb-12 md:grid-cols-4 grid-cols-2 pt-4 bg-[#F5FEF6]">
          <article v-for="item in serviceItems" :key="item.id" class="h-full">
            <figure class="flex flex-col h-full items-left px-4 py-8 md:p-8 text-left border-b border-default rounded-t-[10px] md:rounded-t-none md:rounded-d-[10px] border-e">
                  <blockquote class="max-w-2xl mx-auto text-body h-full flex flex-col">
                      <h3 class="text-lg font-semibold text-heading">{{item.name}}</h3>
                      <p class="my-4 flex-1">{{item.short_description}}</p>
                      <!-- <div class="text-md text-body">Developer at Open AI</div> -->
                  </blockquote>
              </figure>
            </article>            
        </div>
      </div>
    </section>
    <!-- ACTIONS -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos actions</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Qu'est-ce qu'on fait ?</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article v-for="item in actionsItems" :key="item.id" class="h-full">
            <div class="flex items-stretch md:gap-4 h-full rounded-[10px] py-4 overflow-hidden">
              <img class="object-cover w-1/4 md:w-1/5 h-full rounded-[10px]" :src="getImageUrl(item)" alt="">
              <div class="flex flex-1 flex-col justify-between leading-normal px-4 md:py-0">
                <h5 class="text-lg font-semibold text-heading mb-2">{{item.name}}</h5>
                <p class="text-body">{{item.short_description}}</p>
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
          <NuxtLink to="/calendar" class="text-zinc-900 hover:underline underline font-semibold">Voir tous les événements</NuxtLink>
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
              <p class="text-base text-zinc-700 max-w-2xl">Cette année on fête les 30 ans des fiertés à Bordeaux, alors on fait tout notre possible pour que vous passiez un super moment :)</p>
            </div>
            <div class="flex flex-col gap-4">
              <a
                href="mailto:contact@le-girofard.org"
                class="inline-flex items-left justify-center rounded-[10px] border border-zinc-900 bg-white px-6 py-4 text-base font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Devenir bénévole
              </a>
              <NuxtLink
                :to="{ path: '/calendar', query: { category: 'Fiertés 2026' } }"
                class="inline-flex items-left justify-center rounded-[10px] bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-zinc-800"
              >
                Découvrir le programme des fiertés
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- ACTUALITES -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16 hidden">
        <h2 class="text-base uppercase text-zinc-900">Actualités</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On est pas peu fier-e-s de ces actus</p>
      </div>
    </section>
    <!-- NEWSLETTER -->
    <section>
      <div class="bg-[#f4a3a7] py-16 px-4 lg:px-0 mb-16">
        <div class="w-full max-w-6xl mx-auto">
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
                  class="block w-full px-4 py-4 bg-neutral-secondary-medium rounded-[10px] border border-zinc-900 text-heading text-base rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" 
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
    <section> 
      <div class="text-center bg-[#A09FE3] py-32 flex flex-col md:items-center justify-center">
        <h2 class="text-4xl font-semibold text-black mb-2">Le site est encore en développement</h2>
        <p class="text-lg md:text-xl text-black px-2"><br />Pour toute demande, n'hésitez pas à nous contacter ou à passer au local !</p>
      </div>
    </section>
</template>
