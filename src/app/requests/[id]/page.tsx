'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Tag,
} from 'lucide-react';
import {
  formatRequestDate,
  getCategoryLabel,
  getMaintenanceRequest,
  getMaintenanceRequestImageUrl,
  getPriorityLabel,
  getStatusLabel,
  type RequestPriority,
  type RequestStatus,
} from '@/lib/campuscare-api';

const statusStyles: Record<RequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
};

const priorityStyles: Record<RequestPriority, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  LOW: 'bg-slate-100 text-slate-600',
};

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const requestQuery = useQuery({
    queryKey: ['maintenance-request', id],
    queryFn: ({ signal }) => getMaintenanceRequest(id, signal),
  });

  if (requestQuery.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-sm text-slate-600">
        Loading request details…
      </main>
    );
  }

  if (requestQuery.isError) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 md:p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Could not load this request
          </h1>
          <p role="alert" className="mt-2 text-sm text-red-700">
            {requestQuery.error instanceof Error
              ? requestQuery.error.message
              : 'Please try again.'}
          </p>
          <Link
            href="/requests"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
          >
            <ArrowLeft size={16} />
            Back to requests
          </Link>
        </div>
      </main>
    );
  }

  const request = requestQuery.data;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/requests"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Back to maintenance requests
        </Link>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Maintenance Request · {request.id}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {request.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[request.status]}`}
              >
                {getStatusLabel(request.status)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[request.priority]}`}
              >
                {getPriorityLabel(request.priority)} priority
              </span>
            </div>
          </header>

          <div className="space-y-7 p-6 sm:p-8">
            <dl className="grid gap-5 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0 text-slate-400" size={18} />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {request.location}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="mt-0.5 shrink-0 text-slate-400" size={18} />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Category
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {getCategoryLabel(request.category)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays
                  className="mt-0.5 shrink-0 text-slate-400"
                  size={18}
                />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Submitted
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-slate-800">
                    {formatRequestDate(request.createdAt)}
                  </dd>
                </div>
              </div>
            </dl>

            <section aria-labelledby="description-heading">
              <h2
                id="description-heading"
                className="text-sm font-semibold text-slate-900"
              >
                Problem description
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {request.description}
              </p>
            </section>

            {request.imageUrl && (
              <section aria-labelledby="image-heading">
                <h2
                  id="image-heading"
                  className="mb-3 text-sm font-semibold text-slate-900"
                >
                  Attached image
                </h2>
                <a
                  href={getMaintenanceRequestImageUrl(request.imageUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  aria-label="Open attached image in a new tab"
                >
                  <Image
                    src={getMaintenanceRequestImageUrl(request.imageUrl)}
                    alt={`Image attached to ${request.title}`}
                    width={1200}
                    height={900}
                    unoptimized
                    crossOrigin="use-credentials"
                    className="max-h-[32rem] w-full object-contain"
                  />
                </a>
              </section>
            )}

            <p className="border-t border-slate-100 pt-4 text-xs text-slate-400">
              Last updated {formatRequestDate(request.updatedAt)}
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
