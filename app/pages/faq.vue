<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked' // Removed local renderer

const config = useRuntimeConfig()

const { find } = useStrapi()

const { data: faqs } = await useAsyncData(
  'faqs',
  () => find('faqs', {
    populate: ['faq_category'],
    pagination: { pageSize: 100 }
  }),
  { dedupe: 'defer',
    server: true,
    lazy: false,
   }
)

const { data: docs } = await useAsyncData(
  'docs',
  () => find('docs', {
    populate: ['faq_category', 'File'],
    pagination: { pageSize: 100 }
  }),
  { dedupe: 'defer',
    server: true,
    lazy: false,
   }
)

const faqItems = computed(() => (faqs.value?.data as any[]) || [])
const docItems = computed(() => (docs.value?.data as any[]) || [])

// Group FAQs by category
const groupedFaqs = computed(() => {
  const groups: Record<string, { name: string, items: any[] }> = {}
  for (const faq of faqItems.value) {
    const catName = faq.faq_category?.name || 'Autre'
    if (!groups[catName]) groups[catName] = { name: catName, items: [] }
    groups[catName].items.push(faq)
  }
  return Object.values(groups)
})

// 4. Grouper les Documents par catégorie
const groupedDocs = computed(() => {
  const groups: Record<string, { name: string, items: any[] }> = {}
  for (const doc of docItems.value) {
    const catName = doc.faq_category?.name || 'Autres documents'
    if (!groups[catName]) groups[catName] = { name: catName, items: [] }
    // On s'assure de ne pousser que les docs qui ont bien un fichier attaché
    if (doc.File) {
      groups[catName].items.push(doc)
    }
  }
  return Object.values(groups)
})

// Track which FAQ is open (accordion)
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

</script>

<template>
  <!-- Hero -->
  <section>
    <div class="py-24 md:py-32 bg-[#D8D8FF]">
      <div class="px-4 lg:px-0 max-w-6xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-black max-w-xl text-black">
          La FAQ
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
      <!-- <h2 class="text-base uppercase text-zinc-900">La FAQ</h2>
      <p class="text-2xl font-semibold text-zinc-900 mb-6">Des questions, mais aussi des réponses...</p> -->
      <div v-for="group in groupedFaqs" :key="group.name">

        <!-- Category name -->
        <div class="flex items-center gap-4 mb-8">
          <h3 class="text-lg font-semibold uppercase text-zinc-900">{{ group.name }}</h3>
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
                  v-html="$md(faq.answer)"
                />
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section v-if="groupedDocs.length > 0" class="" id="docs">
    <div class="max-w-6xl mx-auto px-4 lg:px-0 mb-16">
      
      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-black">Ces documents peuvent répondre à tes question</h2>
      </div>

      <div class="space-y-12">
        <div v-for="group in groupedDocs" :key="group.name">
          
          <div class="flex items-center gap-4 mb-6">
            <h3 class="text-lg font-semibold uppercase text-zinc-900">{{ group.name }}</h3>
            <!-- <div class="flex-1 h-px bg-zinc-200" /> -->
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a 
              v-for="doc in group.items" 
              :key="doc.id"
              :href="getStrapiMedia(doc.File.url)"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-start gap-4 p-5 rounded-2xl border border-zinc-200 bg-white hover:border-[#14663E] hover:shadow-lg transition-all"
            >
              <div class="w-12 h-12 rounded-xl bg-[#F5FEF6] text-[#14663E] flex items-center justify-center flex-shrink-0 group-hover:bg-[#14663E] group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-zinc-900 truncate group-hover:text-[#14663E] transition-colors">
                  {{ doc.Name }}
                </h4>
                <p class="text-xs text-zinc-500 uppercase mt-1 font-medium">
                  {{ doc.File.ext.replace('.', '') }} • {{ Math.round(doc.File.size) }} Ko
                </p>
              </div>

              <div class="text-zinc-300 group-hover:text-[#14663E] transition-colors mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
            </a>
          </div>

        </div>
      </div>

    </div>
  </section>
 
</template>