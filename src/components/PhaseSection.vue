<script setup lang="ts">
import { computed, useId } from 'vue'
import { UiEmptyState } from '@meddleware/ui'
import { formatWindow } from '@meddleware/web-utils'
import { filterItems, type Phase, type Status } from '../lib/roadmap.js'
import ItemCard from './ItemCard.vue'

const props = defineProps<{ phase: Phase; filter: Status | 'all' }>()
const id = useId()
const items = computed(() => filterItems(props.phase, props.filter))
const dates = computed(() => formatWindow(props.phase.windowStart, props.phase.windowEnd))
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id">{{ phase.name }}</h2>
    <p v-if="dates" class="window">{{ dates }}</p>
    <p v-if="phase.description" class="body">{{ phase.description }}</p>
    <ol v-if="items.length" class="items" role="list">
      <li v-for="i in items" :key="i.id"><ItemCard :item="i" /></li>
    </ol>
    <UiEmptyState v-else>{{ phase.items.length ? 'Nothing here matches the filter.' : 'Nothing has been published for this phase yet.' }}</UiEmptyState>
  </section>
</template>

<style scoped>
.window {
  color: var(--muted);
}

.body {
  overflow-wrap: anywhere;
}

.items {
  display: grid;
  gap: var(--space-sm);
}
</style>
