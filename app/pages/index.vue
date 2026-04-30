<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatDateFrench } from '~/utils/formatDate'

const { findOne, find } = useStrapi()
const config = useRuntimeConfig()

const { data: events } = await useAsyncData(
  'events',
  () => find('events', { populate: ['cover', 'event_category'] })
)

const { data: services } = await useAsyncData(
  'services',
  () => find('services')
)

const { data: actions } = await useAsyncData(
  'actions',
  () => find('actions', { populate: ['image'] })
)

const getImageUrl = (item: any) => {
  const path = item.cover?.formats?.small?.url 
    || item.cover?.formats?.thumbnail?.url 
    || item.cover?.url
    || item.image?.formats?.small?.url
    || item.image?.formats?.thumbnail?.url
    || item.image?.url
  
  if (!path) return ''
  // If already absolute, return as-is
  if (path.startsWith('http')) return path
  // Otherwise prepend Strapi base URL
  return `${strapiUrl}${path}`
}

const serviceItems = computed(() => services.value?.data || [])
const actionsItems = computed(() => actions.value?.data || [])

const strapiUrl = config.public.strapi?.url || "http://localhost:1337"

</script>

<template>
  <section>
    <div class="flex flex-col-reverse gap-10 md:flex-row px-4 lg:px-0 my-24 md:my-32 max-w-6xl mx-auto"> 
          <div class="">
              <h1 class="text-4xl md:text-6xl/[76px] font-semibold max-w-xl text-black">
                  Le Girofard
              </h1>
              <p class="text-sm text-slate-600">
                Le Centre LGBTQIAP+ de Bordeaux.
              </p>

              <p class="text-sm md:text-base mt-6 max-md:px-2 flex-2 text-slate-600 max-w-lg">
                Le Girofard est le centre pour les personnes lesbiennes, gays, bi, trans intersexe, non binaire et leurs allié·es de Bordeaux. Il a pour objectif d’être un lieu d’accueil, d’écoute et de convivialité.</p>
              <div class="flex items-center gap-4 mt-6">
                  <a class="px-8 py-3 rounded-[10px] bg-white hover:bg-gray-200 border border-gray-800 text-black active:scale-95 transition-all" type="button" href="https://www.helloasso.com/associations/girofard">
                      nous soutenir
                  </a>
                  <a class="px-5 py-3 rounded-[10px] bg-[#78E0AF] text-black font-semibold flex items-center gap-2 hover:bg-indigo-600/5 active:scale-95 transition-all" type="button" href="mailto:contact@le-girofard.org">
                      <span>nous contacter</span>
                  </a>
              </div>
          </div>
          <!-- <div class="w-full md:max-w-xs lg:max-w-lg">
            <img class="w-full h-auto" src="https://congres.bordeaux-tourisme.com/sites/bcb/files/styles/large/public/medias/widgets/misc/Drag%20Bingo%20.jpg.webp" alt="">
          </div> -->
            <!-- <div class="w-full md:max-w-xs lg:max-w-lg">
                <img class="w-full h-auto" src="https://congres.bordeaux-tourisme.com/sites/bcb/files/styles/large/public/medias/widgets/misc/Drag%20Bingo%20.jpg.webp" alt="">
            </div> -->
      </div>
    </section>
    <!-- DEVELOPPEMENT -->
    <section> 
      <div class="text-center bg-[#A09FE3] py-32 flex flex-col md:items-center justify-center">
        <h2 class="text-3xl font-semibold text-black mb-2">Le site est encore en développement</h2>
        <p class="text-md md:text-base text-black px-2"><br />Pour toute demande, n'hésitez pas à nous contacter ou à passer au local !</p>
      </div>
    </section>
    <!-- SERVICES -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos services</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Qu'est-ce qu'on propose ici ?</p>
        <div class="grid mb-8 bg-neutral-primary-soft border border-default rounded-[10px] shadow-xs md:mb-12 md:grid-cols-4 grid-cols-2 pt-4">
          <article v-for="item in serviceItems" :key="item.id" class="h-full">
            <figure class="flex flex-col h-full items-left px-4 py-8 md:p-8 text-left border-b border-default rounded-t-[10px] md:rounded-t-none md:rounded-d-[10px] md:border-e">
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
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
      </div>
    </section>
    <!-- PRIDE -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Pride</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Viens prendre la place dans la rue !</p>
      </div>
    </section>
    <!-- ACTUALITES -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Actualités</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On est pas peu fier-e-s de ces actus</p>
      </div>
    </section>
    <!-- NEWSLETTER -->
    <section>
      <div class="text-center bg-[#A09FE3] py-32 flex flex-col items-center justify-center">
        <h2 class="text-3xl font-semibold text-black mb-6">Tu veux recevoir nos p'tites news dans ta boite mail ?</h2>
        <p class="text-md md:text-base text-black mx-4"><br />Abonne-toi à notre newsletter !</p>
      </div>
    </section>
    <!-- FAQ -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">FAQ</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Des questions qu'on nous pose souvent</p>
      </div>
    </section>
    <!-- ASSOS -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos assos adhérentes</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On est très bien entouré-es</p>
      </div>
    </section>
    <!-- PARTENAIRES -->
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos partenaires</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On les remercie jamais assez</p>
      </div>
    </section>
</template>
