import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Stats } from "./pages/Stats";
import { Boards } from "./pages/Boards";
import { Settings } from "./pages/Settings";
import { Auth } from "./pages/Auth";
import { SharedBoard } from "./pages/SharedBoard";
import { LinksCategory } from "./pages/LinksCategory";
import { Integrations } from "./pages/Integrations";
import { Projets } from "./pages/Projets";
import { ProjetDetail } from "./pages/ProjetDetail";
import { Planning } from "./pages/Planning";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/board/:slug" element={<SharedBoard />} />
        <Route path="*" element={
          <AppShell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/boards" element={<Boards />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/links/:categoryId" element={<LinksCategory />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/projets" element={<Projets />} />
              <Route path="/projets/:name" element={<ProjetDetail />} />
              <Route path="/planning" element={<Planning />} />
            </Routes>
          </AppShell>
        } />
      </Routes>
    </BrowserRouter>
  );
}
