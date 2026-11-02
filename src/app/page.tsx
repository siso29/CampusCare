
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import StatCards from "@/components/dashboard/stat-cards";
import RecentRequests from "@/components/dashboard/recent-requests";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      {/* Application sidebar */}
      <Sidebar />

      {/* Main application area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 space-y-8 p-5 md:p-8">
          {/* Welcome section */}
          <section>
            <p className="text-sm font-medium text-blue-700">
              DIRE DAWA UNIVERSITY
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Campus Overview
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor maintenance activities and campus facility requests.
            </p>
          </section>

          {/* Statistics */}
          <StatCards />

          {/* Recent requests */}
          <RecentRequests />

          {/* Footer */}
          <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
            CampusCare · University Maintenance Management System
          </footer>
        </main>
      </div>
    </div>
  );
}
