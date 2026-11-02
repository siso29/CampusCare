'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Clock3,
  Wrench,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { getMaintenanceRequestSummary } from '@/lib/campuscare-api';

export default function StatCards() {
  const query = useQuery({
    queryKey: ['maintenance-request-summary'],
    queryFn: ({ signal }) => getMaintenanceRequestSummary(signal),
  });
  const summary = query.data;

  const statistics = [
    {
      title: 'Total Requests',
      value: summary?.total,
      description: 'All submitted requests',
      icon: ClipboardList,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Pending Requests',
      value: summary?.pending,
      description: 'Awaiting assignment',
      icon: Clock3,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'In Progress',
      value: summary?.inProgress,
      description: 'Currently being handled',
      icon: Wrench,
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Resolved Requests',
      value: summary?.resolved,
      description: 'Completed requests',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <section aria-label="Maintenance statistics">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Maintenance Overview
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            query.isError
              ? 'bg-red-50 text-red-700'
              : query.isPending
                ? 'bg-slate-100 text-slate-600'
                : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {query.isError
            ? 'Unavailable'
            : query.isPending
              ? 'Loading'
              : 'Live database data'}
        </span>
      </div>

      {query.isError && (
        <p role="status" className="mb-4 text-sm text-amber-700">
          Statistics are temporarily unavailable.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon size={22} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400" />
              </div>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {query.isError ? '—' : (stat.value ?? '…')}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {stat.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
