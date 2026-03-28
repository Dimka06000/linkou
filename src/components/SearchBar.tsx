import { useEffect, useRef } from "react";
import { useAppStore } from "../store";

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchQuery, setSearchQuery } = useAppStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setSearchQuery]);

  return (
    <div className="relative">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher un lien ou une plateforme..."
        className="w-full pl-10 pr-4 py-3 bg-[#161616] border border-[#2a2a2a] rounded-xl text-gray-200 text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-500"
      />
    </div>
  );
}
