'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, UploadCloud, CheckCircle2 } from 'lucide-react';
import {
  categoryOptions,
  createMaintenanceRequest,
  type MaintenanceRequest,
  type RequestPriority,
} from '@/lib/campuscare-api';

function formValue(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

export default function NewRequestPage() {
  const queryClient = useQueryClient();
  const [createdRequest, setCreatedRequest] =
    useState<MaintenanceRequest | null>(null);
  const mutation = useMutation({
    mutationFn: createMaintenanceRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['maintenance-requests'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['maintenance-request-summary'],
        }),
      ]);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatedRequest(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    mutation.mutate(
      {
        title: formValue(data, 'title'),
        category: formValue(data, 'category') as MaintenanceRequest['category'],
        priority: formValue(data, 'priority') as RequestPriority,
        location: formValue(data, 'location'),
        description: formValue(data, 'description'),
      },
      {
        onSuccess: (created) => {
          setCreatedRequest(created);
          form.reset();
        },
      },
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/requests"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to maintenance requests
        </Link>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            CampusCare
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Report a Maintenance Issue
          </h1>
          <p className="mt-2 text-slate-500">
            Tell us about the problem so the maintenance team can address it.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          onChange={() => {
            mutation.reset();
            setCreatedRequest(null);
          }}
          className="space-y-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Request Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={100}
                placeholder="Example: Broken water pipe"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Issue Category *
              </label>
              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Priority *
              </label>
              <select
                id="priority"
                name="priority"
                required
                defaultValue="MEDIUM"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Campus Location *
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                maxLength={150}
                placeholder="Example: Main Campus, Block A, Room 204"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Problem Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                placeholder="Describe what happened, where it happened, and any other useful details..."
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-2 text-xs text-slate-400">
                Please provide at least 10 characters.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 block text-sm font-semibold text-slate-700">
              Attach an Image (Optional)
            </p>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <UploadCloud className="mb-3 text-slate-400" size={32} />
              <span className="text-sm font-semibold text-slate-700">
                Image uploads are not available yet
              </span>
              <span className="mt-1 text-xs text-slate-500">
                Submit the request details without an image for now.
              </span>
            </div>
          </div>

          {mutation.isError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {mutation.error.message || 'We could not submit your request.'}
            </p>
          )}

          {createdRequest && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-semibold">Request submitted successfully.</p>
                <p className="mt-1">
                  Your request ID is {createdRequest.id}. It is now saved in
                  CampusCare.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/requests"
              className="rounded-lg border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          CampusCare · Dire Dawa University Maintenance Management
        </p>
      </div>
    </main>
  );
}
