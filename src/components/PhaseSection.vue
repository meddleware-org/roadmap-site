<script setup lang="ts">
import { computed, useId } from 'vue'
import { formatWindow } from '../lib/format.js'
import { filterItems, type Phase, type Status } from '../lib/roadmap.js'
import ItemCard from './ItemCard.vue'

const props = defineProps<{ phase: Phase; filter: Status | 'all' }>()
const id = useId()
const items = computed(() => filterItems(props.phase, props.filter))
const window_ = computed(() => formatWindow(props.phase.windowStart, props.phase.windowEnd))
</script>

<template>
  <section class="phase" :aria-labelledby="id">
    <h2 :id="id" class="phase-title">{{ phase.name }}</h2>
    <p v-if="window_" class="phase-window">{{ window_ }}</p>
    <p v-if="phase.description" class="phase-body">{{ phase.description }}</p>
    <ol v-if="items.length" class="items" role="list">
      <li v-for="i in items" :key="i.id"><ItemCard :item="i" /></li>
    </ol>
    <p v-else class="empty">{{ phase.items.length ? 'Nothing here matches the filter.' : 'Nothing has been published for this phase yet.' }}</p>
  </section>
</template>

<style scoped>
.phase {
  margin: 0 0 var(--space-xl);
}

.phase-title {
  margin: 0 0 var(--space-3xs);
}

.phase-window {
  margin: 0 0 var(--space-xs);
  color: var(--muted);
}

.phase-body {
  margin: 0 0 var(--space-sm);
  overflow-wrap: anywhere;
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-sm);
}

.empty {
  color: var(--muted);
}
</style>
