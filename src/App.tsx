import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Stats } from "./pages/Stats";
import { Boards } from "./pages/Boards";
import { Settings } from "./pages/Settings";
import { Auth } from "./pages/Auth";
import { SharedBoard } from "./pages/SharedBoard";

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
            </Routes>
          </AppShell>
        } />
      </Routes>
    </BrowserRouter>
  );
}
