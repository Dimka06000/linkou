import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Stats } from "./pages/Stats";
import { Boards } from "./pages/Boards";
import { SharedBoard } from "./pages/SharedBoard";
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
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Dashboard />
          </Layout>
        }
      />
      <Route
        path="/stats"
        element={
          <Layout>
            <Stats />
          </Layout>
        }
      />
      <Route
        path="/boards"
        element={
          <Layout>
            <Boards />
          </Layout>
        }
      />
      <Route path="/board/:slug" element={<SharedBoard />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
