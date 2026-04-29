<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatDateFrench } from '~/utils/formatDate'

const { findOne, find } = useStrapi()
const config = useRuntimeConfig()

const { data: events } = await useAsyncData(
  'events',
  () => find('events', { populate: ['cover', 'event_category'] })
)

const { data: services } = await useAsyncData(
  'services',
  () => find('services', { populate: ['icon'] })
)

const { data: actions } = await useAsyncData(
  'actions',
  () => find('actions', { populate: ['image'] })
)

const strapiUrl = config.public.strapi?.url || "http://localhost:1337"

</script>

<template>
  <section>
    <div class="flex flex-col-reverse gap-10 md:flex-row px-4 lg:px-0 my-24 md:my-32 max-w-6xl mx-auto bg-green-100"> 
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
    <section>
      <div class="text-center bg-[#A09FE3] py-32 flex flex-col items-center justify-center">
        <h2 class="text-3xl font-semibold text-black mb-6">Le site est encore en développement</h2>
        <p class="text-md md:text-base text-black mx-4"><br />Pour toute demande, n'hésitez pas à nous contacter ou à passer au local !</p>
      </div>
    </section>
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos services</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Qu'est-ce qu'on propose ici ?</p>
      </div>
    </section>
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos actions</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Qu'est-ce qu'on fait ?</p>
      </div>
    </section>
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">L'agenda</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On se voit quand ?</p>
      </div>
    </section>
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Pride</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Viens prendre la place dans la rue !</p>
      </div>
    </section>
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Actualités</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On est pas peu fier-e-s de ces actus</p>
      </div>
    </section>
    <section>
      <div class="text-center bg-[#A09FE3] py-32 flex flex-col items-center justify-center">
        <h2 class="text-3xl font-semibold text-black mb-6">Tu veux recevoir nos p'tites news dans ta boite mail ?</h2>
        <p class="text-md md:text-base text-black mx-4"><br />Abonne-toi à notre newsletter !</p>
      </div>
    </section>
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">FAQ</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">Des questions qu'on nous pose souvent</p>
      </div>
    </section>
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos assos adhérentes</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On est très bien entouré-es</p>
      </div>
    </section>
    <section>
      <div class="max-w-6xl mx-auto px-4 lg:px-0 py-16">
        <h2 class="text-base uppercase text-zinc-900">Nos partenaires</h2>
        <p class="text-2xl font-semibold text-zinc-900 mb-6">On les remercie jamais assez</p>
      </div>
    </section>
</template>
