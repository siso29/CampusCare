export type RequestCategory = 'WATER_SUPPLY' | 'ELECTRICITY' | 'PLUMBING' | 'CLEANING' | 'CLASSROOM_EQUIPMENT' | 'OTHER';
export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
export type UserRole = 'STUDENT' | 'MAINTENANCE_STAFF' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
};

export type MaintenanceRequest = { id: string; title: string; description: string; category: RequestCategory; location: string; priority: RequestPriority; status: RequestStatus; imageUrl: string | null; createdAt: string; updatedAt: string };
export type MaintenanceRequestSummary = { total: number; pending: number; inProgress: number; resolved: number; highPriority: number };
export type PaginatedRequests = { data: MaintenanceRequest[]; meta: { page: number; limit: number; total: number; totalPages: number } };

export const categoryOptions: ReadonlyArray<{ label: string; value: RequestCategory }> = [
  { label: 'Water Supply', value: 'WATER_SUPPLY' }, { label: 'Electricity', value: 'ELECTRICITY' }, { label: 'Plumbing', value: 'PLUMBING' }, { label: 'Cleaning', value: 'CLEANING' }, { label: 'Classroom Equipment', value: 'CLASSROOM_EQUIPMENT' }, { label: 'Other', value: 'OTHER' },
];
const categoryLabels: Record<RequestCategory, string> = { WATER_SUPPLY: 'Water Supply', ELECTRICITY: 'Electricity', PLUMBING: 'Plumbing', CLEANING: 'Cleaning', CLASSROOM_EQUIPMENT: 'Classroom Equipment', OTHER: 'Other' };
const statusLabels: Record<RequestStatus, string> = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved' };
const priorityLabels: Record<RequestPriority, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

export class ApiError extends Error { constructor(public readonly status: number, message: string) { super(message); } }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: 'include', headers });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isRecord(body) ? body.message : undefined;
    throw new ApiError(response.status, Array.isArray(message) ? message.join(' ') : typeof message === 'string' ? message : `The server returned ${response.status}.`);
  }
  return body as T;
}
export function getCurrentUser(signal?: AbortSignal): Promise<AuthUser> { return apiRequest('/auth/me', { signal }); }
export function login(input: { email: string; password: string }): Promise<AuthUser> { return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(input) }); }
export function register(input: { email: string; firstName: string; lastName: string; password: string }): Promise<AuthUser> { return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(input) }); }
export function logout(): Promise<{ success: boolean }> { return apiRequest('/auth/logout', { method: 'POST' }); }
export function getCategoryLabel(category: RequestCategory): string { return categoryLabels[category]; }
export function getStatusLabel(status: RequestStatus): string { return statusLabels[status]; }
export function getPriorityLabel(priority: RequestPriority): string { return priorityLabels[priority]; }
export function getMaintenanceRequestImageUrl(imageUrl: string): string { return new URL(imageUrl, API_BASE_URL).toString(); }
export function getMaintenanceRequests(filters: { page?: number; limit?: number; search?: string; status?: RequestStatus; priority?: RequestPriority; category?: RequestCategory; signal?: AbortSignal } = {}): Promise<PaginatedRequests> { const p = new URLSearchParams(); p.set('page', String(filters.page ?? 1)); p.set('limit', String(filters.limit ?? 20)); if (filters.search) p.set('search', filters.search); if (filters.status) p.set('status', filters.status); if (filters.priority) p.set('priority', filters.priority); if (filters.category) p.set('category', filters.category); return apiRequest(`/maintenance-requests?${p}`, { signal: filters.signal }); }
export function getMaintenanceRequest(id: string, signal?: AbortSignal): Promise<MaintenanceRequest> { return apiRequest(`/maintenance-requests/${encodeURIComponent(id)}`, { signal }); }
export function getMaintenanceRequestSummary(signal?: AbortSignal): Promise<MaintenanceRequestSummary> { return apiRequest('/maintenance-requests/summary', { signal }); }
export function createMaintenanceRequest(input: { title: string; description: string; category: RequestCategory; location: string; priority: RequestPriority; image?: File }): Promise<MaintenanceRequest> {
  const { image, ...details } = input;
  if (image) {
    const formData = new FormData();
    Object.entries(details).forEach(([key, value]) => formData.append(key, value));
    formData.append('image', image);
    return apiRequest('/maintenance-requests', { method: 'POST', body: formData });
  }
  return apiRequest('/maintenance-requests', { method: 'POST', body: JSON.stringify(details) });
}
export function formatRequestDate(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)); }
