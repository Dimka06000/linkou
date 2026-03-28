import { useEffect, useState } from "react";
import { fetchRecentRepos } from "../lib/github";
import { fetchDeployments } from "../lib/vercel-api";
import { fetchRailwayServices } from "../lib/railway-api";
import { useAuth } from "./useAuth";
import type { Project } from "../types";

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [repos, deployments, railwayServices] = await Promise.all([
        fetchRecentRepos(user?.id),
        fetchDeployments(),
        fetchRailwayServices(),
      ]);

      const merged: Project[] = repos.map((repo) => {
        const deploy = deployments.find((d) => d.name === repo.name.toLowerCase());
        const railwayMatch = railwayServices.find((s: any) => s.name.toLowerCase() === repo.name.toLowerCase());
        return {
          name: repo.name,
          repoUrl: repo.url,
          prodUrl: deploy?.url || "",
          platform: railwayMatch ? "railway" as const : "vercel" as const,
          lastCommit: { message: "", date: repo.updatedAt, author: "" },
          deployStatus: deploy
            ? deploy.state === "READY" ? "ready" : deploy.state === "BUILDING" ? "building" : "error"
            : "unknown",
          deployDate: deploy?.created || "",
        };
      });

      setProjects(merged);
      setLoading(false);
    }
    load();
  }, [user]);

  return { projects, loading };
}
