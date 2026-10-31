<script setup lang="ts">
// The public roadmap page. The data is read by RoadmapView from this host's `/public/v1/roadmap`.
import { AppFooter, AppHeader, ColorModeControl, CopyrightLine, UiAppShell, useColorMode } from '@meddleware/ui'
import RoadmapView from './RoadmapView.vue'

const { mode, set } = useColorMode('light')
const NAME = import.meta.env.VITE_SITE_NAME || 'Roadmap'
</script>

<template>
  <UiAppShell contained>
    <template #header>
      <AppHeader variant="dark">
        <template #brand>{{ NAME }}</template>
        <template #actions>
          <ColorModeControl :model-value="mode" @update:model-value="set" />
        </template>
      </AppHeader>
    </template>

    <h1>{{ NAME }}</h1>
    <p class="lede">What is planned, in progress and done.</p>
    <RoadmapView />

    <template #footer>
      <AppFooter>
        <CopyrightLine symbol-variant="kopimi" organisation-name="Meddleware" rights-statement="jam" />
      </AppFooter>
    </template>
  </UiAppShell>
</template>

<style scoped>
.lede {
  color: var(--muted);
}
</style>
