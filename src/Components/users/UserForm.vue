<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { EnterpriseUser, EnterpriseUserInput } from '@/types/administrator'
const props = withDefaults(defineProps<{ user?: EnterpriseUser; loading?: boolean }>(), { loading: false })
const emit = defineEmits<{ submit: [payload: EnterpriseUserInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const data = reactive<EnterpriseUserInput>({ employeeNumber: props.user?.employeeNumber ?? '', firstName: props.user?.firstName ?? '', lastName: props.user?.lastName ?? '', email: props.user?.email ?? '', phone: props.user?.phone ?? '', role: props.user?.role ?? 'agent', team: props.user?.team ?? '' })
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
const email = (value: string) => /.+@.+\..+/.test(value) || 'Adresse e-mail invalide'
watch(data, () => emit('dirtyChange', true), { deep: true })
async function submit() { const result = await form.value?.validate(); if (!result?.valid) return; emit('dirtyChange', false); emit('submit', { ...data }) }
function cancel() { emit('dirtyChange', false); emit('cancel') }
</script>
<template>
  <v-form ref="form" @submit.prevent="submit"><v-card><v-card-title class="flex items-center gap-3 px-6 py-5"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-edit-outline" color="primary" /></v-avatar><div><h2 class="text-base font-bold">Informations utilisateur</h2><p class="mt-1 text-xs font-normal text-[#747985]">Identité, accès et affectation dans l’entreprise</p></div></v-card-title><v-divider /><v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2"><v-text-field v-model="data.firstName" label="Prénom" :rules="[required]" /><v-text-field v-model="data.lastName" label="Nom" :rules="[required]" /><v-text-field v-model="data.employeeNumber" label="Matricule" :rules="[required]" /><v-text-field v-model="data.email" label="E-mail professionnel" type="email" :rules="[required,email]" /><v-text-field v-model="data.phone" label="Téléphone" :rules="[required]" /><v-select v-model="data.role" label="Rôle" :items="[{title:'Administrateur',value:'administrator'},{title:'Superviseur',value:'supervisor'},{title:'Chef d’équipe',value:'teamLeader'},{title:'Agent',value:'agent'}]" :rules="[required]" /><v-text-field v-model="data.team" label="Équipe ou service" :rules="[required]" /></v-card-text></v-card><div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><v-btn variant="outlined" color="secondary" size="large" @click="cancel">Annuler</v-btn><v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading">{{ user ? 'Enregistrer les modifications' : 'Créer et inviter' }}</v-btn></div></v-form>
</template>

