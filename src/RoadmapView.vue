<script setup lang="ts">
// The roadmap: the phases and items that have been made public, read from the hub's public route on this host. Public
// wording only; no task detail exists in the response, and the parser keeps only the fields shown.
import { computed, onMounted, ref } from 'vue'
import { UiButton, UiEmptyState, UiLiveStatus, UiNotice, UiSegmentedControl } from '@meddleware/ui'
import { fetchJson, formatDateTime } from '@meddleware/web-utils'
import PhaseSection from './components/PhaseSection.vue'
import SnapshotNote from './components/SnapshotNote.vue'
import { ROADMAP_PATH, SNAPSHOT_PATH, parseRoadmap, parseRoadmapSnapshot, type Roadmap, type Snapshot, type Status } from './lib/roadmap.js'

// `fetch` can be substituted by tests and hosts; the default is the browser's.
const props = defineProps<{ fetchImpl?: typeof fetch }>()
const getJson = (path: string) => fetchJson(path, { timeoutMs: 10_000, fetcher: (u, init) => (props.fetchImpl ?? fetch)(u, init) })

const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'planned', label: 'Planned' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
]

const roadmap = ref<Roadmap | null>(null)
const snapshot = ref<Snapshot | null>(null)
const failed = ref(false)
const loading = ref(true)
const filter = ref<Status | 'all'>('all')

async function load() {
  loading.value = true
  failed.value = false
  try {
    const r = parseRoadmap(await getJson(ROADMAP_PATH))
    if (!r) throw new Error('not a roadmap')
    roadmap.value = r
    // The record is a bonus: its absence or failure never affects the roadmap.
    getJson(SNAPSHOT_PATH).then((v) => (snapshot.value = parseRoadmapSnapshot(v)), () => (snapshot.value = null))
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)

const empty = computed(() => roadmap.value !== null && roadmap.value.phases.length === 0)
</script>

<template>
  <UiNotice v-if="failed" type="error">
    The roadmap could not be loaded just now.
    <UiButton variant="secondary" @click="load">Try again</UiButton>
  </UiNotice>
  <UiLiveStatus label="Roadmap" :message="loading ? 'Loading the roadmap…' : ''" />
  <template v-if="!loading && roadmap">
    <p v-if="roadmap.updatedAt" class="updated">Last updated <time :datetime="roadmap.updatedAt">{{ formatDateTime(roadmap.updatedAt, { empty: '' }) }}</time></p>
    <UiEmptyState v-if="empty">Nothing has been published yet. Phases and items appear here once they are made public.</UiEmptyState>
    <template v-else>
      <UiSegmentedControl v-model="filter" :options="FILTERS" label="Show items that are" layout="grid" />
      <PhaseSection v-for="p in roadmap.phases" :key="p.id" :phase="p" :filter="filter" />
    </template>
    <SnapshotNote v-if="snapshot" :snapshot="snapshot" />
  </template>
</template>

<style scoped>
.updated {
  color: var(--muted);
}
</style>
