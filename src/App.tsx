import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Stats } from "./pages/Stats";
import { Boards } from "./pages/Boards";
import { Settings } from "./pages/Settings";
import { SharedBoard } from "./pages/SharedBoard";
import { Auth } from "./pages/Auth";

export default function App() {
  return (
    <BrowserRouter>
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
        <Route
          path="/settings"
          element={
            <Layout>
              <Settings />
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <Auth />
            </Layout>
          }
        />
        <Route path="/board/:slug" element={<SharedBoard />} />
      </Routes>
    </BrowserRouter>
  );
}
