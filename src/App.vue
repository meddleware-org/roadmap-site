<script setup lang="ts">
// The public roadmap page. The data is read by RoadmapView from this host's `/public/v1/roadmap`.
import { AppHeader, AppFooter, ColorModeControl, useColorMode } from '@meddleware/ui'
import RoadmapView from './RoadmapView.vue'

const { mode, set } = useColorMode('light')
const NAME = import.meta.env.VITE_SITE_NAME || 'Roadmap'
</script>

<template>
  <div class="app">
    <AppHeader variant="dark">
      <template #brand>
        <span class="brand-title">{{ NAME }}</span>
      </template>
      <template #actions>
        <ColorModeControl :model-value="mode" @update:model-value="set" />
      </template>
    </AppHeader>

    <main class="app-main">
      <h1 class="page-title">{{ NAME }}</h1>
      <p class="lede">What is planned, in progress and done.</p>
      <RoadmapView />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  max-width: 60rem;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
  width: 100%;
  box-sizing: border-box;
}

.page-title {
  margin: 0 0 var(--space-xs);
}

.lede {
  color: var(--muted);
  margin: 0 0 var(--space-md);
}
</style>
