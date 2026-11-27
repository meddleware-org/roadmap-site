<script setup lang="ts">
// One phase: its name, its window, its public description and its items (filtered by status). Related: ItemCard.vue, RoadmapView.vue (hosts it).
// Vue's `computed`, and `useId` for a unique heading id.
import { computed, useId } from 'vue'
// The shared empty state.
import { UiEmptyState } from '@meddleware/ui'
// A date for people.
import { formatDate } from '@meddleware/web-utils'
// The filter and the types.
import { filterItems, type Phase, type Status } from '../lib/roadmap.js'
// One item.
import ItemCard from './ItemCard.vue'

// The phase and the status filter.
const props = defineProps<{ phase: Phase; filter: Status | 'all' }>()
// A unique id that ties the section to its heading.
const id = useId()
// The items that match the filter.
const items = computed(() => filterItems(props.phase, props.filter))
// The window's start, as text (empty when there is none).
const start = computed(() => formatDate(props.phase.windowStart, { empty: '' }))
// The window's end, as text.
const end = computed(() => formatDate(props.phase.windowEnd, { empty: '' }))
</script>

<template>
  <section :aria-labelledby="id">
    <!-- The phase's name. -->
    <h2 :id="id">{{ phase.name }}</h2>
    <!-- The window, in words that fit what is known: both ends, only a start, or only an end. -->
    <p v-if="start && end" class="window"><time :datetime="phase.windowStart!">{{ start }}</time> – <time :datetime="phase.windowEnd!">{{ end }}</time></p>
    <p v-else-if="start" class="window">From <time :datetime="phase.windowStart!">{{ start }}</time></p>
    <p v-else-if="end" class="window">Until <time :datetime="phase.windowEnd!">{{ end }}</time></p>
    <!-- The phase's public description. -->
    <p v-if="phase.description" class="body">{{ phase.description }}</p>
    <!-- The items; the list role stays because the styles remove the bullets. -->
    <ol v-if="items.length" class="items" role="list">
      <li v-for="i in items" :key="i.id"><ItemCard :item="i" /></li>
    </ol>
    <!-- Nothing matches the filter, or nothing has been published for the phase. -->
    <UiEmptyState v-else>{{ phase.items.length ? 'Nothing here matches the filter.' : 'Nothing has been published for this phase yet.' }}</UiEmptyState>
  </section>
</template>

<style scoped>
/* A muted line. */
.window {
  color: var(--muted);
}

/* Long words may wrap. */
.body {
  overflow-wrap: anywhere;
}

/* The items in a grid. */
.items {
  display: grid;
  gap: var(--space-sm);
}
</style>
