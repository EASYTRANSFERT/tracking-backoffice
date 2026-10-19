<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useGeocodingStore } from '@/stores/geocoding.store'
import type { GeocodingResult } from '@/types/geocoding'

const props = defineProps<{
  modelValue: GeocodingResult | null
  label: string
  placeholder?: string
  hint?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: GeocodingResult | null] }>()

const key = useId()
const geocodingStore = useGeocodingStore()
const { suggestions, loading, errors } = storeToRefs(geocodingStore)

const search = ref(props.modelValue?.displayName ?? '')
const items = computed(() => suggestions.value[key] ?? [])
const isLoading = computed(() => Boolean(loading.value[key]))
const error = computed(() => errors.value[key] ?? undefined)

function onSearch(value: string | null) {
  search.value = value ?? ''
  // Vuetify remet le libellé du lieu choisi dans la recherche : inutile de relancer une requête.
  if (search.value === props.modelValue?.displayName) return
  geocodingStore.requestSuggestions(key, search.value)
}

function onSelect(value: GeocodingResult | null) {
  geocodingStore.clearSuggestions(key)
  emit('update:modelValue', value)
}

watch(
  () => props.modelValue?.displayName,
  (displayName) => {
    search.value = displayName ?? ''
  },
)

onBeforeUnmount(() => geocodingStore.clearSuggestions(key))
</script>

<template>
  <v-autocomplete
    :model-value="modelValue"
    :search="search"
    :items="items"
    item-title="displayName"
    item-value="id"
    return-object
    no-filter
    :loading="isLoading"
    :label="label"
    :placeholder="placeholder ?? 'Saisissez une adresse ou un lieu'"
    persistent-placeholder
    :disabled="disabled"
    :hint="hint"
    :persistent-hint="Boolean(hint)"
    :error-messages="error"
    :hide-no-data="search.trim().length < 3 || isLoading"
    no-data-text="Aucun lieu ne correspond à cette recherche."
    prepend-inner-icon="mdi-magnify"
    menu-icon=""
    clearable
    @update:search="onSearch"
    @update:model-value="onSelect"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item v-bind="itemProps" prepend-icon="mdi-map-marker-outline" :title="item.raw.displayName" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </v-autocomplete>
</template>
