<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EnterpriseUser } from '@/types/administrator'

/** Photo de profil d'un utilisateur, avec ses initiales en repli (pas de photo, ou URL signée expirée). */
const props = withDefaults(defineProps<{ user: Pick<EnterpriseUser, 'firstName' | 'lastName' | 'photoUrl'>; size?: number | string }>(), { size: 40 })
const emit = defineEmits<{ photoError: [] }>()
const failed = ref(false)
// Une nouvelle URL (utilisateur relu) redonne sa chance à la photo.
watch(() => props.user.photoUrl, () => { failed.value = false })
const initials = computed(() => `${props.user.firstName[0] ?? ''}${props.user.lastName[0] ?? ''}`.toUpperCase())
function onError() { failed.value = true; emit('photoError') }
</script>

<template>
  <v-avatar color="red-lighten-5" :size="size">
    <v-img v-if="user.photoUrl && !failed" :src="user.photoUrl" :alt="`Photo de ${user.firstName} ${user.lastName}`" cover @error="onError" />
    <span v-else class="font-bold text-primary" :class="Number(size) >= 72 ? 'text-xl' : 'text-xs'">{{ initials }}</span>
  </v-avatar>
</template>
