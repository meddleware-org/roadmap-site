<script setup lang="ts">
// A status as a word, a symbol and a border. The text keeps the body colour (it always meets contrast); the colour
// only reinforces the border.
import { computed } from 'vue'
import { STATUS_LABEL, type Status } from '../lib/roadmap.js'

const props = defineProps<{ status: Status }>()
const SYMBOL: Record<Status, string> = { planned: '○', in_progress: '◐', done: '✓', cancelled: '✗' }
const label = computed(() => STATUS_LABEL[props.status])
</script>

<template>
  <span class="pill" :class="`pill-${status}`"><span aria-hidden="true">{{ SYMBOL[status] }}</span> {{ label }}</span>
</template>

<style scoped>
.pill {
  display: inline-block;
  padding: 0 var(--space-xs);
  border: 1px solid var(--tone, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--tone, var(--border)) 12%, var(--bg));
  color: var(--text);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.pill-done {
  --tone: var(--ok);
}

.pill-in_progress {
  --tone: var(--warning);
}

.pill-cancelled {
  --tone: var(--danger);
}
</style>
