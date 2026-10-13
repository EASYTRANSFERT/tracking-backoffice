<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { EnterpriseUser, Team, TeamInput } from '@/types/administrator'
const props = defineProps<{ team?: Team; users: EnterpriseUser[] }>()
const emit = defineEmits<{ submit: [payload: TeamInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const data = reactive<TeamInput>({ name: props.team?.name ?? '' })
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
watch(data, () => emit('dirtyChange', true), { deep: true })
async function submit() { const result = await form.value?.validate(); if (!result?.valid) return; emit('dirtyChange', false); emit('submit', { ...data }) }
</script>
<template>
  <v-form ref="form" @submit.prevent="submit"><v-card><v-card-title class="flex items-center gap-3 px-6 py-5"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-multiple-plus-outline" color="primary" /></v-avatar><div><h2 class="text-base font-bold">Informations de l’équipe</h2><p class="mt-1 text-xs font-normal text-[#747985]">Créez l’équipe avant de lui rattacher agents et missions.</p></div></v-card-title><v-divider /><v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2"><v-text-field v-model="data.name" label="Nom de l’équipe" :rules="[required]" /><v-alert class="md:col-span-2" type="info" variant="tonal">Le chef et les membres sont affectés depuis leur fiche utilisateur avec le rôle et l’identifiant de cette équipe.</v-alert></v-card-text></v-card><div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><v-btn variant="outlined" color="secondary" size="large" @click="emit('dirtyChange', false); emit('cancel')">Annuler</v-btn><v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline">{{ team ? 'Enregistrer les modifications' : 'Créer l’équipe' }}</v-btn></div></v-form>
</template>
