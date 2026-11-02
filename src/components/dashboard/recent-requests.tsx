
import { MapPin, ArrowUpRight } from "lucide-react";

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
    Pending: "bg-amber-50 text-amber-700",
    "In Progress": "bg-blue-50 text-blue-700",
    Resolved: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    High: "text-red-600",
    Medium: "text-amber-600",
    Low: "text-slate-500",
  };

  return (
    <span
      className={`text-xs font-semibold ${styles[priority] ?? "text-slate-500"}`}
    >
      {priority}
    </span>
  );
}

export default function RecentRequests() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h3 className="font-semibold text-slate-900">
            Recent Maintenance Requests
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Latest reported campus issues
          </p>
        </div>

        <a
          href="#requests"
          className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          View all <ArrowUpRight size={16} />
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Request</th>
              <th className="px-5 py-4 font-semibold">Location</th>
              <th className="px-5 py-4 font-semibold">Priority</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-900">
                    {request.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.id} · {request.category}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin size={15} className="shrink-0 text-slate-400" />
                    {request.location}
                  </div>
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
  );
}
