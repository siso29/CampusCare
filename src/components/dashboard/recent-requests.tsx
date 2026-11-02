'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MapPin, ArrowUpRight } from 'lucide-react';
import {
  formatRequestDate,
  getCategoryLabel,
  getMaintenanceRequests,
  getPriorityLabel,
  getStatusLabel,
  type RequestPriority,
  type RequestStatus,
} from '@/lib/campuscare-api';

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    RESOLVED: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const styles: Record<RequestPriority, string> = {
    HIGH: 'text-red-600',
    MEDIUM: 'text-amber-600',
    LOW: 'text-slate-500',
  };

  return (
    <span className={`text-xs font-semibold ${styles[priority]}`}>
      {getPriorityLabel(priority)}
    </span>
  );
}

export default function RecentRequests() {
  const query = useQuery({
    queryKey: ['maintenance-requests', { page: 1, limit: 5 }],
    queryFn: ({ signal }) =>
      getMaintenanceRequests({ limit: 5, signal }),
  });
  const requests = query.data?.data ?? [];

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
        <Link
          href="/requests"
          className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          View all <ArrowUpRight size={16} />
        </Link>
      </div>

      {query.isError ? (
        <p role="alert" className="p-8 text-center text-sm text-red-700">
          {query.error instanceof Error
            ? query.error.message
            : 'Could not load recent requests.'}
        </p>
      ) : (
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
                      {request.id} · {getCategoryLabel(request.category)}
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
                    {formatRequestDate(request.createdAt)}
                  </td>
                </tr>
              ))}
              {query.isPending && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    Loading recent requests…
                  </td>
                </tr>
              )}
              {!query.isPending && requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No maintenance requests have been submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
