
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  FilterX,
} from "lucide-react";

type MaintenanceRequest = {
  id: string;
  title: string;
  location: string;
  category: string;
  priority: string;
  status: string;
  date: string;
};

const requests: MaintenanceRequest[] = [
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filteredRequests = requests.filter((request) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch = [
      request.id,
      request.title,
      request.location,
      request.category,
    ].some((value) => value.toLowerCase().includes(search));

    const matchesStatus =
      statusFilter === "All" || request.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All" || request.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
  }

  const stats = [
    { title: "Total Requests", value: "128", icon: ClipboardList },
    { title: "Pending", value: "24", icon: Clock3 },
    { title: "In Progress", value: "18", icon: AlertCircle },
    { title: "Resolved", value: "86", icon: CheckCircle2 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              CAMPUSCARE / MANAGEMENT
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Maintenance Requests
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage, review, and monitor university maintenance requests.
            </p>
          </div>

          <Link
            href="/requests/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Submit New Request
          </Link>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
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

        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Find Maintenance Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter requests by their details.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label
                htmlFor="request-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search requests
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="request-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search ID, title, location..."
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Filter by status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="priority-filter"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Filter by priority
              </label>

              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredRequests.length}
              </span>{" "}
              of {requests.length} demonstration requests
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FilterX size={16} />
              Clear Filters
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              All Maintenance Requests
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the reported campus facility problems.
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
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="transition hover:bg-slate-50">
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
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      <Search className="mx-auto mb-3 text-slate-300" size={32} />
                      <p className="font-semibold text-slate-700">
                        No matching requests found
                      </p>
                      <p className="mt-1 text-sm">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
