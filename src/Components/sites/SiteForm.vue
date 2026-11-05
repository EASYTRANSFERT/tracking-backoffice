<script setup lang="ts">
import { fullName, nameOr } from '@/utils/people'
import { computed, reactive, ref, watch } from 'vue'
import AppMissingOption from '@/Components/common/AppMissingOption.vue'
import AppStepperLayout from '@/Components/common/AppStepperLayout.vue'
import AppSummaryList from '@/Components/common/AppSummaryList.vue'
import SitePerimeterFields from '@/Components/sites/SitePerimeterFields.vue'
import SitePerimeterMap from '@/Components/sites/SitePerimeterMap.vue'
import { SITE_POINT_COUNT } from '@/Components/sites/site-map'
import { isFormValid, useStepper, type StepItem } from '@/composables/useStepper'
import type { EnterpriseUser, Mission, Site, SiteInput, SitePoint, Team } from '@/types/administrator'

const props = defineProps<{
  site?: Site; managers: EnterpriseUser[]; missions: Mission[]; teams: Team[]; loading?: boolean; defaultMissionId?: string
  /** Vrai une fois le site créé : la dernière étape (QR code, slot `created`) s'affiche. */
  created?: boolean
}>()
const emit = defineEmits<{ submit: [payload: SiteInput]; cancel: []; dirtyChange: [dirty: boolean] }>()

const steps: StepItem[] = [
  { title: 'Informations', subtitle: 'Nom et emplacement', description: 'Nom du site, adresse et description de l’emplacement', icon: 'mdi-map-marker-plus-outline' },
  { title: 'Périmètre', subtitle: 'Zone de pointage', description: 'Trois points au minimum délimitant la zone de présence autorisée', icon: 'mdi-crosshairs-gps' },
  { title: 'Encadrement', subtitle: 'Mission, superviseur, équipe', description: 'Qui suit le site et quelle équipe y travaille', icon: 'mdi-account-hard-hat-outline' },
  { title: 'Récapitulatif', subtitle: 'Vérification', description: 'Vérifiez les informations avant d’enregistrer', icon: 'mdi-clipboard-check-outline' },
]
// À la création, une dernière étape présente le QR code, généré une fois le site enregistré.
const qrStep: StepItem = { title: 'QR code', subtitle: 'Après la création', description: 'Le site est créé : générez et imprimez son QR code de pointage', icon: 'mdi-qrcode' }
const allSteps = computed(() => props.site ? steps : [...steps, qrStep])

const infoForm = ref()
const governanceForm = ref()
const perimeterFields = ref<InstanceType<typeof SitePerimeterFields>>()
const data = reactive<SiteInput>({
  name: props.site?.name ?? '', address: props.site?.address ?? '', city: props.site?.city ?? '',
  locationDescription: props.site?.locationDescription ?? '',
  latitude: props.site?.latitude ?? '', longitude: props.site?.longitude ?? '',
  missionId: props.site?.missionId ?? props.defaultMissionId ?? undefined, managerId: props.site?.managerId ?? undefined,
  teamId: props.site?.teamId ?? undefined, radiusM: props.site?.radiusM,
})
const points = ref<(SitePoint | null)[]>(Array.from({ length: Math.max(SITE_POINT_COUNT, props.site?.points?.length ?? 0) }, (_, index) => props.site?.points?.[index] ?? null))
const placedPoints = computed(() => points.value.filter((point): point is SitePoint => Boolean(point)))
const required = (value: string) => Boolean(String(value ?? '').trim()) || 'Ce champ est obligatoire'
const requiredChoice = (value?: string) => Boolean(value) || 'Ce champ est obligatoire'
// L'API refuse un site sans adresse ni description de l'emplacement.
const addressOrDescription = () => Boolean(data.address?.trim() || data.locationDescription?.trim()) 
const missionTitle = (item: Mission) => `${item.code} · ${item.title}`
watch([data, points], () => emit('dirtyChange', true), { deep: true })

const validators = [() => isFormValid(infoForm.value), () => perimeterFields.value?.validate() ?? false, () => isFormValid(governanceForm.value)]
const { current, completed, invalid, isFirst, isLast, canReach, next, previous, goTo, validateAll } = useStepper(steps.length, {
  validate: (index) => validators[index]?.() ?? true,
  freeNavigation: () => Boolean(props.site),
})
// Une fois le site créé, les étapes du formulaire sont terminées et ne se rouvrent plus.
const timeline = computed(() => props.created
  ? { current: steps.length, completed: steps.map((_, index) => index), invalid: [], canReach: () => false }
  : { current: current.value, completed: completed.value, invalid: invalid.value, canReach })

const summary = computed(() => {
  const mission = props.missions.find((item) => item.id === data.missionId)
  const manager = props.managers.find((item) => item.id === data.managerId)
  const team = props.teams.find((item) => item.id === data.teamId)
  return [
    { label: 'Nom', value: data.name },
    { label: 'Ville', value: data.city || '—' },
    { label: 'Adresse', value: data.address || '—', wide: true },
    { label: 'Description de l’emplacement', value: data.locationDescription || '—', wide: true },
    { label: 'Mission', value: mission ? missionTitle(mission) : 'Aucune mission' },
    { label: 'Superviseur du site', value: nameOr(manager, '—') },
    { label: 'Équipe', value: team?.name ?? 'Aucune équipe' },
    { label: 'Rayon de tolérance', value: data.radiusM ? `${data.radiusM} m` : 'Rayon par défaut de l’entreprise' },
  ]
})

function setFirstAddress(address: string) {
  if (!data.address?.trim()) data.address = address
}
function cancel() {
  emit('dirtyChange', false)
  emit('cancel')
}
async function submit() {
  if (!(await validateAll())) return
  emit('dirtyChange', false)
  emit('submit', { ...data, radiusM: data.radiusM ? Number(data.radiusM) : undefined, points: placedPoints.value })
}
</script>

<template>
  <AppStepperLayout :steps="allSteps" v-bind="timeline" @select="goTo">
    <slot v-if="created" name="created" />
    <template v-else>
      <v-form v-show="current === 0" ref="infoForm" @submit.prevent="next">
        <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
          <v-text-field v-model="data.name" label="Nom du site*" :rules="[required]" />
          <v-text-field v-model="data.city" label="Ville" />
          <v-text-field v-model="data.address" label="Adresse*" class="md:col-span-2" :rules="[addressOrDescription]" />
          <v-textarea v-model="data.locationDescription" label="Description de l’emplacement" placeholder="Ex. : entrée principale, près de la réception" persistent-placeholder rows="2" auto-grow counter="500" maxlength="500" class="md:col-span-2" :rules="[addressOrDescription]" />
        </v-card-text>
      </v-form>
      <SitePerimeterFields v-show="current === 1" ref="perimeterFields" v-model:points="points" v-model:radius-m="data.radiusM" :active="current === 1" @first-address="setFirstAddress" />
      <v-form v-show="current === 2" ref="governanceForm" @submit.prevent="next">
        <v-card-text class="grid gap-x-5 gap-y-2 px-6 py-6 md:grid-cols-2">
          <v-select v-model="data.managerId" label="Superviseur du site*" class="md:col-span-2" :items="managers" :item-title="fullName" item-value="id" placeholder="Dérouler la liste" :rules="[requiredChoice]">
            <template #no-data><AppMissingOption text="Aucun superviseur actif." label="Créer un compte superviseur" :to="{ name: 'admin-user-create' }" /></template>
          </v-select>
          <v-select v-model="data.missionId" label="Mission" :items="missions" :item-title="missionTitle" item-value="id" placeholder="Aucune mission" persistent-placeholder clearable :disabled="Boolean(site?.missionId)" :hint="site?.missionId ? 'La mission d’un site ne peut pas être modifiée.' : 'Une fois choisie, la mission du site ne pourra plus être changée.'" persistent-hint />
          <v-select v-model="data.teamId" label="Équipe" :items="teams" item-title="name" item-value="id" placeholder="Aucune équipe pour l’instant" persistent-placeholder :clearable="!site?.teamId" :hint="site?.teamId ? 'L’équipe peut être remplacée, pas retirée. Les créneaux déjà planifiés restent à leurs agents.' : ''" persistent-hint>
            <template #no-data><AppMissingOption text="Aucune équipe pour l’instant." label="Créer une équipe" :to="{ name: 'admin-team-create' }" /></template>
          </v-select>
        </v-card-text>
      </v-form>
      <v-card-text v-if="current === 3" class="space-y-6 px-6 py-6">
        <AppSummaryList :items="summary" />
        <div class="space-y-2">
          <p class="text-xs text-[#848484]">Périmètre ({{ placedPoints.length }} points)</p>
          <SitePerimeterMap :points="points" />
        </div>
        <v-alert v-if="!site" type="info" variant="tonal" text="Le QR code du site sera généré à l’étape suivante, une fois le site créé." />
      </v-card-text>
    </template>

    <template v-if="!created" #actions>
      <v-btn variant="text" color="secondary" size="large" :disabled="loading" @click="cancel">Annuler</v-btn>
      <v-spacer class="hidden sm:block" />
      <v-btn v-if="!isFirst" variant="outlined" color="secondary" size="large" prepend-icon="mdi-arrow-left" :disabled="loading" @click="previous">Précédent</v-btn>
      <v-btn v-if="!isLast" color="primary" size="large" append-icon="mdi-arrow-right" @click="next">Suivant</v-btn>
      <v-btn v-else color="primary" size="large" :loading="loading" prepend-icon="mdi-content-save-outline" @click="submit">{{ site ? 'Enregistrer les modifications' : 'Créer le site' }}</v-btn>
    </template>
  </AppStepperLayout>
</template>
