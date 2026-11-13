const getBaseApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  // Fall back to relative path if empty or set to placeholder so Next.js rewrites handle the proxy
  if (!envUrl || envUrl.includes('your-backend-api-url')) {
    if (typeof window !== 'undefined') {
      return '/api/v1';
    }
    return process.env.BACKEND_API_URL
      ? `${process.env.BACKEND_API_URL}/api/v1`
      : 'http://localhost:3001/api/v1';
  }
  return envUrl;
};

const API_URL = getBaseApiUrl();

export async function apiRequest<T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Important: Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      apiRequest('/auth/logout', {
        method: 'POST',
      }),
    verify: () => apiRequest('/auth/verify', { method: 'POST' }),
  },
  teams: {
    list: () => apiRequest('/teams'),
    get: (id: string) => apiRequest(`/teams/${id}`),
    create: (data: { name: string; slug: string; description?: string }) =>
      apiRequest('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; description?: string }) =>
      apiRequest(`/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getMembers: (id: string) => apiRequest(`/teams/${id}/members`),
    getMemberProfile: (teamId: string, memberId: string) =>
      apiRequest(`/teams/${teamId}/members/${memberId}/profile`),
    addMember: (id: string, data: { userId: string; role: string }) =>
      apiRequest(`/teams/${id}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    removeMember: (id: string, memberId: string) =>
      apiRequest(`/teams/${id}/members/${memberId}`, {
        method: 'DELETE',
      }),
  },
  platformAdmin: {
    getDashboard: () => apiRequest('/platform-admin/dashboard'),
    getActivity: (limit?: number) =>
      apiRequest(`/platform-admin/activity${limit ? `?limit=${limit}` : ''}`),
    getAuditLogs: () => apiRequest('/platform-admin/audit-logs'),
    getUsers: (search?: string) =>
      apiRequest(`/platform-admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    createUser: (data: {
      name: string;
      email: string;
      password?: string;
      role?: string;
      teamId?: string;
      teamRole?: string;
    }) =>
      apiRequest('/platform-admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteUser: (userId: string) =>
      apiRequest(`/platform-admin/users/${userId}`, {
        method: 'DELETE',
      }),
    getUserProfile: (userId: string) =>
      apiRequest(`/platform-admin/users/${userId}/profile`),
  },
  projects: {
    create: (teamId: string, data: any) =>
      apiRequest(`/teams/${teamId}/projects`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (teamId: string, status?: string) =>
      apiRequest(`/teams/${teamId}/projects${status ? `?status=${status}` : ''}`),
    get: (teamId: string, projectId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}`),
    update: (teamId: string, projectId: string, data: any) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    updateStatus: (teamId: string, projectId: string, status: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    assignLead: (teamId: string, projectId: string, teamMemberId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/lead`, {
        method: 'PATCH',
        body: JSON.stringify({ teamMemberId }),
      }),
    getStats: (teamId: string) =>
      apiRequest(`/teams/${teamId}/projects/stats`),
    getActivity: (teamId: string, projectId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/activity`),
  },
  projectMembers: {
    list: (teamId: string, projectId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/members`),
    add: (teamId: string, projectId: string, data: { teamMemberId: string; responsibility?: string }) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    remove: (teamId: string, projectId: string, memberId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      }),
  },
  milestones: {
    list: (teamId: string, projectId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/milestones`),
    get: (teamId: string, projectId: string, milestoneId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/milestones/${milestoneId}`),
    create: (teamId: string, projectId: string, data: any) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (teamId: string, projectId: string, milestoneId: string, data: any) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (teamId: string, projectId: string, milestoneId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'DELETE',
      }),
  },
  tasks: {
    list: (teamId: string, projectId: string, filters?: {
      status?: string;
      priority?: string;
      milestoneId?: string;
      assigneeId?: string;
      search?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      const query = params.toString();
      return apiRequest(`/teams/${teamId}/projects/${projectId}/tasks${query ? `?${query}` : ''}`);
    },
    get: (teamId: string, projectId: string, taskId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}`),
    create: (teamId: string, projectId: string, data: any) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (teamId: string, projectId: string, taskId: string, data: any) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    updateStatus: (teamId: string, projectId: string, taskId: string, status: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    delete: (teamId: string, projectId: string, taskId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
      }),
  },
  contributions: {
    submit: (teamId: string, projectId: string, taskId: string, data: {
      progressPercent: number;
      hoursSpent: number;
      description: string;
      evidenceUrl?: string;
    }) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/contributions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (teamId: string, projectId: string, taskId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/contributions`),
    getByMember: (teamId: string, memberId: string) =>
      apiRequest(`/teams/${teamId}/members/${memberId}/contributions`),
    getStats: (teamId: string, memberId: string) =>
      apiRequest(`/teams/${teamId}/members/${memberId}/contributions/stats`),
  },
  reviews: {
    getPending: (teamId: string, projectId: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/reviews/pending`),
    approve: (teamId: string, projectId: string, reviewId: string, feedback?: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/reviews/${reviewId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ feedback }),
      }),
    reject: (teamId: string, projectId: string, reviewId: string, feedback: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/reviews/${reviewId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ feedback }),
      }),
    requestChanges: (teamId: string, projectId: string, reviewId: string, feedback: string) =>
      apiRequest(`/teams/${teamId}/projects/${projectId}/reviews/${reviewId}/request-changes`, {
        method: 'PATCH',
        body: JSON.stringify({ feedback }),
      }),
  },
  notifications: {
    list: () => apiRequest('/notifications'),
    getUnreadCount: () => apiRequest('/notifications/unread-count'),
    markAsRead: (notificationId: string) =>
      apiRequest(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
      }),
    markAllAsRead: () =>
      apiRequest('/notifications/mark-all-read', {
        method: 'PATCH',
      }),
    delete: (notificationId: string) =>
      apiRequest(`/notifications/${notificationId}`, {
        method: 'DELETE',
      }),
  },
  analytics: {
    global: () => apiRequest('/analytics/global'),
    team: (teamId: string) => apiRequest(`/analytics/teams/${teamId}`),
    project: (projectId: string) => apiRequest(`/analytics/projects/${projectId}`),
    member: (memberId: string) => apiRequest(`/analytics/members/${memberId}`),
    me: () => apiRequest('/analytics/me'),
  },
};
