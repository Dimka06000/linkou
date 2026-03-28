import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Stats } from "./pages/Stats";
import { Auth } from "./pages/Auth";
import { useAuth } from "./hooks/useAuth";
import { isSaasMode } from "./hooks/useFeature";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (isSaasMode() && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d] text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  if (isSaasMode() && !user) {
    return (
      <Layout>
        <Auth />
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
