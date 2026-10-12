<template>
  <main class="flex min-h-screen items-center justify-center bg-background px-6 py-12">
    <v-card class="w-full max-w-lg px-7 py-10 text-center">
      <v-avatar color="red-lighten-5" size="72"><v-icon icon="mdi-shield-lock-outline" color="primary" size="38" /></v-avatar>
      <p class="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-primary">Accès refusé</p>
      <h1 class="mt-2 text-3xl font-bold text-[#252830]">Vous n’avez pas accès à cette page</h1>
      <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747985]">Votre rôle ne permet pas de consulter cette ressource.</p>
      <v-btn class="mt-7" color="primary" prepend-icon="mdi-arrow-left" :to="{ name: 'dashboard' }">Retour au dashboard</v-btn>
    </v-card>
  </main>
</template>
