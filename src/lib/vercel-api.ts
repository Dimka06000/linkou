export interface Deployment {
  id: string;
  name: string;
  url: string;
  state: "READY" | "BUILDING" | "ERROR" | "QUEUED";
  created: string;
}

export async function fetchDeployments(): Promise<Deployment[]> {
  const res = await fetch("/api/vercel");
  if (!res.ok) return [];
  return res.json();
}
