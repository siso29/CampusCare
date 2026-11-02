'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { ApiError, getCurrentUser } from '@/lib/campuscare-api';

const options = { defaultOptions: { queries: { staleTime: 30_000, retry: 1 }, mutations: { retry: 0 } } };
let browserQueryClient: QueryClient | undefined;
function getQueryClient() { if (typeof window === 'undefined') return new QueryClient(options); browserQueryClient ??= new QueryClient(options); return browserQueryClient; }

function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = pathname === '/login' || pathname === '/register';
  const user = useQuery({ queryKey: ['current-user'], queryFn: ({ signal }) => getCurrentUser(signal), retry: false, enabled: !publicRoute });
  useEffect(() => { if (user.error instanceof ApiError && user.error.status === 401) router.replace('/login'); }, [router, user.error]);
  if (publicRoute) return <>{children}</>;
  if (user.isPending) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-600">Checking your session…</main>;
  if (user.error instanceof ApiError && user.error.status === 401) return null;
  if (user.isError) return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><p className="font-semibold text-slate-900">CampusCare is unavailable</p><p className="mt-2 text-sm text-slate-600">Please check that the backend is running, then refresh this page.</p></div></main>;
  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) { const [queryClient] = useState(getQueryClient); return <QueryClientProvider client={queryClient}><AuthGate>{children}</AuthGate></QueryClientProvider>; }
