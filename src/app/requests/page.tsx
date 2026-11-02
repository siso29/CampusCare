import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const requests = [
  {
    id: "REQ-001",
    title: "Broken water pipe",
    location: "Main Campus - Block A",
    category: "Plumbing",
    priority: "High",
    status: "Pending",
    date: "Nov 01, 2026",
  },
  {
    id: "REQ-002",
    title: "Classroom lights not working",
    location: "Engineering Building",
    category: "Electrical",
    priority: "Medium",
    status: "In Progress",
    date: "Oct 31, 2026",
  },
  {
    id: "REQ-003",
    title: "Damaged classroom door",
    location: "Block C - Room 204",
    category: "Maintenance",
    priority: "Low",
    status: "Resolved",
    date: "Oct 30, 2026",
  },
  {
    id: "REQ-004",
    title: "Blocked drainage system",
    location: "Student Dormitory",
    category: "Plumbing",
    priority: "High",
    status: "In Progress",
    date: "Oct 30, 2026",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Resolved: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-orange-100 text-orange-700",
    Low: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[priority] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {priority}
    </span>
  );
}

export default function RequestsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <p className="text-sm font-semibold text-blue-700">
            CAMPUSCARE / MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Maintenance Requests
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage, review, and monitor university maintenance requests.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Total Requests",
              value: "128",
              icon: ClipboardList,
            },
            {
              title: "Pending",
              value: "24",
              icon: Clock3,
            },
            {
              title: "In Progress",
              value: "18",
              icon: AlertCircle,
            },
            {
              title: "Resolved",
              value: "86",
              icon: CheckCircle2,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{item.title}</p>
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>

                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              All Maintenance Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the latest reported campus facility problems.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Request ID</th>
                  <th className="px-5 py-4 font-medium">Request</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Priority</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-blue-700">
                      {request.id}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {request.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.location}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {request.category}
                    </td>

                    <td className="px-5 py-4">
                      <PriorityBadge priority={request.priority} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={request.status} />
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {request.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}