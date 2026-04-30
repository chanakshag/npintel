import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { GitCompare, Construction } from "lucide-react";

const Changes = () => (
  <AppLayout title="Change Impact Analyzer" description="Trace downstream impact of component or spec changes.">
    <div className="mx-auto max-w-3xl">
      <Card className="flex flex-col items-center justify-center border-dashed border-border/60 px-6 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
          <GitCompare className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-base font-semibold">Coming next</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The Change Impact Analyzer surfaces every downstream document, requirement, and approval touched by a
          component or spec change — and assigns follow-up tasks.
        </p>
        <div className="mt-4 flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-[10px] text-muted-foreground">
          <Construction className="h-3 w-3" />Phase 2 of MVP
        </div>
      </Card>
    </div>
  </AppLayout>
);

export default Changes;
