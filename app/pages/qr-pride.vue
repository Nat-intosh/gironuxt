<script setup lang="ts">
const target = '/calendar?category=' + encodeURIComponent('Fiertés 2026')
navigateTo(target)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
    <p class="text-sm">Redirection vers l'agenda…</p>
  </div>
</template>
