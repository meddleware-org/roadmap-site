<script setup lang="ts">
// The verifiable record: the roadmap is also signed and stored on Walrus, so anyone can check it without trusting this
// site. Shown only when the hub has produced a signed copy. The wording matches the hub's snapshot reference
// (content-hub-service docs/SNAPSHOT.md): the page says how to check; it checks nothing itself.
import { computed } from 'vue'
import { CopyableAddress, ExplorerLink } from '@meddleware/ui'
import { formatDateTime, safeHref, suiExplorerUrl } from '@meddleware/web-utils'
import type { Snapshot } from '../lib/roadmap.js'

const props = defineProps<{ snapshot: Snapshot }>()
// The signer links to a block explorer only for a network the explorer knows.
const network = computed(() => (['mainnet', 'testnet', 'devnet'] as const).find((n) => n === props.snapshot.network))
</script>

<template>
  <details class="record">
    <summary>Verifiable record of this roadmap</summary>
    <p v-if="snapshot.blobId">
      A signed copy of this roadmap was stored on Walrus {{ snapshot.network }} (a decentralised storage network) on
      <time :datetime="snapshot.generatedAt">{{ formatDateTime(snapshot.generatedAt, { empty: '' }) }}</time>. You can check it without trusting this
      website.
    </p>
    <p v-else>
      A signed record of this roadmap was made on
      <time :datetime="snapshot.generatedAt">{{ formatDateTime(snapshot.generatedAt, { empty: '' }) }}</time>
      but its document is not on Walrus, so it cannot be checked yet.
    </p>
    <dl class="facts">
      <dt>Signed by</dt>
      <dd>
        <CopyableAddress :address="snapshot.signerAddress" :truncate="false" label="Copy the signer address">
          <ExplorerLink v-if="network" :href="suiExplorerUrl('account', snapshot.signerAddress, network)" :value="snapshot.signerAddress" :truncate="false" />
          <code v-else>{{ snapshot.signerAddress }}</code>
        </CopyableAddress>
      </dd>
      <dt>SHA-256 of the signed document</dt>
      <dd><CopyableAddress :address="snapshot.sha256" :truncate="false" label="Copy the SHA-256" /></dd>
      <dt>Signature</dt>
      <dd><CopyableAddress :address="snapshot.signature" :chars="[16, 12]" label="Copy the signature" /></dd>
      <dt v-if="snapshot.blobId">Stored on Walrus as</dt>
      <dd v-if="snapshot.blobId">
        <a v-if="safeHref(snapshot.blobUrl)" :href="safeHref(snapshot.blobUrl)" rel="noopener noreferrer"><code>{{ snapshot.blobId }}</code></a>
        <code v-else>{{ snapshot.blobId }}</code>
      </dd>
      <dt v-if="snapshot.expiresAt">Stored until about</dt>
      <dd v-if="snapshot.expiresAt"><time :datetime="snapshot.expiresAt">{{ formatDateTime(snapshot.expiresAt, { empty: '' }) }}</time></dd>
    </dl>
    <p>
      The signer is the account whose key signed the document. The SHA-256 is a fingerprint worked out from the document: changing a single
      character changes it.
    </p>
    <p v-if="snapshot.blobId">To check the record yourself:</p>
    <ol v-if="snapshot.blobId">
      <li>Fetch the stored document from any Walrus aggregator (a server that serves Walrus data), using the name shown after “Stored on Walrus as”.</li>
      <li>Check that its SHA-256 is the value above.</li>
      <li>
        Verify the signature over the document’s bytes as a Sui personal message, for example with <code>verifyPersonalMessageSignature</code>
        from <code>@mysten/sui</code>.
      </li>
      <li>Check that the signing address is the signer you expect: an address shown only on this page cannot vouch for itself.</li>
    </ol>
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

@media (width <= 40em) {
  .facts {
    grid-template-columns: 1fr;
  }
}
</style>
