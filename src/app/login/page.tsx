'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/campuscare-api';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: login, onSuccess: async (user) => { queryClient.setQueryData(['current-user'], user); await queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] }); router.replace(user.role === 'STUDENT' ? '/requests' : '/'); } });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); const form = new FormData(event.currentTarget); mutation.mutate({ email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') }, { onError: (e) => setError(e instanceof Error ? e.message : 'Sign-in failed.') }); }
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><form onSubmit={submit} className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div><p className="text-sm font-semibold text-blue-600">CAMPUSCARE</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Sign in</h1><p className="mt-2 text-sm text-slate-500">Use your CampusCare account to submit or manage requests.</p></div><label className="block text-sm font-medium text-slate-700">Email<input required name="email" type="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label><label className="block text-sm font-medium text-slate-700">Password<input required name="password" type="password" autoComplete="current-password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={mutation.isPending} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{mutation.isPending ? 'Signing in…' : 'Sign in'}</button><p className="text-center text-sm text-slate-600">New student? <Link className="font-semibold text-blue-700" href="/register">Create an account</Link></p></form></main>;
}
