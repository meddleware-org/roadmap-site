<script setup lang="ts">
import { formatDateTime } from '../lib/format.js'
import type { Item } from '../lib/roadmap.js'
import StatusPill from './StatusPill.vue'

defineProps<{ item: Item }>()
</script>

<template>
  <article class="item">
    <h3 class="item-title">{{ item.title }}</h3>
    <p class="item-meta">
      <StatusPill :status="item.status" />
      <span v-if="item.dueAt" class="item-due">
        <template v-if="item.status === 'done'">Target was </template><template v-else>Planned for </template>
        <time :datetime="item.dueAt">{{ formatDateTime(item.dueAt) }}</time>
      </span>
    </p>
    <p v-if="item.description" class="item-body">{{ item.description }}</p>
  </article>
</template>

<style scoped>
.item {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-sm) var(--space-md);
  background: var(--surface);
}

.item-title {
  margin: 0 0 var(--space-3xs);
  font-size: var(--font-size-lg);
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: baseline;
  margin: 0 0 var(--space-xs);
  color: var(--muted);
}

.item-body {
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
