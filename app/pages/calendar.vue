<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatDateFrench, formatDateRangeFrench } from '~/utils/formatDate'

const { findOne, find } = useStrapi()
const config = useRuntimeConfig()
const nuxtApp = useNuxtApp()

const { data: events, refresh } = await useAsyncData(
  'events',
  () => find('events', { 
    populate: ['cover', 'event_category'],
    pagination: {
      pageSize: 100,
    },
    filters: {
      $or: [
        { date: { $gte: new Date().toISOString() } },
        { end_date: { $gte: new Date().toISOString() } }
      ]
    }
  }),
  // { server: true, lazy: false }
)

const strapiUrl = config.public.strapi.strapiPublicUrl || "http://localhost:1337"


const getImageUrl = (item: any) => {
  const path = item.cover?.formats?.small?.url 
    || item.cover?.formats?.thumbnail?.url 
    || item.cover?.url
  
  if (!path) return ''
  // If already absolute, return as-is
  if (path.startsWith('http')) return path
  // Otherwise prepend Strapi base URL
  return `${strapiUrl}${path}`
}

const route = useRoute()

const selectedCategory = ref<string | null>(route.query.category as string || null)
const selectedEvent = ref<any>(null)
const showModal = ref(false)

// Watch for route changes to update selectedCategory
watch(() => route.query.category, (newCategory) => {
  selectedCategory.value = newCategory as string || null
})

const openModal = (event: any) => {
  selectedEvent.value = event
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  setTimeout(() => {
    selectedEvent.value = null
  }, 300)
}

const categoryFilters = computed(() => {
  if (!events.value?.data) return []

  const categories = events.value.data
    .map((event: any) => event.event_category)
    .filter((cat: any) => cat?.public && cat?.category)
    .map((cat: any) => cat.category)

  return Array.from(new Set(categories))
})

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

const upcomingEvents = computed(() => {
  if (!events.value?.data) return []
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
})

const filteredEvents = computed(() => {
  if (!selectedCategory.value) return upcomingEvents.value
  return upcomingEvents.value.filter((event: any) => event.event_category?.category === selectedCategory.value)
})

const filteredThisWeekEvents = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  return filteredEvents.value.filter((event: any) => eventOverlaps(event, startOfWeek, endOfWeek))
})

const filteredNextWeekEvents = computed(() => {
  const now = new Date()
  const startOfNextWeek = new Date(now)
  startOfNextWeek.setDate(now.getDate() - now.getDay() + 7)
  const endOfNextWeek = new Date(startOfNextWeek)
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6)
  endOfNextWeek.setHours(23, 59, 59, 999)

  return filteredEvents.value.filter((event: any) => eventOverlaps(event, startOfNextWeek, endOfNextWeek))
})

const filteredRemainingEvents = computed(() => {
  const now = new Date()
  const endOfNextWeek = new Date(now)
  endOfNextWeek.setDate(now.getDate() - now.getDay() + 13)
  endOfNextWeek.setHours(23, 59, 59, 999)

  return filteredEvents.value.filter((event: any) => {
    const start = new Date(event.date)
    return start > endOfNextWeek
  })
})

const toggleCategory = (category: string) => {
  const newCategory = selectedCategory.value === category ? null : category
  selectedCategory.value = newCategory
  navigateTo({ query: { ...route.query, category: newCategory || undefined } })
}

</script>


<template>

<section>
    <div class="py-24 md:py-32 bg-[#afaee8] bg-no-repeat bg-cover mask-clip-content">
      <div class="flex flex-col-reverse gap-10 md:flex-row px-4 lg:px-0 max-w-6xl mx-auto"> 
            <div class="text-left">
                <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
                    L'agenda
                </h1>

                <p class="text-left text-md md:text-lg mt-8 text-black max-w-lg">
                  Découvre ici les prochains moments de partage en lien avec les luttes LGBTQIAP+. Alors que ce soit des permanences convivialité, des évènements festifs, ou des moments plus sérieux, hésite pas à passer !</p>
                
            </div>
        </div>
      </div>
    </section>
  <div class="flex flex-col items-center justify-center py-20 max-w-6xl mx-4 lg:mx-auto">
    <div class="">
      <!-- <h2 class="text-base uppercase text-zinc-900">L'agenda</h2> -->
      <p class="text-2xl font-semibold text-zinc-900 mb-6">Alors, on se voit quand ?</p>

      <span class="text-sm font-medium text-zinc-700 mb-4">Filtrer les évènements :</span>
      <div class="mb-6 flex flex-wrap gap-2">
        <button
          v-for="category in categoryFilters"
          :key="category"
          type="button"
          @click="toggleCategory(category)"
          class="inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition focus:outline-none"
          :class="selectedCategory === category
            ? 'border-zinc-900 bg-zinc-900 text-white'
            : 'border-zinc-300 hover:border-zinc-600 bg-white text-zinc-700 hover:bg-[#F5FEF6] hover:text-zinc-900'"
        >
          <span>{{ category }}</span>
          <span v-if="selectedCategory === category" class="text-xs">✕</span>
        </button>
      </div>

      <h3 v-if="filteredThisWeekEvents.length > 0" class="text-lg font-semibold text-zinc-900 py-4">Cette semaine</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <article v-for="item in filteredThisWeekEvents" :key="item.id">
              <div 
                @click="openModal(item)"
                class="flex p-2 border border-black/20 hover:border-black/60 transition-all duration-200 rounded-xl w-lg lg:w-sm h-full cursor-pointer bg-[#F5FEF6]"
              >
                  <img v-if="item.cover" :src="getImageUrl(item)" alt="Event cover" class="max-w-[118px] h-full rounded-lg object-cover aspect-3/4 mr-4" />
                  <div class="ml-4">
                      <div class="mt-2 text-sm text-zinc-600 flex items-center gap-1.5">
                          {{ formatDateRangeFrench(item.date, item.end_date) }} </div>
                      <h3 class="text-lg text-zinc-800 mt-4 break-all">{{item.name}}</h3>
                      <p class="text-sm w-fit text-zinc-600 border rounded-full px-2 mt-4 border-black">{{item.event_category?.category}}</p>
                      <p class="pt-6 text-base text-zinc-600 break-all whitespace-normal line-clamp-2">{{item.shortdescription}}</p>
                      <p class="text-sm mt-6 mb-2 text-zinc-600 flex items-center gap-1.5"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg> {{ item.place }}</p>
                  </div>
              </div>
            </article>
        </div>

      <h3 v-if="filteredNextWeekEvents.length > 0" class="text-lg font-semibold text-zinc-900 py-4 pt-16">Semaine prochaine</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <article v-for="item in filteredNextWeekEvents" :key="item.id">
             <div 
                @click="openModal(item)"
                class="flex p-2 border border-black/20 hover:border-black/60 transition-all duration-200 rounded-xl w-lg lg:w-sm h-full cursor-pointer bg-[#F5FEF6]"
              >
                  <img v-if="item.cover" :src="getImageUrl(item)" alt="Event cover" class="max-w-[118px] h-full rounded-lg object-cover aspect-3/4 mr-4" />
                  <div class="ml-4">
                      <div class="mt-2 text-sm text-zinc-600 flex items-center gap-1.5">
                          {{ formatDateRangeFrench(item.date, item.end_date) }} </div>
                      <h3 class="text-lg text-zinc-900 mt-4 break-all">{{item.name}}</h3>
                      <p class="text-sm w-fit text-zinc-600 border rounded-full px-2 mt-4 border-black">{{item.event_category?.category}}</p>
                      <p class="pt-6 text-base text-zinc-600 break-all whitespace-normal line-clamp-2">{{item.shortdescription}}</p>
                      <p class="text-sm mt-6 mb-2 text-zinc-600 flex items-center gap-1.5"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg> {{ item.place }}</p>
                  </div>
              </div>
            </article>
        </div>

      <h3 v-if="filteredRemainingEvents.length > 0" class="text-lg font-semibold text-zinc-900 py-4 pt-16">Prochainement</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <article v-for="item in filteredRemainingEvents" :key="item.id">
              <div 
                @click="openModal(item)"
                class="flex p-2 border border-black/20 hover:border-black/60 transition-all duration-200 rounded-xl w-lg lg:w-sm h-full cursor-pointer bg-[#F5FEF6]"
              >
                  <img v-if="item.cover" :src="getImageUrl(item)" alt="Event cover" class="max-w-[132px] h-full rounded-lg object-cover aspect-3/4 mr-4" />
                  <div class="ml-4">
                      <div class="mt-2 text-sm text-zinc-600 flex items-center gap-1.5">
                          {{ formatDateRangeFrench(item.date, item.end_date) }} </div>
                      <h3 class="text-lg text-zinc-900 mt-4 break-all">{{item.name}}</h3>
                      <p class="text-sm w-fit text-zinc-600 border rounded-full px-2 mt-4 border-black">{{item.event_category?.category}}</p>
                      <p class="pt-6 text-base text-zinc-600 break-all whitespace-normal line-clamp-2">{{item.shortdescription}}</p>
                      <p class="text-sm mt-6 mb-2 text-zinc-600 flex items-center gap-1.5"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg> {{ item.place }}</p>
                  </div>
              </div>
            </article>
        </div>
    </div>

    <!-- Modal -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center" @click.self="closeModal">
        <Transition name="modal-scale">
          <div v-if="showModal" class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <!-- Close button -->
            <div class="sticky top-0 bg-white border-b border-zinc-200 flex items-center justify-between p-6">
              <h2 class="text-2xl font-semibold text-zinc-900">{{ selectedEvent?.name }}</h2>
              <button
                @click="closeModal"
                class="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-6 flex flex-col md:flex-row gap-6">
              <!-- Cover Image on Left -->
              <img 
                v-if="selectedEvent?.cover" 
                :src="getImageUrl(selectedEvent)" 
                alt="Event cover" 
                class="w-full h-full md:w-64 rounded-xl aspect-[3/4] object-cover flex-shrink-0"
              />

              <!-- Info on Right -->
              <div class="flex-1 space-y-4">
                <!-- Date and Location -->
                <div class="space-y-3">
                  <div class="flex items-center gap-3 text-zinc-700">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-lg">{{ formatDateRangeFrench(selectedEvent?.date, selectedEvent?.end_date) }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-zinc-700">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="text-lg">{{ selectedEvent?.place }}</span>
                  </div>
                </div>

                <!-- Category -->
                <div v-if="selectedEvent?.event_category">
                  <p class="text-sm w-fit text-zinc-600 border rounded-full px-3 py-1 border-zinc-400 font-medium">
                    {{ selectedEvent.event_category.category }}
                  </p>
                </div>
              

                <!-- Full Description -->
                <div class="space-y-3 pt-4 border-t border-zinc-200">
                  <h3 class="text-lg font-semibold text-zinc-900">Description</h3>
                  <p v-if="selectedEvent?.longdescription" class="text-zinc-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {{ selectedEvent.longdescription }}
                  </p>
                  <p v-else-if="selectedEvent?.shortdescription" class="text-zinc-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {{ selectedEvent.shortdescription }}
                  </p>
                  
                </div>
                <div class="py-4">
                  <a v-if="selectedEvent?.link" class="px-8 py-3 rounded-[10px] bg-white hover:bg-gray-200 border border-gray-800 text-black active:scale-95 transition-all" type="button" :href="selectedEvent.link" target="_blank">
                        Prends ta place !
                    </a>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Modal Fade Animation - Backdrop */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
}

/* Modal Scale Animation - Content */
.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}

.modal-scale-enter-to,
.modal-scale-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>