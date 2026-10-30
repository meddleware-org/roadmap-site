// Documents shaped like the hub's public routes (content-hub-service `public.rs`). They deliberately carry extra
// fields an internal API would have (`key`, `internal_name`, `visible_bot`, …) so tests can prove the site shows none of
// them even if a response ever gained them.

export const SIGNER = `0x${'ab'.repeat(32)}`
export const SHA = 'f'.repeat(64)

export const roadmap = {
  schema_version: 1,
  updated_at: '2026-10-29T12:00:00Z',
  phases: [
    {
      id: '6b9c5c8e-0000-4000-8000-000000000001',
      name: 'Foundations',
      description: 'The first public phase.',
      window_start: '2026-10-01T00:00:00Z',
      window_end: '2027-01-31T00:00:00Z',
      key: 'phase-1',
      internal_name: 'SECRET internal phase name',
      visible_bot: true,
      items: [
        {
          id: '6b9c5c8e-0000-4000-8000-000000000002',
          title: 'Open the testnet',
          description: 'Anyone can try it.\nNo wallet needed.',
          status: 'done',
          due_at: '2026-10-20T09:00:00Z',
          updated_at: '2026-10-21T09:00:00Z',
          internal_title: 'SECRET internal item title',
          task_ids: [1, 2],
        },
        {
          id: '6b9c5c8e-0000-4000-8000-000000000003',
          title: 'Mint opens',
          description: 'Opens soon.',
          status: 'planned',
          due_at: '2027-03-01T12:00:00Z',
          updated_at: '2026-10-22T09:00:00Z',
        },
        {
          id: '6b9c5c8e-0000-4000-8000-000000000004',
          title: 'Docs site',
          description: '',
          status: 'in_progress',
          due_at: null,
          updated_at: '2026-10-23T09:00:00Z',
        },
      ],
    },
    {
      id: '6b9c5c8e-0000-4000-8000-000000000010',
      name: 'Growth',
      description: '',
      window_start: null,
      window_end: null,
      items: [],
    },
  ],
}

export const snapshotResponse = {
  schema: 'content-hub.roadmap-snapshot/1',
  snapshot: {
    network: 'testnet',
    generated_at: '2026-10-29T12:00:00Z',
    schema_version: 1,
    sha256: SHA,
    byte_size: 715,
    signature: 'AJTJlo0MPS+j9AEgNpYHFWtdKyBZAWeco+E3brnTIyudDtF0slLO0v3UpYMVq0jPvYmcMj8HO3OtnIBl50Xs9AzqSmxj4pxSCr71UHsTLsX5lUd2rr6+e5JCHuppFEbSLA==',
    signer_address: SIGNER,
    blob_id: 'Qc9aP0V6x3mYk2w1TnqL8sRZb4dEoFhJiUyXvCgA7MM',
    object_id: `0x${'cd'.repeat(32)}`,
    epochs: 30,
    expires_at: '2026-11-27T12:00:00Z',
  },
  blob_url: 'https://aggregator.example.org/v1/blobs/Qc9aP0V6x3mYk2w1TnqL8sRZb4dEoFhJiUyXvCgA7MM',
  verify: 'Fetch the blob …',
}

export const empty = { schema_version: 1, updated_at: null, phases: [] }
export const noSnapshot = { schema: 'content-hub.roadmap-snapshot/1', snapshot: null, blob_url: null, verify: 'x' }
