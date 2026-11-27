<script setup lang="ts">
// One roadmap item: its title, status (in words, with a tone and a symbol) and date, and its public description as text. Related: PhaseSection.vue (lists these).
// The shared badge and card.
import { UiBadge, UiCard } from '@meddleware/ui'
// A date for people.
import { formatDateTime } from '@meddleware/web-utils'
// The status words, tones and symbols, and the item type.
import { STATUS_LABEL, STATUS_SYMBOL, STATUS_TONE, type Item } from '../lib/roadmap.js'

// The item to show.
defineProps<{ item: Item }>()
</script>

<template>
  <UiCard as="article" plain :level="3" :title="item.title">
    <!-- The status and the date. -->
    <p class="meta">
      <!-- The status in words, with a tone and a symbol as reinforcement. -->
      <UiBadge :tone="STATUS_TONE[item.status]" :symbol="STATUS_SYMBOL[item.status]">{{ STATUS_LABEL[item.status] }}</UiBadge>
      <!-- The date: a target if the item is done, a plan otherwise. -->
      <span v-if="item.dueAt">
        <template v-if="item.status === 'done'">Target was </template><template v-else>Planned for </template>
        <time :datetime="item.dueAt">{{ formatDateTime(item.dueAt, { empty: '' }) }}</time>
      </span>
    </p>
    <!-- The public description, as text (line breaks kept). -->
    <p v-if="item.description" class="body">{{ item.description }}</p>
  </UiCard>
</template>

<style scoped>
/* Status and date on one wrapping row. */
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: baseline;
  margin: 0;
  color: var(--muted);
}

/* Line breaks are kept, and long words may wrap. */
.body {
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
