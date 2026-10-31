<script setup lang="ts">
import { matchesSearch } from '@/utils/search'
import { fullName } from '@/utils/people'
import { computed, ref, watch } from 'vue'

import AppEmptyState from '@/Components/common/AppEmptyState.vue'
import AppStatusChip from '@/Components/AppStatusChip.vue'
import type { EnterpriseUser, Team } from '@/types/administrator'

const props = withDefaults(defineProps<{
  modelValue: boolean
  team?: Team
  members: EnterpriseUser[]
  availableAgents: EnterpriseUser[]
  selectedIds: string[]
  loading?: boolean
  saving?: boolean
}>(), {
  team: undefined,
  loading: false,
  saving: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:selectedIds': [value: string[]]
  add: []
  remove: [userId: string]
}>()

const search = ref('')
const filteredAgents = computed(() => {
  return props.availableAgents.filter((agent) =>
    matchesSearch(search.value, fullName(agent), agent.employeeNumber, agent.email, agent.phone),
  )
})

function toggleAgent(userId: string) {
  const selected = props.selectedIds.includes(userId)
    ? props.selectedIds.filter((id) => id !== userId)
    : [...props.selectedIds, userId]
  emit('update:selectedIds', selected)
}

watch(() => props.modelValue, (open) => {
  if (open) search.value = ''
})
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="880" @update:model-value="emit('update:modelValue', $event)">
    <v-card class="overflow-hidden">
      <v-card-title class="flex items-start gap-3 px-6 py-5">
        <v-avatar color="red-lighten-5" rounded="lg"><v-icon icon="mdi-account-multiple-plus-outline" color="primary" /></v-avatar>
        <div class="min-w-0 flex-1 pr-10">
          <h2 class="text-lg font-bold text-[#252830]">Gérer les agents</h2>
          <p class="mt-1 truncate text-sm font-normal text-[#747985]">{{ team?.name }} · {{ members.length }} agent{{ members.length > 1 ? 's' : '' }} affecté{{ members.length > 1 ? 's' : '' }}</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="Fermer" class="!absolute right-3 top-3" @click="emit('update:modelValue', false)" />
      </v-card-title>
      <v-divider />

      <v-card-text class="space-y-6 px-6 py-6">
        <section>
          <div class="mb-4">
            <h3 class="font-bold text-[#292d38]">Ajouter des agents</h3>
            <p class="mt-1 text-xs text-[#747985]">Recherchez puis sélectionnez les agents sans équipe que vous souhaitez affecter.</p>
          </div>

          <v-text-field
            v-model="search"
            label="Rechercher un agent"
            placeholder="Nom, matricule, e-mail ou téléphone"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            :disabled="loading || saving"
            class="mb-3"
          />

          <v-progress-linear v-if="loading" indeterminate color="primary" />
          <v-list v-else-if="filteredAgents.length" class="max-h-64 overflow-y-auto rounded-xl border border-gray-200 py-0" lines="two">
            <template v-for="(agent, index) in filteredAgents" :key="agent.id">
              <v-list-item
                :title="fullName(agent)"
                :subtitle="`${agent.employeeNumber} · ${agent.email || agent.phone}`"
                :active="selectedIds.includes(agent.id)"
                active-color="primary"
                :disabled="saving"
                @click="toggleAgent(agent.id)"
              >
                <template #prepend>
                  <v-checkbox-btn :model-value="selectedIds.includes(agent.id)" color="primary" tabindex="-1" @click.stop="toggleAgent(agent.id)" />
                </template>
                <template #append><AppStatusChip :status="agent.status" /></template>
              </v-list-item>
              <v-divider v-if="index < filteredAgents.length - 1" />
            </template>
          </v-list>
          <AppEmptyState
            v-else
            icon="mdi-account-search-outline"
            :title="search ? 'Aucun agent trouvé' : 'Aucun agent disponible'"
            :description="search ? 'Essayez avec un autre nom, matricule ou e-mail.' : 'Tous les agents sont déjà rattachés à une équipe.'"
          />

          <v-btn
            block
            color="primary"
            size="large"
            prepend-icon="mdi-account-multiple-plus-outline"
            :disabled="!selectedIds.length || loading"
            :loading="saving"
            class="mt-4"
            @click="emit('add')"
          >
            {{ selectedIds.length ? `Ajouter ${selectedIds.length} agent${selectedIds.length > 1 ? 's' : ''} à l’équipe` : 'Sélectionnez les agents à ajouter' }}
          </v-btn>
        </section>

        <v-divider />

        <section>
          <div class="mb-3 flex items-center justify-between">
            <div><h3 class="font-bold text-[#292d38]">Membres actuels</h3><p class="mt-1 text-xs text-[#747985]">Le chef d’équipe ne peut pas être retiré avant son remplacement.</p></div>
            <v-chip color="primary" variant="tonal">{{ members.length }}</v-chip>
          </div>
          <v-list v-if="members.length" class="rounded-xl border border-gray-200 py-0" lines="two">
            <template v-for="(agent, index) in members" :key="agent.id">
              <v-list-item :title="fullName(agent)" :subtitle="`${agent.employeeNumber} · ${agent.email || agent.phone}`">
                <template #prepend><v-avatar color="red-lighten-5" size="38"><v-icon icon="mdi-account-outline" color="primary" /></v-avatar></template>
                <template #append>
                  <div class="flex items-center gap-2">
                    <v-chip v-if="team?.leadUserId === agent.id" color="primary" variant="tonal" size="small">Chef d’équipe</v-chip>
                    <AppStatusChip v-else :status="agent.status" />
                    <v-btn icon="mdi-account-minus-outline" variant="text" color="error" size="small" :disabled="saving || team?.leadUserId === agent.id" :aria-label="`Retirer ${fullName(agent)}`" @click="emit('remove', agent.id)" />
                  </div>
                </template>
              </v-list-item>
              <v-divider v-if="index < members.length - 1" />
            </template>
          </v-list>
          <AppEmptyState v-else icon="mdi-account-group-outline" title="Aucun agent dans cette équipe" description="Sélectionnez des agents disponibles pour constituer l’équipe." />
        </section>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
