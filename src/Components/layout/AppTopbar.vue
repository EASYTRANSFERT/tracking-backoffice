<template>
  <v-app-bar
    flat
    border
    height="72"
    color="surface"
  >
    <v-app-bar-nav-icon class="d-lg-none" />

    <v-text-field
      prepend-inner-icon="mdi-magnify"
      placeholder="Rechercher..."
      variant="solo-filled"
      density="compact"
      flat
      hide-details
      clearable
      class="ml-4 hidden max-w-sm md:block"
    />

    <v-spacer />

    <v-btn
      icon="mdi-bell-outline"
      variant="text"
      aria-label="Notifications"
    />

    <UserMenu />

    <div class="mr-4" />
  </v-app-bar>
</template>
