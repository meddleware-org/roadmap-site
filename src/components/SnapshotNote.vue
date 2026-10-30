<script setup lang="ts">
// The verifiable record: the roadmap is also signed and stored on Walrus, so anyone can check it without trusting this
// site. Shown only when the hub has produced a snapshot.
import { safeHref } from '@meddleware/ui'
import { formatDateTime } from '../lib/format.js'
import type { Snapshot } from '../lib/roadmap.js'

defineProps<{ snapshot: Snapshot }>()
</script>

<template>
  <details class="record">
    <summary>Verifiable record of this roadmap</summary>
    <p>
      A signed copy of this roadmap was recorded on {{ formatDateTime(snapshot.generatedAt) }} ({{ snapshot.network }}). You can check it
      without trusting this website.
    </p>
    <dl class="facts">
      <dt>Signed by</dt>
      <dd><code>{{ snapshot.signerAddress }}</code></dd>
      <dt>SHA-256 of the signed document</dt>
      <dd><code>{{ snapshot.sha256 }}</code></dd>
      <dt>Signature</dt>
      <dd><code>{{ snapshot.signature }}</code></dd>
      <dt v-if="snapshot.blobId">Stored on Walrus as</dt>
      <dd v-if="snapshot.blobId">
        <a v-if="safeHref(snapshot.blobUrl)" :href="safeHref(snapshot.blobUrl)" rel="noopener noreferrer"><code>{{ snapshot.blobId }}</code></a>
        <code v-else>{{ snapshot.blobId }}</code>
      </dd>
      <dt v-if="snapshot.expiresAt">Stored until about</dt>
      <dd v-if="snapshot.expiresAt"><time :datetime="snapshot.expiresAt">{{ formatDateTime(snapshot.expiresAt) }}</time></dd>
    </dl>
    <p>
      To verify: fetch the blob, check that its SHA-256 is the value above, then verify the signature over the blob's bytes as a Sui
      personal message (for example with <code>verifyPersonalMessageSignature</code> from <code>@mysten/sui</code>) and check that the
      signing address is the one the operator has published.
    </p>
  </details>
</template>

<style scoped>
.record {
  margin-top: var(--space-xl);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-sm) var(--space-md);
}

.facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-3xs) var(--space-md);
}

.facts dt {
  color: var(--muted);
}

.facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}

@media (width <= 40rem) {
  .facts {
    grid-template-columns: 1fr;
  }
}
</style>
