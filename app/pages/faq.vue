<script setup lang="ts">
import { computed, ref } from 'vue'
import { marked, Renderer } from 'marked'

const { find } = useStrapi()
const config = useRuntimeConfig()
const nuxtApp = useNuxtApp()

const { data: faqs } = await useAsyncData(
  'faqs',
  () => find('faqs', {
    populate: ['faq_category'],
    pagination: { pageSize: 100 }
  }),
  { getCachedData: (key) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] }
)

const strapiPublicUrl = config.public.strapi.strapiPublicUrl || 'http://localhost:1337'

// Custom renderer — fix image URLs from localhost to production
const renderer = new Renderer()

renderer.paragraph = ({ text }) =>
  `<p class="text-zinc-600 text-base leading-relaxed mb-4">${text}</p>`

renderer.strong = ({ text }) =>
  `<strong class="font-semibold text-zinc-900">${text}</strong>`

renderer.link = ({ href, text }) =>
  `<a href="${href}" class="text-indigo-600 underline hover:text-indigo-800 transition-colors" target="_blank">${text}</a>`

renderer.image = ({ href, text }) => {
  // Replace localhost/127.0.0.1 with production strapi URL
  const fixedHref = href?.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, strapiPublicUrl)
  return `<img src="${fixedHref}" alt="${text}" class="rounded-xl mt-4 mb-2 max-h-64 object-cover w-full border border-black/5 shadow-sm" />`
}

marked.use({ renderer })

// Group FAQs by category
const faqItems = computed(() => (faqs.value?.data as any[]) || [])

const groupedFaqs = computed(() => {
  const groups: Record<string, { name: string, items: any[] }> = {}
  for (const faq of faqItems.value) {
    const catName = faq.faq_category?.name || 'Autre'
    if (!groups[catName]) groups[catName] = { name: catName, items: [] }
    groups[catName].items.push(faq)
  }
  return Object.values(groups)
})

// Track which FAQ is open (accordion)
const openId = ref<number | null>(null)
const toggle = (id: number) => {
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <!-- Hero -->
  <section>
    <div class="py-24 md:py-32 bg-[#D8D8FF]">
      <div class="px-4 lg:px-0 max-w-6xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
          FAQ
        </h1>
        <p class="text-md md:text-lg mt-8 text-black max-w-lg">
          Des questions qu'on nous pose souvent. Si t'as pas trouvé ta réponse, hésite pas à nous contacter !
        </p>
      </div>
    </div>
  </section>

  <!-- FAQ by category -->
  <section>
    <div class="max-w-6xl mx-auto px-4 lg:px-0 py-20 space-y-16">
      <div v-for="group in groupedFaqs" :key="group.name">

        <!-- Category name -->
        <div class="flex items-center gap-4 mb-8">
          <span class="text-lg font-semibold uppercase text-zinc-900">{{ group.name }}</span>
          <!-- <div class="flex-1 h-px bg-zinc-200" /> -->
        </div>

        <!-- Questions accordion -->
        <div class="space-y-3">
          <div
            v-for="faq in group.items"
            :key="faq.id"
            class="rounded-2xl border border-zinc-200 overflow-hidden transition-all duration-200"
            :class="openId === faq.id ? 'bg-[#F5FEF6] border-zinc-300' : 'bg-white hover:border-zinc-300'"
          >
            <!-- Question row -->
            <button
              class="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
              @click="toggle(faq.id)"
            >
              <span class="text-base font-semibold text-zinc-900">{{ faq.question }}</span>
              <span
                class="flex-shrink-0 w-7 h-7 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 transition-transform duration-300"
                :class="openId === faq.id ? 'rotate-45 bg-zinc-900 border-zinc-900 text-white' : ''"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </button>

            <!-- Answer -->
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[1000px]"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 max-h-[1000px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="openId === faq.id" class="px-6 pb-6">
                <div
                  class="pt-2 border-t border-zinc-200"
                  v-html="marked(faq.answer)"
                />
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>