export interface RailwayService {
  name: string;
  status: string;
  url: string;
}

export async function fetchRailwayServices(): Promise<RailwayService[]> {
  const res = await fetch("/api/railway");
  if (!res.ok) return [];
  return res.json();
}
