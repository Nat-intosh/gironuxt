<!-- <script setup lang="ts">
// Create event type
type event = {
  id: number;
  name: string;
  shortdescription: string;
  longdescription: Text;
  slug: string;
  place: string;
  date: string;
  publishedAt: string;
  cover: {
    url: string;
  };
};

// Strapi API URL
const STRAPI_URL = "http://localhost:1337";

// Create a function to fetch data from the Strapi API
const { data: events } = useFetch<{ data: event[] }>(
  `${STRAPI_URL}/api/events?populate=*`,
);

// Format date
const formatDate = (date: Date) => {
  const options: any = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(date).toLocaleDateString("en-US", options);
};
</script> -->

<script setup lang="ts">
import type { Restaurant } from '~/types'

const { find } = useStrapi()

const response = await find<Events>('events')

</script>


<template>
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-5xl font-extrabold mb-10 text-center">
      Nuxt.js and Strapi Integration
    </h1>

    <section aria-labelledby="events-title" class="space-y-8">
      <h2 id="events-title" class="text-3xl font-bold">Latest events</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <event
          v-for="event in events?.data"
          :key="event.id"
          class="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col"
        >
          <NuxtImg
            :src="`${STRAPI_URL}${event.cover.url}`"
            :alt="`Cover image for ${event.title}`"
            class="w-full h-52 object-cover"
          />

          <div class="p-6 flex flex-col gap-3">
            <h3
              class="text-2xl font-semibold text-gray-900 dark:text-white leading-snug"
            >
              {{ event.name }}
            </h3>

            <p class="text-gray-600 dark:text-gray-300 text-sm italic">
              {{ formatDate(event.publishedAt) }}
            </p>
            <p
              class="text-gray-700 dark:text-gray-400 text-base leading-relaxed line-clamp-4"
            >
              {{ event.shortdescription }}
            </p>
          </div>
        </event>
      </div>
    </section>
  </main>
</template>