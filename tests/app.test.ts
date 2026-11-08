import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App.vue'
import RoadmapView from '../src/RoadmapView.vue'
import { empty, noSnapshot, roadmap, snapshotResponse } from './support/fixtures.js'

type Handler = (path: string) => Response | Promise<Response>
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function view(handler: Handler) {
  const calls: Array<{ path: string; init: RequestInit }> = []
  const fetchImpl = (async (path: string, init: RequestInit) => {
    calls.push({ path, init })
    return handler(path)
  }) as unknown as typeof fetch
  const w = mount(RoadmapView, { props: { fetchImpl } })
  return { w, calls }
}

const ok: Handler = (p) => (p === '/public/v1/roadmap' ? json(roadmap) : json(snapshotResponse))
const settle = async () => {
  for (let i = 0; i < 4; i++) await flushPromises()
}

describe('the page', () => {
  it('has one page heading in the main landmark', () => {
    const w = mount(App)
    expect(w.findAll('h1')).toHaveLength(1)
    expect(w.find('main h1').text()).toBe('Roadmap')
  })
})

describe('the words on the page (for the public)', () => {
  // D117: a visitor sees no "operator", build variable, script name, placeholder or the old company spelling, and every term
  // the page uses is explained beside it.
  const BANNED = [/operator/i, /VITE_/, /coming soon/i, /check back soon/i, /MeddleWare/, /\.mjs|\.sh\b|npm run|snapshot/i]

  it('uses plain words everywhere, in the page, the roadmap and the record', async () => {
    const { w } = view(ok)
    await settle()
    const text = `${mount(App).text()} ${w.text()}`
    for (const re of BANNED) expect(text, String(re)).not.toMatch(re)
    expect(text).toContain('phases (stages of the plan)')
    expect(text).toContain('items (single pieces of work)')
    for (const empty_ of [empty]) {
      const v = view((p) => (p === '/public/v1/roadmap' ? json(empty_) : json(noSnapshot)))
      await settle()
      for (const re of BANNED) expect(v.w.text(), String(re)).not.toMatch(re)
    }
  })

  it('says how to check the record, step by step, without claiming a check it did not do', async () => {
    const { w } = view(ok)
    await settle()
    const rec = w.get('details.record')
    expect(rec.text()).toContain('A signed copy of this roadmap was stored on Walrus testnet (a decentralised storage network)')
    expect(rec.text()).toContain('The signer is the account whose key signed the document.')
    expect(rec.text()).toContain('fingerprint')
    expect(rec.findAll('ol > li').map((li) => li.text())).toEqual([
      expect.stringContaining('Fetch the stored document from any Walrus aggregator'),
      expect.stringContaining('Check that its SHA-256 is the value above.'),
      expect.stringContaining('Verify the signature over the document’s bytes as a Sui personal message'),
      expect.stringContaining('Check that the signing address is the signer you expect'),
    ])
    expect(rec.find('br').exists()).toBe(false)
    // The record's own times are machine-readable.
    expect(rec.findAll('time').map((t) => t.attributes('datetime'))).toEqual(['2026-10-29T12:00:00Z', '2026-11-27T12:00:00Z'])
  })

  it('does not say a signed record is stored when it has no Walrus blob', async () => {
    const unstored = structuredClone(snapshotResponse)
    unstored.snapshot.blob_id = null as unknown as string
    unstored.blob_url = null as unknown as string
    const { w } = view((p) => (p === '/public/v1/roadmap' ? json(roadmap) : json(unstored)))
    await settle()
    const rec = w.get('details.record')
    expect(rec.text()).toContain('its document is not on Walrus, so it cannot be checked yet')
    expect(rec.text()).not.toContain('was stored on Walrus')
    expect(rec.find('ol').exists()).toBe(false)
  })

  it('marks every date as a time, and keeps an ampersand in a name', async () => {
    const named = structuredClone(roadmap)
    named.phases[0]!.name = 'Research & Design'
    const { w } = view((p) => (p === '/public/v1/roadmap' ? json(named) : json(noSnapshot)))
    await settle()
    expect(w.findAll('h2')[0]!.text()).toBe('Research & Design')
    const window_ = w.findAll('section')[0]!.get('.window')
    expect(window_.findAll('time').map((t) => t.attributes('datetime'))).toEqual(['2026-10-01T00:00:00Z', '2027-01-31T00:00:00Z'])
    expect(w.find('br').exists()).toBe(false)
  })

  it('shows a phase that has only one end to its window with From or Until', async () => {
    const half = structuredClone(roadmap)
    half.phases[0]!.window_end = null as unknown as string
    half.phases[1]!.window_start = null as unknown as string
    half.phases[1]!.window_end = '2027-05-01T00:00:00Z'
    const { w } = view((p) => (p === '/public/v1/roadmap' ? json(half) : json(noSnapshot)))
    await settle()
    const windows = w.findAll('.window').map((e) => e.text())
    expect(windows[0]).toMatch(/^From /)
    expect(windows[1]).toMatch(/^Until /)
    expect(w.findAll('.window time')).toHaveLength(2)
  })
})

describe('the roadmap view', () => {
  it('shows a loading state, then the phases with public wording, status and dates', async () => {
    const { w } = view(ok)
    expect(w.get('output').text()).toBe('Loading the roadmap…')
    await settle()
    expect(w.get('output').text()).toBe('')
    expect(w.findAll('h2').map((h) => h.text())).toEqual(['Foundations', 'Growth'])
    const items = w.findAll('article')
    expect(items.map((a) => a.find('h3').text())).toEqual(['Open the testnet', 'Mint opens', 'Docs site'])
    expect(items[0]!.text()).toContain('Done')
    expect(items[0]!.text()).toContain('Target was')
    expect(items[1]!.text()).toContain('Planned for')
    expect(items[1]!.find('time').attributes('datetime')).toBe('2027-03-01T12:00:00Z')
    expect(items[2]!.text()).toContain('In progress')
    expect(w.text()).toContain('Nothing has been published for this phase yet.')
    expect(w.text()).toContain('Last updated')
  })

  it('reads only the two public routes on its own host, without credentials', async () => {
    const { w, calls } = view(ok)
    await settle()
    expect(w.exists()).toBe(true)
    expect(calls.map((c) => c.path).sort()).toEqual(['/public/v1/roadmap', '/public/v1/snapshot'])
    for (const c of calls) expect(c.init.credentials).toBe('omit')
  })

  it('shows nothing internal even if the response carried it', async () => {
    const { w } = view(ok)
    await settle()
    const html = w.html()
    for (const leaked of ['SECRET', 'phase-1', 'task_ids', 'visible_bot']) expect(html, leaked).not.toContain(leaked)
  })

  it('renders hostile wording as text', async () => {
    const hostile = structuredClone(roadmap)
    hostile.phases[0]!.name = '<img src=x onerror=alert(1)>Phase'
    hostile.phases[0]!.items[0]!.description = '<script>alert(2)</script> [x](javascript:alert(3))'
    const { w } = view((p) => (p === '/public/v1/roadmap' ? json(hostile) : json(noSnapshot)))
    await settle()
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('script').exists()).toBe(false)
    expect(w.find('a[href^="javascript:"]').exists()).toBe(false)
    expect(w.text()).toContain('<img src=x onerror=alert(1)>Phase')
    expect(w.text()).toContain('<script>alert(2)</script>')
  })

  it('filters by status and says when nothing matches', async () => {
    const { w } = view(ok)
    await settle()
    const radio = (label: string) => w.findAll('.mw-seg__item').find((l) => l.text().includes(label))!.get('input')
    await radio('Done').setValue(true)
    expect(w.findAll('article').map((a) => a.find('h3').text())).toEqual(['Open the testnet'])
    await radio('Planned').setValue(true)
    expect(w.findAll('article').map((a) => a.find('h3').text())).toEqual(['Mint opens'])
    await radio('Everything').setValue(true)
    expect(w.findAll('article')).toHaveLength(3)
  })

  it('says when a phase has items but none match the filter', async () => {
    const onlyPlanned = structuredClone(roadmap)
    for (const i of onlyPlanned.phases[0]!.items) i.status = 'planned'
    const { w } = view((p) => (p === '/public/v1/roadmap' ? json(onlyPlanned) : json(noSnapshot)))
    await settle()
    await w.findAll('.mw-seg__item').find((l) => l.text().includes('Done'))!.get('input').setValue(true)
    expect(w.findAll('article')).toHaveLength(0)
    expect(w.text()).toContain('Nothing here matches the filter.')
  })

  it('says so when nothing is published', async () => {
    const { w } = view((p) => (p === '/public/v1/roadmap' ? json(empty) : json(noSnapshot)))
    await settle()
    expect(w.text()).toContain('Nothing has been published yet. Phases and items appear here once they are made public.')
    expect(w.find('fieldset').exists()).toBe(false)
  })

  it('offers to try again when the roadmap cannot be loaded', async () => {
    let fail = true
    const { w } = view((p) => (fail ? new Response('boom', { status: 503 }) : p === '/public/v1/roadmap' ? json(roadmap) : json(noSnapshot)))
    await settle()
    expect(w.find('[role="alert"]').text()).toContain('could not be loaded')
    expect(w.findAll('article')).toHaveLength(0)
    fail = false
    await w.findAll('button').find((b) => b.text() === 'Try again')!.trigger('click')
    await settle()
    expect(w.findAll('article')).toHaveLength(3)
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('treats a response that is not a roadmap as a failure', async () => {
    const { w } = view(() => json({ hello: 'world' }))
    await settle()
    expect(w.find('[role="alert"]').exists()).toBe(true)
  })

  it('shows the verifiable record when there is a snapshot, and stays quiet when there is none or it fails', async () => {
    const { w } = view(ok)
    await settle()
    const rec = w.find('details.record')
    expect(rec.exists()).toBe(true)
    expect(rec.text()).toContain(`0x${'ab'.repeat(32)}`)
    expect(rec.text()).toContain('f'.repeat(64))
    expect(rec.find('a[href^="https://aggregator.example.org/v1/blobs/"]').exists()).toBe(true)
    for (const second of [(): Response => json(noSnapshot), (): Response => new Response('x', { status: 500 })]) {
      const v = view((p) => (p === '/public/v1/roadmap' ? json(roadmap) : second()))
      await settle()
      expect(v.w.find('details.record').exists()).toBe(false)
      expect(v.w.findAll('article')).toHaveLength(3)
    }
  })

  it('times out a hung request instead of waiting forever', async () => {
    vi.useFakeTimers()
    try {
      const { w } = view(
        (p) =>
          new Promise<Response>((_, reject) => {
            void p
            setTimeout(() => reject(new DOMException('aborted', 'AbortError')), 11_000)
          }),
      )
      await vi.advanceTimersByTimeAsync(11_500)
      await flushPromises()
      expect(w.find('[role="alert"]').exists()).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
