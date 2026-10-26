<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { EnterpriseUser, EnterpriseUserInput, EnterpriseUserRole, Team } from '@/types/administrator'

const props = withDefaults(defineProps<{
  user?: EnterpriseUser
  teams: Team[]
  loading?: boolean
  fixedRole?: EnterpriseUserRole
  title?: string
  description?: string
  submitLabel?: string
}>(), {
  loading: false,
  fixedRole: undefined,
  title: 'Informations utilisateur',
  description: 'Identité, accès et affectation dans l’entreprise',
  submitLabel: undefined,
})
const emit = defineEmits<{ submit: [payload: EnterpriseUserInput]; cancel: []; dirtyChange: [dirty: boolean] }>()
const form = ref()
const showPassword = ref(false)
const data = reactive<EnterpriseUserInput>({
  employeeNumber: props.user?.employeeNumber ?? '', firstName: props.user?.firstName ?? '',
  lastName: props.user?.lastName ?? '', email: props.user?.email ?? '', phone: props.user?.phone ?? '',
  role: props.fixedRole ?? props.user?.role ?? 'agent', teamId: props.user?.teamId,
  password: '',
})
const roleCanHaveTeam = computed(() => ['teamLeader', 'agent'].includes(data.role))
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
const email = (value: string) => /.+@.+\..+/.test(value) || 'Adresse e-mail invalide'
const normalizePhone = (value: string) => value.replace(/[\s().-]/g, '')
const internationalPhone = (value: string) =>
  /^\+[1-9]\d{7,14}$/.test(normalizePhone(value)) ||
  'Ajoutez l’indicatif pays, par exemple +2250700000000'
const strongEnoughPassword = (value: string) =>
  value.length >= 13 || 'Le mot de passe doit contenir au moins 13 caractères'
watch(data, () => emit('dirtyChange', true), { deep: true })
watch(() => data.role, () => { if (!roleCanHaveTeam.value) data.teamId = undefined })
async function submit() {
  const result = await form.value?.validate()
  if (!result?.valid) return
  emit('dirtyChange', false)
  emit('submit', {
    ...data,
    phone: normalizePhone(data.phone),
    teamId: data.teamId || undefined,
  })
}
</script>

<template>
  <v-form ref="form" @submit.prevent="submit">
    <v-card>
      <v-card-title class="flex items-center gap-3 px-6 py-5"><v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-edit-outline" color="primary" /></v-avatar><div><h2 class="text-base font-bold">{{ title }}</h2><p class="mt-1 text-xs font-normal text-[#747985]">{{ description }}</p></div></v-card-title>
      <v-divider />
      <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
        <v-text-field v-model="data.firstName" label="Prénom" :rules="[required]" />
        <v-text-field v-model="data.lastName" label="Nom" :rules="[required]" />
        <!--<v-text-field v-show="props.user?.role ?? 'agent'" v-model="data.employeeNumber" label="Matricule" :rules="[required]" />-->
        <v-text-field v-model="data.phone" label="Téléphone" placeholder="+2250700000000" hint="Format international avec indicatif pays" persistent-hint inputmode="tel" autocomplete="tel" :rules="[required,internationalPhone]" maxlength="14"/>
        <v-text-field v-if="['supervisor', 'administrator'].includes(props.user?.role ?? data.role)"  v-model="data.password" label="Mot de passe temporaire" :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'" @click:append-inner="showPassword = !showPassword" autocomplete="new-password" hint="13 caractères minimum" persistent-hint counter :rules="[required,strongEnoughPassword]" />
        <v-select v-if="!fixedRole" v-model="data.role" label="Rôle" :items="[{title:'Administrateur',value:'administrator'},{title:'Superviseur',value:'supervisor'},{title:'Chef d’équipe',value:'teamLeader'},{title:'Agent',value:'agent'}]" :rules="[required]" />
        <v-text-field v-else label="Rôle" model-value="Administrateur" readonly />
        <v-text-field v-if="['supervisor', 'administrator'].includes(props.user?.role ?? data.role)" v-model="data.email" label="E-mail professionnel" type="email" :rules="[required,email]" />
        <v-select
          v-if="roleCanHaveTeam"
          v-model="data.teamId"
          label="Équipe"
          :items="teams"
          item-title="name"
          item-value="id"
          clearable
          :hint="data.role === 'teamLeader' ? 'Facultatif — le chef sera rattaché à l’équipe dont il prendra la tête.' : 'Facultatif — l’agent pourra être ajouté à une équipe plus tard.'"
          persistent-hint
        />
        <v-alert v-else type="info" variant="tonal" class="md:col-span-2">
          {{ data.role === 'administrator' ? 'Un administrateur' : 'Un superviseur' }} n’est pas rattaché à une équipe.
        </v-alert>
      </v-card-text>
    </v-card>
    <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><v-btn variant="outlined" color="secondary" size="large" @click="emit('dirtyChange', false); emit('cancel')">Annuler</v-btn><v-btn type="submit" color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading">{{ submitLabel ?? (user ? 'Enregistrer les modifications' : 'Créer et inviter') }}</v-btn></div>
  </v-form>
</template>
