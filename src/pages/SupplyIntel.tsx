import { useState } from "react";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupplyIntel() {
  const [email, setEmail] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("You're on the waitlist!", { description: "We'll be in touch when Supply Intel ships." });
    setEmail("");
  };
  return (
    <AppLayout title="Supply Intel" description="Coming soon">
      <div className="mx-auto flex max-w-xl items-center justify-center py-12">
        <Card className="w-full border-border/60 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-navy text-primary-glow">
            <Truck className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-navy">Supply Intel</h2>
          <p className="mt-2 text-sm text-slate-600">Supplier qualification & supply chain risk monitoring</p>
          <span className="mt-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">Coming Soon</span>
          <p className="mt-6 text-sm text-muted-foreground">We're building this next. Join the waitlist to get early access.</p>
          <form onSubmit={submit} className="mt-6 flex gap-2">
            <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Join Waitlist</Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
