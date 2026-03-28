import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "./CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <Sidebar />
      <CommandPalette />
      <div className="lg:ml-[260px]">
        <TopBar />
        <main className="p-6 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
