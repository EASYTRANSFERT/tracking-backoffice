<template>
  <v-navigation-drawer
    permanent
    width="270"
    class="border-e"
  >
    <div class="flex h-full flex-col">
      <div class="flex h-24 items-center px-6">
        <img
          src="@/assets/kaybiclogo.png"
          alt="Kaybic Africa"
          class="h-14 w-auto object-contain"
        />
      </div>

      <v-divider />

      <div class="px-4 pt-6">
        <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Navigation
        </p>

        <v-list
          nav
          density="comfortable"
          color="primary"
        >
          <v-list-item
            prepend-icon="mdi-view-dashboard-outline"
            title="Tableau de bord"
            value="dashboard"
            active
            rounded="lg"
          />

          <v-list-item
            prepend-icon="mdi-domain-plus"
            title="Nouvelle entreprise"
            value="new-company"
            rounded="lg"
          />

          <v-list-item
            prepend-icon="mdi-domain"
            title="Entreprises"
            value="companies"
            rounded="lg"
          />

          <v-list-item
            prepend-icon="mdi-briefcase-outline"
            title="Offres"
            value="offers"
            rounded="lg"
          />
        </v-list>
      </div>

      <v-spacer />

      <div class="px-4 pb-6">
        <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Mon compte
        </p>

        <v-list
          nav
          density="comfortable"
        >
          <v-list-item
            prepend-icon="mdi-cog-outline"
            title="Paramètres"
            value="settings"
            rounded="lg"
          />

          <v-list-item
            prepend-icon="mdi-logout"
            title="Se déconnecter"
            value="logout"
            rounded="lg"
            class="text-red-600"
          />
        </v-list>
      </div>
    </div>
  </v-navigation-drawer>
</template>
