<template>
  <v-menu location="bottom end">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        class="ml-2 h-auto px-2 text-none"
      >
        <v-avatar
          color="primary"
          size="38"
          class="mr-3"
        >
          <span class="text-sm font-semibold text-white">
            JT
          </span>
        </v-avatar>

        <div class="hidden text-left sm:block">
          <p class="text-sm font-semibold text-gray-800">
            Jecolia Tieleo
          </p>

          <p class="text-xs text-gray-500">
            Opérateur KAYBIC
          </p>
        </div>

        <v-icon
          icon="mdi-chevron-down"
          size="small"
          class="ml-2"
        />
      </v-btn>
    </template>

    <v-card min-width="230">
      <v-list density="comfortable">
        <v-list-item
          prepend-icon="mdi-account-outline"
          title="Mon profil"
        />

        <v-list-item
          prepend-icon="mdi-cog-outline"
          title="Paramètres"
        />

        <v-divider class="my-2" />

        <v-list-item
          prepend-icon="mdi-logout"
          title="Se déconnecter"
          class="text-red-600"
        />
      </v-list>
    </v-card>
  </v-menu>
</template>
