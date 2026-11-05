<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import AppMissingOption from '@/Components/common/AppMissingOption.vue'
import AppStepperLayout from '@/Components/common/AppStepperLayout.vue'
import AppSummaryList from '@/Components/common/AppSummaryList.vue'
import MissionSitesStep from '@/Components/missions/MissionSitesStep.vue'
import { isFormValid, useStepper, type StepItem } from '@/composables/useStepper'
import { formatLongDateTime } from '@/utils/date-format'
import { fullName, nameOr } from '@/utils/people'
import type { EnterpriseUser, Mission, MissionInput, Site } from '@/types/administrator'

/**
 * supervisors : comptes actifs portant le rôle Superviseur.
 * sites : sites déjà rattachés à la mission, pour le récapitulatif.
 * initialStep : étape affichée à l'ouverture (« sites » au retour de la création d'un site).
 */
const props = defineProps<{ mission?: Mission; supervisors: EnterpriseUser[]; sites: Site[]; loading?: boolean; supervisorsLoading?: boolean; initialStep?: string }>()
const emit = defineEmits<{
  submit: [payload: MissionInput]
  cancel: []
  dirtyChange: [dirty: boolean]
}>()

const steps = [
  { key: 'info', title: 'Informations', subtitle: 'Intitulé et période', description: 'Objet et période d’intervention de la mission', icon: 'mdi-clipboard-edit-outline' },
  { key: 'supervisor', title: 'Superviseur', subtitle: 'Suivi de la mission', description: 'Le superviseur suit la mission, ses équipes et leurs agents depuis le back-office', icon: 'mdi-account-tie-outline' },
  { key: 'sites', title: 'Sites', subtitle: 'Lieux d’intervention', description: 'Rattachez des sites existants ou créez-en de nouveaux', icon: 'mdi-map-marker-radius-outline' },
  { key: 'summary', title: 'Récapitulatif', subtitle: 'Vérification', description: 'Vérifiez les informations de la mission', icon: 'mdi-clipboard-check-outline' },
] satisfies (StepItem & { key: string })[]
// Un site porte sa mission : la mission est donc créée en quittant l'étape « Superviseur », avant d'y rattacher des sites.
const SITES_STEP = 2

const infoForm = ref()
const supervisorForm = ref()
const data = reactive<MissionInput>({
  title: props.mission?.title ?? '',
  startAt: props.mission?.startAt?.slice(0, 16) ?? '',
  endAt: props.mission?.endAt?.slice(0, 16) ?? '',
  notes: props.mission?.notes ?? '',
  supervisorUserId: props.mission?.supervisorUserId ?? '',
})
const required = (value: string) => Boolean(value?.trim()) || 'Ce champ est obligatoire'
// Obligatoire à la création ; en modification, un champ vide laisse le superviseur inchangé.
const supervisorRule = (value: string) => Boolean(props.mission) || Boolean(value) || 'Ce champ est obligatoire'
const validPeriod = () => !data.startAt || !data.endAt || data.endAt > data.startAt || 'La fin doit être postérieure au début'

watch(data, () => emit('dirtyChange', true), { deep: true })

const validators = [() => isFormValid(infoForm.value), () => isFormValid(supervisorForm.value)]
const { current, completed, invalid, isFirst, isLast, canReach, next, previous, goTo, validateAll } = useStepper(steps.length, {
  validate: (index) => validators[index]?.() ?? true,
  freeNavigation: () => Boolean(props.mission),
  initial: Math.max(0, steps.findIndex((step) => step.key === props.initialStep)),
})
// Mission tout juste créée : on enchaîne sur ses sites.
watch(() => props.mission?.id, (id, previousId) => { if (id && !previousId) void goTo(SITES_STEP) })
const isCreating = computed(() => !props.mission && current.value === SITES_STEP - 1)

const summary = computed(() => [
  { label: 'Intitulé', value: data.title, wide: true },
  { label: 'Début prévisionnel', value: formatLongDateTime(data.startAt) },
  { label: 'Fin prévisionnelle', value: formatLongDateTime(data.endAt) },
  { label: 'Superviseur', value: nameOr(props.supervisors.find((user) => user.id === data.supervisorUserId), 'Non renseigné') },
  { label: 'Sites', value: props.sites.map((site) => site.name).join('\n') || 'Aucun site pour l’instant' },
  { label: 'Description', value: data.notes || 'Aucune description.', wide: true },
])

function cancel() {
  emit('dirtyChange', false)
  emit('cancel')
}
async function submit() {
  if (!(await validateAll(props.mission ? undefined : SITES_STEP))) return
  emit('dirtyChange', false)
  emit('submit', { ...data })
}
</script>

<template>
  <AppStepperLayout :steps="steps" :current="current" :completed="completed" :invalid="invalid" :can-reach="canReach" @select="goTo">
    <v-form v-show="current === 0" ref="infoForm" @submit.prevent="next">
      <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
        <v-text-field v-model="data.title" label="Intitulé de la mission*" class="md:col-span-2" :rules="[required]" />
        <v-text-field v-model="data.startAt" label="Début prévisionnel" type="datetime-local" :rules="[validPeriod]" />
        <v-text-field v-model="data.endAt" label="Fin prévisionnelle" type="datetime-local" :rules="[validPeriod]" />
        <v-textarea v-model="data.notes" label="Description" rows="4" class="md:col-span-2" />
      </v-card-text>
    </v-form>
    <v-form v-show="current === 1" ref="supervisorForm" @submit.prevent="isCreating ? submit() : next()">
      <v-card-text class="space-y-4 px-6 py-6">
        <v-select
          v-model="data.supervisorUserId"
          label="Superviseur*"
          :items="supervisors"
          :item-title="fullName"
          item-value="id"
          :loading="supervisorsLoading"
          :rules="[supervisorRule]"
          hint="Le superviseur suit la mission, ses équipes et leurs agents depuis le back-office."
          persistent-hint
        >
          <template #no-data><AppMissingOption text="Aucun superviseur actif." label="Créer un compte superviseur" :to="{ name: 'admin-user-create' }" /></template>
        </v-select>
        <v-alert v-if="!mission" type="info" variant="tonal" text="La mission sera créée en passant à l’étape suivante, pour pouvoir lui rattacher ses sites." />
      </v-card-text>
    </v-form>
    <MissionSitesStep v-if="current === SITES_STEP && mission" :mission="mission" />
    <v-card-text v-if="current === 3" class="px-6 py-6">
      <AppSummaryList :items="summary" />
    </v-card-text>

    <template #actions>
      <v-btn variant="text" color="secondary" size="large" :disabled="loading" @click="cancel">Annuler</v-btn>
      <v-spacer class="hidden sm:block" />
      <v-btn v-if="!isFirst" variant="outlined" color="secondary" size="large" prepend-icon="mdi-arrow-left" :disabled="loading" @click="previous">Précédent</v-btn>
      <v-btn v-if="isCreating" color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading" @click="submit">Créer la mission et continuer</v-btn>
      <v-btn v-else-if="!isLast" color="primary" size="large" append-icon="mdi-arrow-right" @click="next">Suivant</v-btn>
      <v-btn v-else color="primary" size="large" prepend-icon="mdi-content-save-outline" :loading="loading" @click="submit">Enregistrer et terminer</v-btn>
    </template>
  </AppStepperLayout>
</template>
