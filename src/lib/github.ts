export interface Repo {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
}

export async function fetchRecentRepos(userId?: string): Promise<Repo[]> {
  const params = new URLSearchParams({ type: "repos" });
  if (userId) params.set("userId", userId);
  const res = await fetch(`/api/github?${params}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRepoCommits(repo: string, userId?: string): Promise<any[]> {
  const params = new URLSearchParams({ type: "commits", repo });
  if (userId) params.set("userId", userId);
  const res = await fetch(`/api/github?${params}`);
  if (!res.ok) return [];
  return res.json();
}
