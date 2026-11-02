'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/campuscare-api';

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: register, onSuccess: (user) => { queryClient.setQueryData(['current-user'], user); router.replace('/requests/new'); } });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); const form = new FormData(event.currentTarget); mutation.mutate({ email: String(form.get('email') ?? ''), firstName: String(form.get('firstName') ?? ''), lastName: String(form.get('lastName') ?? ''), password: String(form.get('password') ?? '') }, { onError: (e) => setError(e instanceof Error ? e.message : 'Registration failed.') }); }
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div><p className="text-sm font-semibold text-blue-600">CAMPUSCARE</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Create your student account</h1><p className="mt-2 text-sm text-slate-500">Use at least 12 characters with uppercase, lowercase, and a number.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">First name<input required name="firstName" autoComplete="given-name" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label><label className="block text-sm font-medium text-slate-700">Last name<input required name="lastName" autoComplete="family-name" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label></div><label className="block text-sm font-medium text-slate-700">Email<input required name="email" type="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label><label className="block text-sm font-medium text-slate-700">Password<input required name="password" type="password" minLength={12} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={mutation.isPending} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{mutation.isPending ? 'Creating account…' : 'Create account'}</button><p className="text-center text-sm text-slate-600">Already have an account? <Link className="font-semibold text-blue-700" href="/login">Sign in</Link></p></form></main>;
}
