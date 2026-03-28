interface Repo {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
}

export async function fetchRecentRepos(): Promise<Repo[]> {
  const res = await fetch("/api/github?type=repos");
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRepoCommits(repo: string): Promise<any[]> {
  const res = await fetch(`/api/github?type=commits&repo=${repo}`);
  if (!res.ok) return [];
  return res.json();
}
