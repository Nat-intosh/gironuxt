<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDateFrench } from '~/utils/formatDate'

const { findOne, find } = useStrapi()
const config = useRuntimeConfig()

const { data: events } = await useAsyncData(
  'events',
  () => find('events', { populate: ['cover', 'event_category'] })
)

const strapiUrl = config.public.strapi?.url || "http://localhost:1337"

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

const selectedCategory = ref<string | null>(null)

const categoryFilters = computed(() => {
  if (!events.value?.data) return []

  const categories = events.value.data
    .map((event: any) => event.event_category)
    .filter((cat: any) => cat?.public && cat?.category)
    .map((cat: any) => cat.category)

  return Array.from(new Set(categories))
})

const upcomingEvents = computed(() => {
  if (!events.value?.data) return []
  
  const now = new Date()
  return events.value.data
    .filter((event: any) => new Date(event.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

const filteredEvents = computed(() => {
  if (!selectedCategory.value) return upcomingEvents.value
  return upcomingEvents.value.filter((event: any) => event.event_category?.category === selectedCategory.value)
})

const filteredThisWeekEvents = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // End of current week (Saturday)
  
  return filteredEvents.value.filter((event: any) => {
    const eventDate = new Date(event.date)
    return eventDate >= startOfWeek && eventDate <= endOfWeek
  })
})

const filteredNextWeekEvents = computed(() => {
  const now = new Date()
  const startOfNextWeek = new Date(now)
  startOfNextWeek.setDate(now.getDate() - now.getDay() + 7) // Start of next week (Sunday)
  const endOfNextWeek = new Date(startOfNextWeek)
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6) // End of next week (Saturday)
  
  return filteredEvents.value.filter((event: any) => {
    const eventDate = new Date(event.date)
    return eventDate >= startOfNextWeek && eventDate <= endOfNextWeek
  })
})

const filteredRemainingEvents = computed(() => {
  const now = new Date()
  const endOfNextWeek = new Date(now)
  endOfNextWeek.setDate(now.getDate() - now.getDay() + 13) // End of next week (Saturday)
  
  return filteredEvents.value.filter((event: any) => {
    const eventDate = new Date(event.date)
    return eventDate > endOfNextWeek
  })
})

const toggleCategory = (category: string) => {
  selectedCategory.value = selectedCategory.value === category ? null : category
}

</script>


<template>
  <div class="flex flex-col items-center justify-center py-20 max-w-6xl mx-4 lg:mx-auto">
    <div class="">
      <h2 class="text-base uppercase text-zinc-900">L'agenda</h2>
      <p class="text-2xl font-semibold text-zinc-900 mb-6">On se voit quand ?</p>

      <div class="mb-6 flex flex-wrap gap-2">
        <!-- <span class="text-sm font-medium text-zinc-700">Filtres :</span> -->
        <button
          v-for="category in categoryFilters"
          :key="category"
          type="button"
          @click="toggleCategory(category)"
          class="inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition focus:outline-none"
          :class="selectedCategory === category
            ? 'border-zinc-900 bg-zinc-900 text-white'
            : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-900 hover:text-zinc-900'"
        >
          <span>{{ category }}</span>
          <span v-if="selectedCategory === category" class="text-xs">✕</span>
        </button>
      </div>

      <h3 class="text-lg font-semibold text-zinc-900 py-4">Cette semaine</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article v-for="item in filteredThisWeekEvents" :key="item.id">
              <div class="flex items-center p-2 border border-black/10 hover:border-black/20 transition-colors rounded-xl w-lg lg:w-sm h-full">
                  <img v-if="item.cover" :src="getImageUrl(item)" alt="Event cover" class="max-w-[118px] h-full rounded-lg object-cover aspect-3/4" />
                  <div class="ml-4">
                      <div class="mt-2 text-sm text-zinc-600 flex items-center gap-1.5">
                          {{ formatDateFrench(item.date) }} </div>
                      <h3 class="text-lg text-zinc-900 mt-4 break-all">{{item.name}}</h3>
                      <p class="text-sm w-fit text-zinc-600 border rounded-full px-2 mt-2 border-zinc-400">{{item.event_category?.category}}</p>
                      <p class="pt-4 text-base text-zinc-600 break-all whitespace-normal line-clamp-2">{{item.shortdescription}}</p>
                      <div class="text-sm mt-4 mb-2 text-zinc-600 flex items-center gap-1.5">{{ item.place }}</div>
                  </div>
              </div>
            </article>
        </div>

      <h3 class="text-lg font-semibold text-zinc-900 py-4">Semaine prochaine</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article v-for="item in filteredNextWeekEvents" :key="item.id">
              <div class="flex items-center p-2 border border-black/10 hover:border-black/20 transition-colors rounded-xl w-lg lg:w-sm h-full">
                  <img v-if="item.cover" :src="getImageUrl(item)" alt="Event cover" class="max-w-[118px] h-full rounded-lg object-cover aspect-3/4" />
                  <div class="ml-4">
                      <div class="mt-2 text-sm text-zinc-600 flex items-center gap-1.5">
                          {{ formatDateFrench(item.date) }} </div>
                      <h3 class="text-lg text-zinc-900 mt-4 break-all">{{item.name}}</h3>
                      <p class="text-sm w-fit text-zinc-600 border rounded-full px-2 mt-2 border-zinc-400">{{item.event_category?.category}}</p>
                      <p class="pt-4 text-base text-zinc-600 break-all whitespace-normal line-clamp-2">{{item.shortdescription}}</p>
                      <div class="text-sm mt-4 mb-2 text-zinc-600 flex items-center gap-1.5">{{ item.place }}</div>
                  </div>
              </div>
            </article>
        </div>

      <h3 class="text-lg font-semibold text-zinc-900 py-4">Et le reste</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article v-for="item in filteredRemainingEvents" :key="item.id">
              <div class="flex items-center p-2 border border-black/10 hover:border-black/20 transition-colors rounded-xl w-lg lg:w-sm h-full">
                  <img v-if="item.cover" :src="getImageUrl(item)" alt="Event cover" class="max-w-[118px] h-full rounded-lg object-cover aspect-3/4" />
                  <div class="ml-4">
                      <div class="mt-2 text-sm text-zinc-600 flex items-center gap-1.5">
                          {{ formatDateFrench(item.date) }} </div>
                      <h3 class="text-lg text-zinc-900 mt-4 break-all">{{item.name}}</h3>
                      <p class="text-sm w-fit text-zinc-600 border rounded-full px-2 mt-2 border-zinc-400">{{item.event_category?.category}}</p>
                      <p class="pt-4 text-base text-zinc-600 break-all whitespace-normal line-clamp-2">{{item.shortdescription}}</p>
                      <div class="text-sm mt-4 mb-2 text-zinc-600 flex items-center gap-1.5">{{ item.place }}</div>
                  </div>
              </div>
            </article>
        </div>
    </div>
  </div>
</template>