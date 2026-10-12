<template>
  <v-card class="h-full">
    <v-card-title class="px-6 py-5">
      <h2 class="text-lg font-bold text-[#252830]">Répartition des offres</h2>
      <p class="mt-1 text-xs font-normal text-[#848484]">Entreprises par formule active</p>
    </v-card-title>

    <v-divider />

    <v-card-text class="space-y-6 px-6 py-6">
      <div>
        <div class="mb-2 flex justify-between text-sm"><span>Premium</span><strong>10</strong></div>
        <v-progress-linear :model-value="72" color="primary" height="8" rounded />
      </div>

      <div>
        <div class="mb-2 flex justify-between text-sm"><span>Standard</span><strong>8</strong></div>
        <v-progress-linear :model-value="56" color="secondary" height="8" rounded />
      </div>

      <div>
        <div class="mb-2 flex justify-between text-sm"><span>Essentiel</span><strong>6</strong></div>
        <v-progress-linear :model-value="42" color="grey-lighten-1" height="8" rounded />
      </div>
    </v-card-text>
  </v-card>
</template>
