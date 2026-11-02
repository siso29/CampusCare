
import { Bell, Search, ChevronDown, Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
      {/* Mobile menu placeholder and page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Dashboard
          </h2>
          <p className="hidden text-sm text-slate-500 sm:block">
            Welcome to CampusCare administration
          </p>
        </div>
      </div>

      {/* Search and profile */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 md:flex">
          <Search size={17} className="text-slate-400" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search"
            className="w-36 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Bell size={21} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            CA
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Administrator
            </p>
            <p className="text-xs text-slate-500">
              Campus Management
            </p>
          </div>

          <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
