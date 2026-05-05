<script setup lang="ts"></script>

<template>
  <div class="items-center max-w-6xl justify-center flex flex-col min-h-screen mx-auto">
    <!-- <h1 class="text-4xl">Tu es passé∙e à cot cot-é</h1>
    <p class="text-xl mt-4">Erreur 404</p> -->
    <h1 class="text-4xl mx-4 font-bold">Le site est encore en développement.</h1>
    <p class="text-xl mt-4 mx-4 mb-8">Pour toute demande, n'hésitez pas à nous contacter ou à passer au local !</p>
    <NuxtLink
                :to="{ path: '/' }"
                class="inline-flex items-left justify-center rounded-[10px] bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-zinc-800"
              >
                Retourner à l'accueil
              </NuxtLink>
    <img class="mt-12 h-[540px]" src="https://admin.le-girofard.org/uploads/medium_Marche_inla_ae2fb2bee2.jpg" alt="Une illustration sur la marche de stonewall" />
    <p class="pt-2"> Illustration <a href="https://www.instagram.com/inlassablee_/" class="hover:underline" target="blank">Inlassablee</a></p>
    <slot />
  </div>
</template>

<style scoped></style>
