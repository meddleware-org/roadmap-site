<script setup lang="ts">
// The public roadmap page. The data is read by RoadmapView from this host's `/public/v1/roadmap`.
// AppToolShell is the frame (the Meddleware mark and the deployment's name in the header, the colour-mode control, the footer with
// the copyright line). The page has its own visible h1, named by the deployment (VITE_SITE_NAME), so the shell adds no hidden one,
// and it has no documentation pages, so the shell's docs and developer links are left out.
import { AppToolShell } from '@meddleware/ui'
import RoadmapView from './RoadmapView.vue'

const NAME = import.meta.env.VITE_SITE_NAME || 'Roadmap'
</script>

<template>
  <AppToolShell :title="NAME" slug="roadmap" :docs-url="false" :dev-url="false" :page-heading="false" default-mode="light">
    <h1>{{ NAME }}</h1>
    <p class="lede">What is planned, in progress and done. The work is grouped into phases (stages of the plan); each phase lists its items (single pieces of work) with their status.</p>
    <RoadmapView />
  </AppToolShell>
</template>

<style scoped>
.lede {
  color: var(--muted);
}
</style>
