<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { EnterpriseUser, Mission, MissionInput, Site, Team } from '@/types/administrator'
const props = defineProps<{ mission?: Mission; sites: Site[]; users: EnterpriseUser[]; teams: Team[] }>()
const emit = defineEmits<{ submit: [payload: MissionInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const data = reactive<MissionInput>({ title: props.mission?.title ?? '', siteId: props.mission?.siteId ?? '', startAt: props.mission?.startAt ?? '', endAt: props.mission?.endAt ?? '', supervisorId: props.mission?.supervisorId ?? '', teamId: props.mission?.teamId ?? '', notes: props.mission?.notes ?? '' })
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
const supervisors = computed(() => props.users.filter((user) => user.role === 'supervisor' && user.status === 'active'))
const selectedTeam = computed(() => props.teams.find((team) => team.id === data.teamId))
const selectedLeader = computed(() => props.users.find((user) => user.id === selectedTeam.value?.leadUserId))
const selectedMembers = computed(() => props.users.filter((user) => user.teamId === data.teamId && user.role === 'agent' && user.status !== 'disabled'))
const fullName = (item: EnterpriseUser) => `${item.firstName} ${item.lastName}`
watch(data, () => emit('dirtyChange', true), { deep: true })
async function submit() { const result = await form.value?.validate(); if (!result?.valid) return; emit('dirtyChange', false); emit('submit', { ...data }) }
</script>

<template>
  <v-form ref="form" @submit.prevent="submit">
    <div class="space-y-6">
      <v-card><v-card-title class="flex items-center gap-3 px-6 py-5"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-clipboard-edit-outline" color="primary" /></v-avatar><div><h2 class="text-base font-bold">Cadre de la mission</h2><p class="mt-1 text-xs font-normal text-[#747985]">Objet, site et période d’intervention</p></div></v-card-title><v-divider /><v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2"><v-text-field v-model="data.title" label="Intitulé de la mission" :rules="[required]" class="md:col-span-2" /><v-select v-model="data.siteId" label="Site" :items="sites.filter(site => site.status === 'active')" item-title="name" item-value="id" :rules="[required]" /><v-select v-model="data.teamId" label="Équipe existante" :items="teams" item-title="name" item-value="id" :rules="[required]" /><v-text-field v-model="data.startAt" label="Début" type="datetime-local" :rules="[required]" /><v-text-field v-model="data.endAt" label="Fin" type="datetime-local" :rules="[required]" /><v-textarea v-model="data.notes" label="Instructions" rows="3" class="md:col-span-2" /></v-card-text></v-card>
      <v-card><v-card-title class="flex items-center gap-3 px-6 py-5"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-group-outline" color="primary" /></v-avatar><div><h2 class="text-base font-bold">Encadrement</h2><p class="mt-1 text-xs font-normal text-[#747985]">L’équipe apporte automatiquement son chef et ses agents</p></div></v-card-title><v-divider /><v-card-text class="grid gap-x-5 gap-y-4 px-6 py-6 md:grid-cols-2"><v-select v-model="data.supervisorId" label="Superviseur" :items="supervisors" :item-title="fullName" item-value="id" :rules="[required]" /><div class="rounded-lg border border-[#e1e3e7] px-4 py-3 text-sm"><p class="text-xs text-[#848484]">Chef d’équipe</p><p class="mt-1 font-medium">{{ selectedLeader ? fullName(selectedLeader) : 'À définir dans la page Équipes' }}</p></div><v-alert class="md:col-span-2" type="info" variant="tonal">{{ selectedMembers.length }} agent(s) actif(s) seront affectés avec cette équipe.</v-alert></v-card-text></v-card>
    </div>
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><v-btn variant="outlined" color="secondary" size="large" @click="emit('dirtyChange', false); emit('cancel')">Annuler</v-btn><v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline">{{ mission ? 'Enregistrer les modifications' : 'Planifier la mission' }}</v-btn></div>
  </v-form>
</template>
