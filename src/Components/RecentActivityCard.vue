<template>
  <v-card class="h-full">
    <v-card-title class="px-6 py-5">
      <h2 class="text-lg font-bold text-[#252830]">Activités récentes</h2>
      <p class="mt-1 text-xs font-normal text-[#848484]">Les dernières actions sur la plateforme</p>
    </v-card-title>

    <v-divider />

    <v-card-text class="px-6 py-5">
      <v-timeline side="end" align="start" density="compact" truncate-line="both">
        <v-timeline-item dot-color="primary" size="x-small">
          <p class="text-sm font-medium text-[#292d38]">Nouvelle entreprise créée</p>
          <p class="mt-1 text-xs text-[#848484]">Ageroute a été ajoutée</p>
          <p class="mt-1 text-[11px] text-gray-400">Il y a 10 minutes</p>
        </v-timeline-item>

        <v-timeline-item dot-color="success" size="x-small">
          <p class="text-sm font-medium text-[#292d38]">Offre activée</p>
          <p class="mt-1 text-xs text-[#848484]">L’offre Premium est maintenant active</p>
          <p class="mt-1 text-[11px] text-gray-400">Il y a 1 heure</p>
        </v-timeline-item>

        <v-timeline-item dot-color="warning" size="x-small">
          <p class="text-sm font-medium text-[#292d38]">Validation requise</p>
          <p class="mt-1 text-xs text-[#848484]">Solibra attend une validation</p>
          <p class="mt-1 text-[11px] text-gray-400">Hier à 16:30</p>
        </v-timeline-item>
      </v-timeline>
    </v-card-text>
  </v-card>
</template>
