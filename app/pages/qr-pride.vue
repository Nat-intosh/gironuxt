<script setup lang="ts">
const target = '/calendar?categories=' + encodeURIComponent('Fiertés 2026') + '&categories=' + encodeURIComponent('QG Des Fiertés')
navigateTo(target)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
    <p class="text-sm">Redirection vers l'agenda…</p>
  </div>
</template>
