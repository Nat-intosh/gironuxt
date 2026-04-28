<script setup lang="ts">
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

const upcomingEvents = computed(() => {
  if (!events.value?.data) return []
  
  const now = new Date()
  return events.value.data
    .filter((event: any) => new Date(event.date) >= now)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

</script>


<template>
  <div class="flex flex-col items-center justify-center py-20 px-4">
    <h2 class="text-base uppercase text-zinc-900"> L'agenda</h2>
    <p class="text-2xl font-semibold text-zinc-900 mb-6">On se voit quand ?</p>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article v-for="item in upcomingEvents" :key="item.id">
            <div class="flex items-center p-2 border border-black/10 hover:border-black/20 transition-colors rounded-xl w-sm sm:w-[420px] h-full">
                <img v-if="item.cover" :src="getImageUrl(item)" alt="Event cover" class="max-w-[118px] h-full rounded-lg object-cover  aspect-3/4" />
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
</template>