<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-6 py-12">
    <v-card class="w-full max-w-lg px-7 py-10 text-center">
      <v-avatar color="red-lighten-5" size="72"><v-icon icon="mdi-map-marker-question-outline" color="primary" size="38" /></v-avatar>
      <p class="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-primary">Erreur 404</p>
      <h1 class="mt-2 text-3xl font-bold text-[#252830]">Page introuvable</h1>
      <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747985]">La page demandée n’existe pas ou a été déplacée.</p>
      <v-btn class="mt-7" color="primary" prepend-icon="mdi-home-outline" :to="{ name: 'dashboard' }">Retour au dashboard</v-btn>
    </v-card>
  </main>
</template>
