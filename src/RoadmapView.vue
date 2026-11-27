<script setup lang="ts">
// The roadmap: the phases and items that have been made public, read from the hub's public route on this host. Public
// wording only; no task detail exists in the response, and the parser keeps only the fields shown.
// Vue's reactivity and lifecycle.
import { computed, onMounted, ref } from 'vue'
// The shared button, empty state, live status, notice and segmented control.
import { UiButton, UiEmptyState, UiLiveStatus, UiNotice, UiSegmentedControl } from '@meddleware/ui'
// A bounded JSON fetch, and a date for people.
import { fetchJson, formatDateTime } from '@meddleware/web-utils'
// One phase and its items.
import PhaseSection from './components/PhaseSection.vue'
// The verifiable record.
import SnapshotNote from './components/SnapshotNote.vue'
// The routes, the parsers and the types.
import { ROADMAP_PATH, SNAPSHOT_PATH, parseRoadmap, parseRoadmapSnapshot, type Roadmap, type Snapshot, type Status } from './lib/roadmap.js'

// `fetch` can be substituted by tests and hosts; the default is the browser's.
// A replacement `fetch`, for tests and hosts.
const props = defineProps<{ fetchImpl?: typeof fetch }>()
// Read JSON from this host with a ten-second limit.
const getJson = (path: string) => fetchJson(path, { timeoutMs: 10_000, fetcher: (u, init) => (props.fetchImpl ?? fetch)(u, init) })

// The status filters; cancelled items are not offered as a filter.
const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
]

// The roadmap once read.
const roadmap = ref<Roadmap | null>(null)
// The signed copy, when the hub has made one.
const snapshot = ref<Snapshot | null>(null)
// True when the roadmap could not be loaded.
const failed = ref(false)
// True while the roadmap loads.
const loading = ref(true)
// The status filter in force.
const filter = ref<Status | 'all'>('all')

/** Read the roadmap, then (as a bonus) the snapshot. */
async function load() {
  loading.value = true
  failed.value = false
  try {
    // The parser keeps only the displayed fields, and rejects what is not a roadmap.
    const r = parseRoadmap(await getJson(ROADMAP_PATH))
    if (!r) throw new Error('not a roadmap')
    roadmap.value = r
    // The record is a bonus: its absence or failure never affects the roadmap.
    // The record is a bonus: its absence or failure never affects the roadmap.
    getJson(SNAPSHOT_PATH).then((v) => (snapshot.value = parseRoadmapSnapshot(v)), () => (snapshot.value = null))
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
// Read when the page opens.
onMounted(load)

// True when the roadmap has no phases yet.
const empty = computed(() => roadmap.value !== null && roadmap.value.phases.length === 0)
</script>

<template>
  <UiNotice v-if="failed" type="error">
    The roadmap could not be loaded just now.
    <UiButton variant="secondary" @click="load">Try again</UiButton>
  </UiNotice>
  <!-- Announces loading. -->
  <UiLiveStatus label="Roadmap" :message="loading ? 'Loading the roadmap…' : ''" />
  <!-- Once loaded. -->
  <template v-if="!loading && roadmap">
    <!-- When the roadmap was last updated. -->
    <p v-if="roadmap.updatedAt" class="updated">Last updated <time :datetime="roadmap.updatedAt">{{ formatDateTime(roadmap.updatedAt, { empty: '' }) }}</time></p>
    <!-- Nothing has been published yet. -->
    <UiEmptyState v-if="empty">Nothing has been published yet. Phases and items appear here once they are made public.</UiEmptyState>
    <template v-else>
      <!-- Filter by status. -->
      <UiSegmentedControl v-model="filter" :options="FILTERS" label="Show items that are" layout="grid" />
      <!-- One section per phase. -->
      <PhaseSection v-for="p in roadmap.phases" :key="p.id" :phase="p" :filter="filter" />
    </template>
    <!-- The verifiable record, when there is one. -->
    <SnapshotNote v-if="snapshot" :snapshot="snapshot" />
  </template>
</template>

<style scoped>
/* A muted line. */
.updated {
  color: var(--muted);
}
</style>
