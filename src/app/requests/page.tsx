'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  FilterX,
} from 'lucide-react';
import {
  categoryOptions,
  formatRequestDate,
  getCategoryLabel,
  getMaintenanceRequests,
  getMaintenanceRequestSummary,
  getPriorityLabel,
  getStatusLabel,
  type RequestCategory,
  type RequestPriority,
  type RequestStatus,
} from '@/lib/campuscare-api';

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    RESOLVED: 'bg-green-100 text-green-700',
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const styles: Record<RequestPriority, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-orange-100 text-orange-700',
    LOW: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[priority]}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<RequestPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<RequestCategory | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  const requestsQuery = useQuery({
    queryKey: [
      'maintenance-requests',
      {
        page,
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
      },
    ],
    queryFn: ({ signal }) =>
      getMaintenanceRequests({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        signal,
      }),
  });
  const summaryQuery = useQuery({
    queryKey: ['maintenance-request-summary'],
    queryFn: ({ signal }) => getMaintenanceRequestSummary(signal),
  });

  const requests = requestsQuery.data?.data ?? [];
  const meta = requestsQuery.data?.meta ?? {
    page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };
  const summary = summaryQuery.data;

  function clearFilters() {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setPage(1);
  }

  const stats = [
    { title: 'Total Requests', value: summary?.total, icon: ClipboardList },
    { title: 'Pending', value: summary?.pending, icon: Clock3 },
    { title: 'In Progress', value: summary?.inProgress, icon: AlertCircle },
    { title: 'Resolved', value: summary?.resolved, icon: CheckCircle2 },
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
                  {summaryQuery.isError ? '—' : (item.value ?? '…')}
                </p>
              </div>
            );
          })}
        </section>
        {summaryQuery.isError && (
          <p role="status" className="-mt-6 text-sm text-amber-700">
            Request totals are temporarily unavailable.
          </p>
        )}

        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Find Maintenance Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter requests by their details.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
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
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
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
                onChange={(event) => {
                  setStatusFilter(event.target.value as RequestStatus | '');
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
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
                onChange={(event) => {
                  setPriorityFilter(event.target.value as RequestPriority | '');
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="category-filter"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Filter by category
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value as RequestCategory | '');
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite" className="text-sm text-slate-500">
              {requestsQuery.isPending
                ? 'Loading requests…'
                : `Showing ${requests.length} of ${meta.total} requests`}
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

          {requestsQuery.isError ? (
            <p role="alert" className="p-8 text-center text-sm text-red-700">
              {requestsQuery.error instanceof Error
                ? requestsQuery.error.message
                : 'Could not load maintenance requests.'}
            </p>
          ) : (
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
                        {getCategoryLabel(request.category)}
                      </td>
                      <td className="px-5 py-4">
                        <PriorityBadge priority={request.priority} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatRequestDate(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {!requestsQuery.isPending && requests.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        <Search
                          className="mx-auto mb-3 text-slate-300"
                          size={32}
                        />
                        <p className="font-semibold text-slate-700">
                          No matching requests found
                        </p>
                        <p className="mt-1 text-sm">
                          {meta.total === 0 &&
                          !debouncedSearch &&
                          !statusFilter &&
                          !priorityFilter &&
                          !categoryFilter
                            ? 'Submit the first campus maintenance request.'
                            : 'Try changing your search or filters.'}
                        </p>
                      </td>
                    </tr>
                  )}
                  {requestsQuery.isPending && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        Loading requests…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <p className="text-sm text-slate-500">
              Page {page} of {Math.max(meta.totalPages, 1)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || requestsQuery.isFetching}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={requestsQuery.isFetching || page >= meta.totalPages}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
