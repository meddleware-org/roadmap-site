<script setup lang="ts">
// Native radio buttons in a labelled group; the chosen option has a tick as well as a fill.
import type { Status } from '../lib/roadmap.js'

defineProps<{ modelValue: Status | 'all' }>()
defineEmits<{ 'update:modelValue': [value: Status | 'all'] }>()
const OPTIONS: ReadonlyArray<{ id: Status | 'all'; label: string }> = [
  { id: 'all', label: 'Everything' },
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
]
</script>

<template>
  <fieldset class="filter">
    <legend class="sr-only">Show items that are</legend>
    <label v-for="o in OPTIONS" :key="o.id" class="opt" :class="{ on: o.id === modelValue }">
      <input class="sr-only" type="radio" name="status-filter" :value="o.id" :checked="o.id === modelValue" @change="$emit('update:modelValue', o.id)" />
      <span v-if="o.id === modelValue" aria-hidden="true">✓ </span>{{ o.label }}
    </label>
  </fieldset>
</template>

<style scoped>
.filter {
  position: relative;
  /* Phone: an even two-by-two grid (a wrapping row left ragged rows and empty cells). */
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  margin: 0 0 var(--space-md);
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--border);
  overflow: hidden;
  width: 100%;
}

.opt {
  padding: var(--space-2xs) var(--space-sm);
  background: var(--surface);
  color: var(--text);
  text-align: center;
  cursor: pointer;
}

@media (width >= 36em) {
  /* Wider screens: one compact row, sized to its content. */
  .filter {
    display: flex;
    gap: 0;
    background: none;
    width: fit-content;
    max-width: 100%;
  }

  .opt {
    text-align: start;
  }

  .opt + .opt {
    border-left: 1px solid var(--border);
  }
}

.on {
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
}

.opt:focus-within {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
