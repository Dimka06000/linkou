const FEATURE_MAP = {
  supabase: "VITE_SUPABASE_URL",
  github: "VITE_GITHUB_ENABLED",
} as const;

type Feature = keyof typeof FEATURE_MAP;

export function isFeatureEnabled(feature: Feature): boolean {
  const envVar = FEATURE_MAP[feature];
  const value = import.meta.env[envVar];
  return typeof value === "string" && value.length > 0;
}

export function useFeature(feature: Feature): boolean {
  return isFeatureEnabled(feature);
}

export function isSaasMode(): boolean {
  return import.meta.env.VITE_MODE === "saas";
}
