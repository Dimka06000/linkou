import { SearchBar } from "./SearchBar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200">
      <header className="sticky top-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-xl border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight">
              Lin<span className="text-indigo-500">kou</span>
            </div>
          </div>
          <SearchBar />
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
