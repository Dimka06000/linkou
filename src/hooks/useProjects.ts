import { useEffect, useState } from "react";
import { fetchRecentRepos } from "../lib/github";
import { fetchRepoCommits } from "../lib/github";
import { fetchDeployments } from "../lib/vercel-api";
import { fetchRailwayServices } from "../lib/railway-api";
import { useAuth } from "./useAuth";
import type { Project, Commit } from "../types";

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

      const merged: Project[] = await Promise.all(
        repos.map(async (repo) => {
          const deploy = deployments.find((d) => d.name === repo.name.toLowerCase());
          const railwayMatch = railwayServices.find((s: any) => s.name.toLowerCase() === repo.name.toLowerCase());

          let commits: Commit[] = [];
          try {
            const rawCommits = await fetchRepoCommits(repo.name, user?.id);
            commits = rawCommits.slice(0, 5).map((c: any) => ({
              sha: c.sha?.slice(0, 7) ?? "",
              message: c.commit?.message?.split("\n")[0] ?? "",
              date: c.commit?.author?.date ?? "",
              author: c.commit?.author?.name ?? "",
            }));
          } catch {
            // silently ignore
          }

          const lastCommitRaw = commits[0];

          return {
            name: repo.name,
            repoUrl: repo.url,
            prodUrl: deploy?.url || "",
            platform: railwayMatch ? "railway" as const : "vercel" as const,
            description: repo.description ?? "",
            language: repo.language ?? "",
            stars: repo.stars ?? 0,
            lastCommit: lastCommitRaw
              ? { message: lastCommitRaw.message, date: lastCommitRaw.date, author: lastCommitRaw.author }
              : { message: "", date: repo.updatedAt, author: "" },
            commits,
            deployStatus: deploy
              ? deploy.state === "READY" ? "ready" : deploy.state === "BUILDING" ? "building" : "error"
              : "unknown",
            deployDate: deploy?.created || "",
          };
        })
      );

      setProjects(merged);
      setLoading(false);
    }
    load();
  }, [user]);

  return { projects, loading };
}
