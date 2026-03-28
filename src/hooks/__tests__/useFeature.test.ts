import { isFeatureEnabled } from "../useFeature";

test("returns true when env var is set", () => {
  import.meta.env.VITE_SUPABASE_URL = "https://test.supabase.co";
  expect(isFeatureEnabled("supabase")).toBe(true);
});

test("returns false when env var is empty", () => {
  import.meta.env.VITE_SUPABASE_URL = "";
  expect(isFeatureEnabled("supabase")).toBe(false);
});
