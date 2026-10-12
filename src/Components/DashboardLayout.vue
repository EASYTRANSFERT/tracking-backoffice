<template>
  <v-layout class="min-h-screen bg-background">
    <AppSidebar />

    <AppTopbar />

    <v-main>
      <v-container
        fluid
        class="pa-4 pa-md-8"
      >
        <RouterView />
      </v-container>
    </v-main>
  </v-layout>
</template>
