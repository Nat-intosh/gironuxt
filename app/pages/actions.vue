<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const { find } = useStrapi()
const config = useRuntimeConfig()

const { data: actions } = await useAsyncData(
  'actions-page',
  () => find('actions', {
    populate: {
      blocks: { populate: '*' },
    },
  }),
  { lazy: false }
)

const strapiPublicUrl = config.public.strapi.strapiPublicUrl || 'http://localhost:1337'

const actionItems = computed(() => (actions.value?.data as any[]) || [])

const getFileUrl = (file: any) => {
  const path = file?.formats?.medium?.url
    || file?.formats?.small?.url
    || file?.formats?.large?.url
    || file?.url
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${strapiPublicUrl}${path}`
}

const getRichText = (blocks: any[]) =>
  blocks?.filter((b: any) => b.__component === 'shared.rich-text') || []

const getSliderFiles = (blocks: any[]) =>
  blocks?.filter((b: any) => b.__component === 'shared.slider')
    .flatMap((b: any) => b.files || []) || []
</script>

<template>
  <!-- Hero -->
  <section>
    <div class="py-24 md:py-32 bg-[#D8D8FF]">
      <div class="px-4 lg:px-0 max-w-6xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
          Nos actions
        </h1>
        <p class="text-md md:text-lg mt-8 text-black max-w-lg">
          Découvre ce qu'on fait concrètement sur le terrain, dans les écoles, les événements et les milieux professionnels.
        </p>
      </div>
    </div>
  </section>

  <!-- Actions list -->
  <section>
    <div class="max-w-6xl mx-auto px-4 lg:px-0 py-20 space-y-24">
      <article v-for="item in actionItems" :key="item.id">

        <!-- Action name + short desc -->
       
        <h2 class="text-3xl font-bold text-zinc-900 mb-2">{{ item.name }}</h2>

        <!-- Two column layout: text left, images right -->
        <div
          v-if="getRichText(item.blocks).length > 0 || getSliderFiles(item.blocks).length > 0"
          class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-start"
        >
          <!-- Left: rich text -->
          <div class="space-y-6 mt-4">
            <!-- <p class="text-zinc-500 text-base mb-8 max-w-2xl">{{ item.short_description }}</p> -->
            <div
              v-for="block in getRichText(item.blocks)"
              :key="block.id"
              class="prose prose-zinc max-w-none"
              v-html="marked(block.body)"
            />

          </div>

          <!-- Right: angled images stacked vertically -->
          <div
            v-if="getSliderFiles(item.blocks).length > 0"
            class="flex flex-col gap-[-10px] items-center w-56 md:w-64 flex-shrink-0"
          >
            <div
              v-for="(file, i) in getSliderFiles(item.blocks)"
              :key="file.id"
              :class="i % 2 === 0 ? 'rotate-[-2deg]' : 'rotate-[4deg]'"
              class="w-full"
            >
              <img
                :src="getFileUrl(file)"
                :alt="file.alternativeText || file.name"
                class="w-full rounded-2xl object-cover shadow-md border border-black/5 aspect-video"
              />
            </div>
          </div>
        </div>

        <!-- <hr class="mt-16 border-zinc-200" /> -->
      </article>
    </div>
  </section>
</template>