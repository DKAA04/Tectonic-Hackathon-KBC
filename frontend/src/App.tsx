import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Home, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { api, fixtureMode, type MomentContext } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function App() {
  const [context, setContext] = useState<MomentContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [advisor, setAdvisor] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.getContext().then(value => { if (active) setContext(value) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load your moment.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])

  return <div className="min-h-screen">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 md:px-10">
        <a href="/" aria-label="KBC Moment home" className="flex items-center gap-3 no-underline text-inherit"><span className="rounded-lg bg-[#006c70] px-3 py-2 text-xl font-bold tracking-tight text-white">KBC</span><span className="text-xl font-semibold tracking-tight">Moment<span className="text-teal-600">.</span></span></a>
        <div className="flex items-center gap-5"><span className="hidden items-center gap-2 text-sm text-slate-500 sm:flex"><ShieldCheck size={17}/> Your life. Your say.</span><span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold" aria-label="Synthetic customer Alex">A</span></div>
      </div>
    </header>
    {fixtureMode && <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-center text-sm text-amber-900"><strong>Fixture preview</strong> · Synthetic customer and evidence · Actions are not connected</div>}
    <main className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
      <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500"><Home size={16}/> Your space <ChevronRight size={14}/><span className="text-teal-800">Life moments</span></div>
        <Button variant="outline" onClick={() => setAdvisor(value => !value)}>{advisor ? 'Back to customer view' : 'Advisor demo preview'}<ArrowUpRight size={15}/></Button>
      </div>
      {loading ? <div role="status" className="rounded-2xl border bg-white p-12">Loading your moment…</div> : error ? <Card className="p-10"><h1 className="text-3xl font-semibold">We couldn’t load your moment</h1><p role="alert" className="my-5 max-w-2xl text-slate-600">{error}</p><Button className="w-fit" onClick={() => setAttempt(value => value + 1)}>Try again</Button></Card> : !context ? <Card className="p-10"><h1 className="text-3xl font-semibold">No moments to review</h1><p className="text-slate-600">You’re all caught up.</p></Card> : advisor ? <section aria-labelledby="advisor-title">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-700">Read-only demo preview</p><h1 id="advisor-title" className="mb-7 text-4xl font-semibold tracking-tight">The same context. A shared understanding.</h1>
        <Card className="max-w-3xl gap-5 p-8"><div className="flex flex-wrap gap-3"><Badge variant="secondary">Synthetic customer: {context.customer}</Badge><Badge variant="outline">Context {context.version}</Badge></div><h2 className="text-2xl font-semibold">{context.situation}</h2><p className="text-slate-600">Tentative · Not confirmed by the customer. No recommendation has been accepted.</p><ul className="space-y-3">{context.evidence.map(item => <li key={item.title} className="border-t pt-3"><strong>{item.title}</strong><p className="mt-1 text-slate-600">{item.detail}</p></li>)}</ul><p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">This preview uses the same fixture object as the customer view. Backend context/version synchronization is awaiting the shared contract.</p></Card>
      </section> : <>
        <section className="mb-9"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-700">A little clarity for what’s next</p><h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Life moves. We’re here with you.</h1><p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-500">Hi {context.customer}, here’s something you may want to explore.<br className="hidden md:block"/> You decide what fits your life, and what doesn’t.</p></section>
        <div className="grid items-start gap-7 lg:grid-cols-[1.65fr_1fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-teal-100 bg-[#eaf5f2] px-7 py-5"><span className="flex items-center gap-2 text-sm font-semibold text-teal-900"><Sparkles size={18}/> A possible new chapter</span><Badge variant="outline" className="border-teal-200 bg-white text-teal-800">Tentative</Badge></div>
              <div className="px-7 pb-7"><div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Home size={29} strokeWidth={1.5}/></div><h2 className="text-3xl font-semibold tracking-tight">{context.situation}</h2><p className="mt-3 leading-relaxed text-slate-500">A couple of signals suggest a change of home could be on your mind. We might have this wrong — only you know your story.</p>
                <div className="mt-7 border-t border-slate-100 pt-6"><h3 className="font-semibold">Does this sound like you?</h3><div className="mt-4 flex flex-wrap gap-3"><Button disabled className="bg-teal-700 text-white"><Check size={16}/> Yes, I’m planning a move</Button><Button disabled variant="outline">That’s not quite right</Button></div><p className="mt-3 text-xs text-slate-500">Preview only. Confirmation and correction will be enabled after API integration.</p></div>
              </div>
            </Card>
            <Card className="gap-5 border-slate-200 p-7 shadow-none"><div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Always explainable</p><h2 className="text-xl font-semibold">Why this came up</h2></div>{context.evidence.map((item, index) => <div key={item.title} className="flex gap-4 border-t border-slate-100 pt-5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-500">0{index + 1}</span><div><h3 className="font-medium">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-500">{item.detail}</p></div></div>)}<p className="text-xs text-slate-400">Illustrative signals only · No real account data</p></Card>
          </div>
          <aside className="space-y-6">
            <Card className="gap-4 border-slate-200 p-7 shadow-none"><span className="text-xs font-bold uppercase tracking-widest text-teal-700">One step at a time</span><h2 className="text-2xl font-semibold tracking-tight">Make room for what’s next.</h2><p className="text-sm leading-relaxed text-slate-500">If a move is on the horizon, a simple checklist could help you get organised. Nothing starts without your say.</p><div className="my-2 space-y-3 border-y border-slate-100 py-5">{['Confirm what’s happening', 'Review a next step together', 'Choose whether to continue'].map((text, i) => <div key={text} className="flex items-center gap-3 text-sm"><span className="flex size-6 items-center justify-center rounded-full bg-teal-50 text-xs text-teal-700">{i + 1}</span>{text}</div>)}</div><Button disabled variant="outline" className="justify-between">Explore a moving checklist <ArrowRight size={16}/></Button><p className="text-xs text-slate-400">Available after you confirm your situation.</p></Card>
            <Card className="gap-3 border-teal-100 bg-[#eaf5f2] p-7 shadow-none"><LockKeyhole className="text-teal-700" size={23}/><h2 className="text-lg font-semibold">You’re in control</h2><p className="text-sm leading-relaxed text-slate-600">You can correct a moment, cancel it or withdraw consent. Your choices should shape what happens next.</p><div className="flex flex-wrap gap-3 pt-2"><Button disabled variant="outline" size="sm">Cancel this moment</Button><Button disabled variant="outline" size="sm">Revoke consent</Button></div><p className="text-xs leading-relaxed text-slate-500">These controls are placeholders until connected. No consent or preferences are saved in this preview.</p></Card>
          </aside>
        </div>
      </>}
      <footer className="mt-10 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500"><span>KBC Moment · Tectonic hackathon concept</span><span>{fixtureMode ? 'Synthetic preview · No banking actions' : 'Live mode · Connection required'}</span></footer>
    </main>
  </div>
}
