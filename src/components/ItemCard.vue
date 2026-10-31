<script setup lang="ts">
import { UiBadge, UiCard } from '@meddleware/ui'
import { formatDateTime } from '@meddleware/web-utils'
import { STATUS_LABEL, STATUS_SYMBOL, STATUS_TONE, type Item } from '../lib/roadmap.js'

defineProps<{ item: Item }>()
</script>

<template>
  <UiCard as="article" plain :level="3" :title="item.title">
    <p class="meta">
      <UiBadge :tone="STATUS_TONE[item.status]" :symbol="STATUS_SYMBOL[item.status]">{{ STATUS_LABEL[item.status] }}</UiBadge>
      <span v-if="item.dueAt">
        <template v-if="item.status === 'done'">Target was </template><template v-else>Planned for </template>
        <time :datetime="item.dueAt">{{ formatDateTime(item.dueAt, { empty: '' }) }}</time>
      </span>
    </p>
    <p v-if="item.description" class="body">{{ item.description }}</p>
  </UiCard>
</template>

<style scoped>
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: baseline;
  margin: 0;
  color: var(--muted);
}

.body {
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
