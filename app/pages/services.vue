<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked'

const { find } = useStrapi()
const config = useRuntimeConfig()
const nuxtApp = useNuxtApp()

const { data: services } = await useAsyncData(
  'services',
  () => find('services', {
    populate: {
      blocks: { populate: '*' },
    },
  }),
  {
    getCachedData: (key) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
  }
)

const strapiPublicUrl = config.public.strapi.strapiPublicUrl || 'http://localhost:1337'

const serviceItems = computed(() => (services.value?.data as any[]) || [])

const getFileUrl = (file: any) => {
  const path = file?.formats?.medium?.url
    || file?.formats?.small?.url
    || file?.formats?.large?.url
    || file?.url
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${strapiPublicUrl}${path}`
}

// Split blocks by type for each service
const getRichText = (blocks: any[]) =>
  blocks?.filter((b: any) => b.__component === 'shared.rich-text') || []

const getSliderFiles = (blocks: any[]) =>
  blocks?.filter((b: any) => b.__component === 'shared.slider')
    .flatMap((b: any) => b.files || []) || []

// Simple active slider index per service
const sliderIndexes = ref<Record<number, number>>({})
const getSliderIndex = (id: number) => sliderIndexes.value[id] ?? 0
const setSliderIndex = (id: number, i: number) => {
  sliderIndexes.value[id] = i
}
</script>

<template>
  <!-- Hero -->
  <section>
    <div class="py-24 md:py-32 bg-[#D8D8FF] bg-no-repeat bg-cover">
      <div class="px-4 lg:px-0 max-w-6xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
          Nos services
        </h1>
        <p class="text-md md:text-lg mt-8 text-black max-w-lg">
          Découvre ici ce qu'on propose au Girofard. Que tu aies besoin d'accompagnement, d'écoute ou juste d'un endroit sympa, t'es la·e bienvenu·e !
        </p>
      </div>
    </div>
  </section>

  <!-- Services list -->
  <section>
    <div class="max-w-6xl mx-auto px-4 lg:px-0 py-20 space-y-24">
      <article v-for="item in serviceItems" :key="item.id">

        <!-- Service name -->
        <h2 class="text-3xl font-bold text-zinc-900 mb-12">{{ item.name }}</h2>
        <!-- <p class="text-zinc-500 text-base mb-8 max-w-2xl">{{ item.short_description }}</p> -->

        <!-- Rich text blocks -->
        <div
          v-for="block in getRichText(item.blocks)"
          :key="block.id"
          class="max-w-2xl mb-24"
          v-html="marked(block.body)"
        />

        <!-- Slider -->
        <div v-if="getSliderFiles(item.blocks).length > 0" class="mt-8 flex place-content-center align-center">
          <div class="flex gap-[-8px] pb-4 max-w-6xl">
            <div
              v-for="(file, i) in getSliderFiles(item.blocks)"
              :key="file.id"
              class="flex-shrink-0 snap-start"
              :class="i % 2 === 0 ? 'rotate-[-3deg]' : 'rotate-[3deg]'"
            >
              <img
                :src="getFileUrl(file)"
                :alt="file.alternativeText || file.name"
                class="h-32 md:h-48 w-auto rounded-[10px] object-cover shadow-md border border-black/10"
              />
            </div>
          </div>
        </div>

        <!-- Divider -->
        <!-- <hr class="mt-16 border-zinc-200" /> -->
      </article>
    </div>
  </section>
</template>