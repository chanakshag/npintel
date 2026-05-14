import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type Project = {
  id: string;
  name: string;
  product_description: string;
  industry: string;
  gate_standard: string;
};

/**
 * Resolves the current project from either:
 *  - URL param :projectId  (e.g. /projects/:projectId)
 *  - Query param ?project_id=...
 */
export function useProject() {
  const { projectId: paramId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const queryId = new URLSearchParams(location.search).get("project_id");
  const projectId = paramId ?? queryId ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!!projectId);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle().then(({ data }) => {
      if (!cancelled) {
        setProject((data as Project) ?? null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [projectId]);

  return { projectId, project, loading };
}
