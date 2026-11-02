
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Wrench,
  Building2,
} from "lucide-react";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      { label: "Maintenance Requests", icon: ClipboardList, href: "#requests" },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Campus Locations", icon: MapPin, href: "#locations" },
      { label: "Maintenance Staff", icon: Users, href: "#staff" },
      { label: "Reports & Analytics", icon: BarChart3 },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      {/* Brand */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
          <Building2 size={22} />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            CampusCare
          </h1>
          <p className="text-xs text-slate-500">
            University Management
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-x-auto p-4">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-400">
              {group.title}
            </p>

            <div className="flex gap-2 lg:flex-col">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.label === "Dashboard";

                return (
                  <a
                    key={item.label}
                    href={item.href ?? "#"}
                    aria-disabled={!item.href}
                    className={`flex min-w-fit items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    } ${!item.href ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="hidden border-t border-slate-100 p-4 lg:block">
        <div className="flex items-center gap-3 rounded-lg p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
            <Wrench size={18} className="text-slate-600" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Campus Administration
            </p>
            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>

          <Settings size={17} className="ml-auto text-slate-400" />
        </div>
      </div>
    </aside>
  );
}
