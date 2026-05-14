import { Link } from "react-router-dom";
import { FolderOpen, ChevronRight } from "lucide-react";
import type { Project } from "@/hooks/useProject";

export function ProjectBreadcrumb({ project, currentPage }: { project: Project | null; currentPage: string }) {
  if (!project) return null;
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/projects" className="inline-flex items-center gap-1 hover:text-primary">
        <FolderOpen className="h-3 w-3" /> Projects
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link to={`/projects/${project.id}`} className="hover:text-primary">{project.name}</Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground">{currentPage}</span>
    </nav>
  );
}

export function NoProjectGuard({ message, hard = false }: { message: string; hard?: boolean }) {
  return (
    <div className={hard ? "mx-auto max-w-2xl py-12" : "mx-auto max-w-2xl py-6"}>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50 p-10 text-center">
        <FolderOpen className="mb-3 h-10 w-10 text-amber-600" />
        <p className="text-sm font-semibold text-amber-900">No project selected</p>
        <p className="mt-1 max-w-md text-xs text-amber-800">{message}</p>
        <Link to="/projects" className="mt-4 inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700">
          Go to Projects
        </Link>
      </div>
    </div>
  );
}
