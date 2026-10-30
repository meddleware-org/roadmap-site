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

describe('the roadmap view', () => {
  it('shows a loading state, then the phases with public wording, status and dates', async () => {
    const { w } = view(ok)
    expect(w.text()).toContain('Loading the roadmap')
    expect(w.attributes('aria-busy')).toBe('true')
    await settle()
    expect(w.attributes('aria-busy')).toBe('false')
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
    const radio = (label: string) => w.findAll('label.opt').find((l) => l.text().includes(label))!.find('input')
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
    await w.findAll('label.opt').find((l) => l.text().includes('Done'))!.find('input').setValue(true)
    expect(w.findAll('article')).toHaveLength(0)
    expect(w.text()).toContain('Nothing here matches the filter.')
  })

  it('says so when nothing is published', async () => {
    const { w } = view((p) => (p === '/public/v1/roadmap' ? json(empty) : json(noSnapshot)))
    await settle()
    expect(w.text()).toContain('Nothing has been published yet')
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
