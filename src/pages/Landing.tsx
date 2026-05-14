import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Cpu, FileText, GitBranch, MessagesSquare, ClipboardCheck, GitCompare,
  ArrowRight, Check, Workflow, Shield, Zap, Sparkles, BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const products = [
  {
    name: "NPI Intelligence",
    tag: "Available now",
    tagline: "AI for hardware engineering teams",
    description:
      "Accelerate New Product Introduction with document intelligence, requirements traceability, gate review automation, and change impact analysis.",
    features: [
      "Document ingestion & semantic search",
      "Auto-extracted requirements with traceability",
      "Gate review checklists (EVT / DVT / PVT)",
      "Change impact analysis across the BOM",
    ],
    icon: Cpu,
    href: "/dashboard",
    primary: true,
  },
  {
    name: "Spectrum Compliance",
    tag: "Coming soon",
    tagline: "Continuous regulatory compliance",
    description:
      "Stay audit-ready across ISO, FDA, AS9100, and IATF — automated evidence collection and gap detection.",
    features: ["Evidence vault", "Audit trail automation", "Standards mapping", "Auditor-ready exports"],
    icon: Shield,
    href: "#",
    primary: false,
  },
  {
    name: "Spectrum Insights",
    tag: "Coming soon",
    tagline: "Engineering analytics platform",
    description:
      "Cycle-time, defect, and quality analytics across programs — turn engineering data into executive signal.",
    features: ["Program dashboards", "Cross-project benchmarks", "Predictive risk scoring", "Custom KPIs"],
    icon: Sparkles,
    href: "#",
    primary: false,
  },
];

const npiCapabilities = [
  { icon: FileText, title: "Document Intelligence", desc: "Datasheets, PRDs, test reports — parsed, indexed, and searchable." },
  { icon: GitBranch, title: "Requirements Traceability", desc: "Auto-link requirements to verification artifacts across the V-model." },
  { icon: ClipboardCheck, title: "Gate Reviews", desc: "Generate review packages for EVT, DVT, PVT, PDR, CDR in minutes." },
  { icon: GitCompare, title: "Change Impact", desc: "See exactly what a BOM or spec change ripples into — before you commit." },
  { icon: MessagesSquare, title: "Research Copilot", desc: "Ask the agent grounded questions across your entire knowledge base." },
  { icon: BookOpen, title: "Knowledge Board", desc: "Persistent, shareable engineering memory for the whole team." },
];

const stats = [
  { value: "70%", label: "Faster gate prep" },
  { value: "12×", label: "Document throughput" },
  { value: "100%", label: "Requirement coverage" },
  { value: "0", label: "Lost design rationale" },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-glow shadow-elegant">
              <Cpu className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Spectrum</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#products" className="transition-colors hover:text-foreground">Products</a>
            <a href="#npi" className="transition-colors hover:text-foreground">NPI Intelligence</a>
            <a href="#why" className="transition-colors hover:text-foreground">Why Spectrum</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm"><Link to="/dashboard">Open app <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
                <Button asChild size="sm"><Link to="/auth">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--gradient-glow)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 text-[10px] font-medium uppercase tracking-wider">
              Spectrum · Engineering intelligence platform
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Build hardware <span className="text-gradient">faster</span>, with the rigor it deserves.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
              Spectrum is the AI platform for hardware teams. Our flagship product — <span className="font-medium text-foreground">NPI Intelligence</span> —
              turns scattered documents, requirements, and reviews into a single source of engineering truth.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to={user ? "/dashboard" : "/auth"}>
                  Try NPI Intelligence <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg"><a href="#products">Explore products</a></Button>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map(s => (
              <Card key={s.label} className="border-border/60 bg-background/50 p-4 text-center backdrop-blur">
                <div className="font-mono text-2xl font-semibold tracking-tight text-primary">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="border-b border-border/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Product suite</Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">One platform. Built for hardware.</h2>
            <p className="mt-3 text-muted-foreground">
              Spectrum is a growing suite of AI products for engineering teams. Start with NPI Intelligence today.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {products.map(p => (
              <Card
                key={p.name}
                className={`relative flex flex-col overflow-hidden border-border/60 p-6 transition-shadow hover:shadow-elegant ${
                  p.primary ? "ring-1 ring-primary/40" : ""
                }`}
              >
                {p.primary && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary-glow" />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                    <p.icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={p.primary ? "default" : "secondary"} className="text-[10px]">{p.tag}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.name}</h3>
                <p className="mt-0.5 text-xs uppercase tracking-wider text-primary">{p.tagline}</p>
                <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {p.primary ? (
                    <Button asChild className="w-full">
                      <Link to={user ? p.href : "/auth"}>Open NPI Intelligence <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>Join waitlist</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* NPI deep-dive */}
      <section id="npi" className="border-b border-border/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="secondary" className="mb-3 text-[10px] uppercase tracking-wider">Spectrum NPI Intelligence</Badge>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Your engineering knowledge base, <span className="text-gradient">automated.</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Drop in datasheets, PRDs, and test reports. The agent extracts requirements, builds traceability,
                runs gate reviews, and answers grounded engineering questions — across every project, instantly.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild><Link to={user ? "/dashboard" : "/auth"}>Get started <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
                <Button asChild variant="outline"><Link to={user ? "/projects" : "/auth"}>Create a project</Link></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {npiCapabilities.map(c => (
                <Card key={c.title} className="border-border/60 p-4">
                  <c.icon className="h-5 w-5 text-primary" />
                  <h4 className="mt-3 text-sm font-semibold">{c.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="border-b border-border/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider">Why Spectrum</Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for the way hardware actually ships.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Workflow, title: "Tailored workflows", desc: "Every project gets a workflow generated for its industry and gate standard." },
              { icon: Zap, title: "Grounded AI", desc: "Answers cite the source document and section. No hallucinated specs." },
              { icon: Shield, title: "Audit-ready", desc: "Full traceability, immutable change log, exportable review packages." },
            ].map(b => (
              <div key={b.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <Card className="relative overflow-hidden border-border/60 p-10 text-center md:p-14">
            <div className="absolute inset-0 opacity-80" style={{ backgroundImage: "var(--gradient-glow)" }} />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Ship your next product with Spectrum.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Start free with NPI Intelligence. No credit card required.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link to={user ? "/dashboard" : "/auth"}>
                    {user ? "Open app" : "Get started free"} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg"><a href="#products">See all products</a></Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground md:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary to-primary-glow">
              <Cpu className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">Spectrum</span>
            <span>· Engineering intelligence platform</span>
          </div>
          <div>© {new Date().getFullYear()} Spectrum. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
