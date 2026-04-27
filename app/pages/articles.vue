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
const { findOne, find } = useStrapi()

const { data: events } = await useAsyncData(
  'events',
  () => find('events')
)
</script>


<template>
  <article v-for="item in events?.data" :key="item.id">
    <h2>{{ item.name }}</h2>
    <p>{{ item.shortdescription }}</p>
    <img>{{ item.cover}}</img>
  </article>
</template>