<script setup lang="ts">
// The roadmap: phases and items an operator has made public, read from the hub's public route on this host. Public
// wording only; no task detail exists in the response, and the parser keeps only the fields shown.
import { computed, onMounted, ref } from 'vue'
import { UiButton, UiNotice } from '@meddleware/ui'
import PhaseSection from './components/PhaseSection.vue'
import SnapshotNote from './components/SnapshotNote.vue'
import StatusFilter from './components/StatusFilter.vue'
import { formatDateTime } from './lib/format.js'
import { ROADMAP_PATH, SNAPSHOT_PATH, parseRoadmap, parseSnapshot, type Roadmap, type Snapshot, type Status } from './lib/roadmap.js'

// `fetch` can be substituted by tests and hosts; the default is the browser's.
const props = defineProps<{ fetchImpl?: typeof fetch }>()
const doFetch = (u: string, init: RequestInit) => (props.fetchImpl ?? fetch)(u, init)

const roadmap = ref<Roadmap | null>(null)
const snapshot = ref<Snapshot | null>(null)
const failed = ref(false)
const loading = ref(true)
const filter = ref<Status | 'all'>('all')

async function getJson(path: string): Promise<unknown> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 10_000)
  try {
    const res = await doFetch(path, { headers: { accept: 'application/json' }, credentials: 'omit', cache: 'no-cache', signal: ctl.signal })
    if (!res.ok) throw new Error(String(res.status))
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function load() {
  loading.value = true
  failed.value = false
  try {
    const r = parseRoadmap(await getJson(ROADMAP_PATH))
    if (!r) throw new Error('not a roadmap')
    roadmap.value = r
    // The record is a bonus: its absence or failure never affects the roadmap.
    getJson(SNAPSHOT_PATH).then((v) => (snapshot.value = parseSnapshot(v)), () => (snapshot.value = null))
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
  <div class="roadmap" :aria-busy="loading">
    <UiNotice v-if="failed" type="error">
      The roadmap could not be loaded just now.
      <UiButton variant="secondary" @click="load">Try again</UiButton>
    </UiNotice>
    <p v-else-if="loading" class="status" role="status">Loading the roadmap…</p>
    <template v-else-if="roadmap">
      <p v-if="roadmap.updatedAt" class="updated">Last updated <time :datetime="roadmap.updatedAt">{{ formatDateTime(roadmap.updatedAt) }}</time></p>
      <p v-if="empty" class="status">Nothing has been published yet. Check back soon.</p>
      <template v-else>
        <StatusFilter v-model="filter" />
        <PhaseSection v-for="p in roadmap.phases" :key="p.id" :phase="p" :filter="filter" />
      </template>
      <SnapshotNote v-if="snapshot" :snapshot="snapshot" />
    </template>
  </div>
</template>

<style scoped>
.updated,
.status {
  color: var(--muted);
}
</style>
