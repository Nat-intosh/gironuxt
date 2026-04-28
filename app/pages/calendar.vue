<script setup lang="ts">
import { formatDateFrench } from '~/utils/formatDate'

const { findOne, find } = useStrapi()

const { data: events } = await useAsyncData(
  'events',
  () => find('events')
)

</script>


<template>
  <div class="flex flex-col items-center justify-center py-20 px-4">
    <h2 class="text-2xl font-semibold text-zinc-900 mb-6">Nos prochains événements</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
          <!-- Card 1 -->
          <article v-for="item in events?.data" :key="item.id">
            <div class="flex items-center p-2 border border-black/10 hover:border-black/20 transition-colors rounded-xl w-sm sm:w-[420px]">
                <img :src="item.cover?.url || item.cover" alt="Event cover" class="w-full max-w-[118px] rounded-lg object-cover" />
                <div class="ml-4">
                    <div class="mt-2 text-sm text-zinc-600 flex items-center gap-1.5">
                        {{ formatDateFrench(item.date) }} </div>
                    <h3 class="text-lg text-zinc-900 mt-4">{{item.name}}</h3>
                    <p class="truncate text-base text-zinc-600">{{item.shortdescription}}</p>
                    <div class="text-sm mt-4 mb-2 text-zinc-600 flex items-center gap-1.5">{{ item.place }}</div>
                </div>
            </div>
          </article>
       </div>
  </div>
</template>