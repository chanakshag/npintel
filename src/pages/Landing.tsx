import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Cpu, FileText, GitBranch, MessagesSquare, ClipboardCheck, GitCompare,
  ArrowRight, Clock, Unlink, UserMinus, AlertTriangle, FileWarning, TrendingDown,
  CheckCircle2, Zap, Workflow, Linkedin, Mail, CircuitBoard,
  Layers, Truck, ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_URL = "https://cal.com/spectir/demo";

const Logo = ({ className = "" }: { className?: string }) => (
  <span className={`font-bold tracking-tight text-navy ${className}`}>Spectir</span>
);

const problems = [
  { icon: Clock, title: "Lost Engineering Hours", desc: "374 hours per engineer per year lost to manual documentation, gate review prep, and traceability work." },
  { icon: Unlink, title: "Broken Traceability", desc: "Requirements, design decisions, test results, and supplier data siloed across tools. Gate reviews stall." },
  { icon: UserMinus, title: "Knowledge Walks Out the Door", desc: "When an engineer leaves, their context — supplier decisions, failure history, design rationale — disappears with them." },
  { icon: AlertTriangle, title: "Change Blind Spots", desc: "A component changes. Nobody knows which downstream documents, specs, and sign-offs are now invalid." },
  { icon: FileWarning, title: "Gate Review Chaos", desc: "Every gate review package assembled by hand, from scratch, under deadline pressure." },
  { icon: TrendingDown, title: "$150B at Stake", desc: "NPI cycle delays cost hard tech companies an estimated $150B annually in delayed revenue and market windows." },
];

const values = [
  { icon: ClipboardCheck, title: "Automatically Generate Gate Packages", desc: "Spectir continuously maintains living documentation so gate review packages generate themselves — not at midnight before the review." },
  { icon: Zap, title: "Proactively Surface Change Impacts", desc: "When anything changes, Spectir instantly flags every downstream document, requirement, and sign-off affected." },
  { icon: Workflow, title: "Run NPI Documentation Autonomously", desc: "Let your engineers focus on engineering. Spectir handles the documentation layer end-to-end." },
];

const impact = [
  { value: "~60%", label: "reduction in gate review prep time" },
  { value: "374 hrs", label: "saved per engineer per year" },
  { value: "$65B", label: "in engineering productivity unlocked across hard tech globally" },
];

const features = [
  { icon: FileText, title: "Auto-Documentation", desc: "AI generates living specs, test reports, and gate review packages from structured and unstructured inputs — PRDs, meeting notes, test CSVs, supplier emails." },
  { icon: GitBranch, title: "Full Requirements Traceability", desc: "Every requirement linked to a design decision, linked to a test result, linked to a supplier qualification. Visual graph. Red/amber/green gate status. No broken links at review time." },
  { icon: MessagesSquare, title: "Research Synthesis", desc: "Upload datasheets, technical papers, and past project reports. Ask in plain English: \"Which supplier meets our thermal spec?\" — get cited, source-linked answers instantly." },
  { icon: GitCompare, title: "Change Propagation", desc: "Log a component change. Spectir immediately maps every downstream document, traceability link, and sign-off that needs updating. Assign tasks. Close the loop." },
  { icon: ClipboardCheck, title: "Gate Review Assistant", desc: "Select your gate type — EVT, DVT, PVT, PDR, CDR. AI generates the checklist based on your product and regulatory standard. Track completion. Export the full package." },
  { icon: Workflow, title: "NPI Workflow Builder", desc: "Build your full NPI program phase by phase — from requirements definition to pilot production. AI tailors tasks, outputs, and gate criteria to your specific product and industry." },
];

const verticals = [
  { name: "Semiconductor", pain: "Tape-out gate sign-off across 50+ specs" },
  { name: "Aerospace & Defense", pain: "AS9100 traceability and certification packages" },
  { name: "Medical Devices", pain: "FDA 21 CFR 820 design history files" },
  { name: "Automotive & EV", pain: "IATF 16949 PPAP and APQP documentation" },
  { name: "Industrial Robotics", pain: "Functional safety and IEC 62061 evidence" },
  { name: "Consumer Electronics", pain: "Compressed NPI cycles, global supplier coordination" },
  { name: "Energy & Cleantech", pain: "Long validation cycles, regulatory complexity" },
  { name: "Biotech Hardware", pain: "ISO 13485 design controls and risk files" },
];

const testimonials = [
  { quote: "This is legitimately the tool we've needed for 10 years.", author: "NPI Engineer", company: "Semiconductor Company" },
  { quote: "Gate review prep used to take us two days. This changes everything.", author: "Technical Program Manager", company: "Aerospace" },
];

// Visual mockup component for hero
const HeroMockup = () => (
  <div className="relative mx-auto max-w-4xl">
    <div className="absolute inset-x-10 -bottom-6 h-24 rounded-full bg-primary/20 blur-3xl" />
    <Card className="relative overflow-hidden rounded-xl border-slate-200 bg-white p-1 shadow-2xl">
      <div className="rounded-lg bg-white">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="ml-3 text-[11px] font-medium text-slate-500">Spectir · Pump Rev B · Gate DVT Review</div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {/* Phase progress */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gate Readiness</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">DVT · 87%</span>
            </div>
            {[
              { label: "Requirements verified", pct: 100, color: "bg-emerald-500" },
              { label: "Test reports linked", pct: 92, color: "bg-emerald-500" },
              { label: "Supplier qualification", pct: 78, color: "bg-amber-500" },
              { label: "Change orders closed", pct: 65, color: "bg-amber-500" },
              { label: "Risk mitigations", pct: 100, color: "bg-emerald-500" },
            ].map(r => (
              <div key={r.label} className="mb-2.5 last:mb-0">
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-700">
                  <span>{r.label}</span><span className="font-mono">{r.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {/* Side panel */}
          <div className="space-y-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Open issues</div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-800">7</div>
              <div className="text-[11px] text-amber-600">3 blocking gate</div>
            </div>
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-primary">AI summary</div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                Ready for DVT in 4 days. 3 supplier docs pending; auto-requested.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
);

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-700">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-navy">
              <CircuitBoard className="h-4 w-4 text-primary-glow" />
            </div>
            <Logo className="text-lg" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition-colors hover:text-navy">Features</a>
            <a href="#products" className="transition-colors hover:text-navy">Products</a>
            <a href="#contact" className="transition-colors hover:text-navy">Contact Us</a>
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">Open app</Link>
              </Button>
            )}
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={DEMO_URL} target="_blank" rel="noreferrer">Book a Demo</a>
            </Button>
          </div>
        </div>
      </header>

      {/* SECTION 1 — Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-slate-50 to-white" />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              AI for Physical Product Development
            </div>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-navy md:text-6xl lg:text-7xl">
              Put Hardware Development on Autopilot
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-slate-600 md:text-lg">
              Spectir owns the full hardware lifecycle — NPI documentation, bill of materials intelligence,
              supply chain monitoring, and procurement automation — freeing your engineers to build, not administrate.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="outline" size="lg" className="border-navy/20 text-navy hover:bg-navy/5">
                <a href="#features">Learn More</a>
              </Button>
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <a href={DEMO_URL} target="_blank" rel="noreferrer">Book a Demo <ArrowRight className="ml-1.5 h-4 w-4" /></a>
              </Button>
            </div>
          </div>
          <div className="mt-16">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* SECTION 2 — Social proof */}
      <section className="border-b border-slate-200 bg-slate-50/60 py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            Trusted by hardware teams building the physical world
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-medium text-slate-400">
            {["Semiconductor", "Aerospace", "Medical Devices", "Automotive", "Industrial"].map(l => (
              <span key={l} className="tracking-wide">{l}</span>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-600">
            Eliminating <span className="font-semibold text-navy">374 hours</span> of manual documentation overhead per engineer, per year
          </p>
        </div>
      </section>

      {/* SECTION 3 — Problem */}
      <section className="border-b border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Manual documentation is killing your NPI cycle
            </h2>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Hardware engineers spend 30–40% of their time not building — but documenting. Every gate review,
              every component change, every supplier qualification — done by hand, in Word docs and emails.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {problems.map(p => (
              <Card key={p.title} className="group border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Value */}
      <section className="border-b border-slate-200 bg-slate-50/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
              What Spectir brings to your NPI team
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {values.map(v => (
              <Card key={v.title} className="border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy text-primary-glow">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-navy">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — Impact */}
      <section className="border-b border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
              We're here to make a real impact in physical product development
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {impact.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-5xl font-bold tracking-tight text-primary md:text-6xl">{s.value}</div>
                <p className="mx-auto mt-3 max-w-xs text-sm text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — Features */}
      <section id="features" className="border-b border-slate-200 bg-slate-50/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Spectir delivers a seamless NPI workflow for your team
            </h2>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              From requirements definition to gate review sign-off — all connected, all traceable, all automated.
            </p>
          </div>
          <div className="mt-16 space-y-16 lg:space-y-24">
            {features.map((f, i) => {
              const reverse = i % 2 === 1;
              return (
                <div key={f.title} className="grid gap-10 lg:grid-cols-2 lg:items-center">
                  <div className={reverse ? "lg:order-2" : ""}>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-navy md:text-3xl">{f.title}</h3>
                    <p className="mt-4 text-base leading-relaxed text-slate-600">{f.desc}</p>
                  </div>
                  <div className={reverse ? "lg:order-1" : ""}>
                    <Card className="overflow-hidden border-slate-200 bg-white p-1 shadow-md">
                      <div className="rounded-md bg-white p-6">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                          <f.icon className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{f.title}</span>
                        </div>
                        <div className="mt-4 space-y-2.5">
                          {[0, 1, 2, 3].map(n => (
                            <div key={n} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                              <div className="h-2 flex-1 rounded-full bg-slate-200">
                                <div className="h-full rounded-full bg-primary/60" style={{ width: `${85 - n * 15}%` }} />
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">{(85 - n * 15)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7 — Products */}
      <section id="products" className="border-b border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Built for every hard tech vertical
            </h2>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              One platform. Eight industries. The same NPI pain — finally solved.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {verticals.map(v => (
              <Card key={v.name} className="border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-primary/40">
                <h3 className="text-sm font-semibold text-navy">{v.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{v.pain}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-10 overflow-hidden border-primary/30 bg-gradient-to-br from-white to-primary/5 p-8 shadow-md md:p-10">
            <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-navy">
                <Cpu className="h-7 w-7 text-primary-glow" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-navy">Spectir NPI Intel</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  The AI agent for physical product development. Automates documentation, traceability, and knowledge work for hardware engineering teams from concept to production.
                </p>
              </div>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to={user ? "/dashboard" : "/auth"}>Learn More <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
          </Card>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Layers, name: "BOM Intel", route: "/bom",
                desc: "AI-powered bill of materials intelligence and component risk monitoring",
                bullets: [
                  "Live BOM versioning with full change history",
                  "EOL and single-source risk detection with AI-suggested alternates",
                  "BOM-to-spec traceability: every component linked to its requirement",
                ],
              },
              {
                icon: Truck, name: "Supply Intel", route: "/supply",
                desc: "Supplier qualification automation and supply chain risk monitoring",
                bullets: [
                  "Auto-generates supplier qualification packages from datasheets",
                  "Lead time tracking against NPI milestones",
                  "Supplier health monitoring: financial, geopolitical, capacity risk signals",
                ],
              },
              {
                icon: ShoppingCart, name: "Procure Intel", route: "/procurement",
                desc: "Procurement automation from purchase requisition to PO confirmation",
                bullets: [
                  "Auto-generates purchase requisitions from BOM and program timeline",
                  "RFQ drafting and supplier communication in seconds",
                  "PO tracking against gate milestones with real-time spend visibility",
                ],
              },
            ].map(p => (
              <Card key={p.name} className="flex flex-col border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-navy text-primary-glow">
                    <p.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-bold text-navy">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.desc}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-500">
                  {p.bullets.map(b => (
                    <li key={b} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" /><span>{b}</span></li>
                  ))}
                </ul>
                <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to={p.route}>Open <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — Testimonials */}
      <section className="border-b border-slate-200 bg-slate-50/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Don't take our word for it. See what others say.
            </h2>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Hardware engineers use Spectir to eliminate documentation overhead and ship faster.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {testimonials.map(t => (
              <Card key={t.author} className="border-slate-200 bg-white p-8 shadow-sm">
                <div className="font-mono text-3xl leading-none text-primary">"</div>
                <p className="mt-3 text-lg leading-relaxed text-navy">{t.quote}</p>
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <div className="text-sm font-semibold text-navy">{t.author}</div>
                  <div className="text-xs text-slate-500">{t.company}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — CTA */}
      <section id="contact" className="bg-navy py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Book a Call</h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 md:text-lg">
            Take 30 minutes to see if Spectir can put your NPI documentation on autopilot.
          </p>
          <Button asChild size="lg" className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
            <a href={DEMO_URL} target="_blank" rel="noreferrer">Book a Demo <ArrowRight className="ml-1.5 h-4 w-4" /></a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy py-10 text-white/70">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <CircuitBoard className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">Spectir</span>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
              <a href="mailto:contact@spectir.ai" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                <Mail className="h-4 w-4" /> contact@spectir.ai
              </a>
              <a href="#" className="transition-colors hover:text-white">Privacy Policy</a>
              <a href="#" className="transition-colors hover:text-white">Terms of Service</a>
            </div>
          </div>
          <div className="mt-6 text-xs text-white/50">© Spectir 2026</div>
        </div>
      </footer>
    </div>
  );
}
