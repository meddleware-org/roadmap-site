<script setup lang="ts">
import { computed, useId } from 'vue'
import { UiEmptyState } from '@meddleware/ui'
import { formatDate } from '@meddleware/web-utils'
import { filterItems, type Phase, type Status } from '../lib/roadmap.js'
import ItemCard from './ItemCard.vue'

const props = defineProps<{ phase: Phase; filter: Status | 'all' }>()
const id = useId()
const items = computed(() => filterItems(props.phase, props.filter))
const start = computed(() => formatDate(props.phase.windowStart, { empty: '' }))
const end = computed(() => formatDate(props.phase.windowEnd, { empty: '' }))
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id">{{ phase.name }}</h2>
    <p v-if="start && end" class="window"><time :datetime="phase.windowStart!">{{ start }}</time> – <time :datetime="phase.windowEnd!">{{ end }}</time></p>
    <p v-else-if="start" class="window">From <time :datetime="phase.windowStart!">{{ start }}</time></p>
    <p v-else-if="end" class="window">Until <time :datetime="phase.windowEnd!">{{ end }}</time></p>
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
