/**
 * IMPORTANT: This file MUST call the API only via src/lib/api/client.ts.
 * Changing endpoints, paths, or schemas is forbidden. If impossible, add a
 * TODO(api-extension) and stop. See /docs/api/extension-proposal.md.
 */

import { z } from "zod";
import {
  TimeEntry,
  TimeEntryWithDetails,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  StartTimerRequest,
  StopTimerRequest,
  TimeEntriesQuery,
  OngoingTimer,
  TimeEntriesResponse,
  TimeEntryResponse,
  ApiResponse,
  TimeEntriesResponse as TimeEntriesResponseSchema,
  TimeEntryResponse as TimeEntryResponseSchema,
  ApiResponse as ApiResponseSchema,
} from "./schemas";

// HTTP client wrapper with auth and retry logic
class HttpClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? '' : process.env.BASE_URL || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session auth
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, query?: Record<string, any>): Promise<T> {
    const url = query ? `${endpoint}?${new URLSearchParams(query)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const http = new HttpClient();

// Typed API client - single source of truth for all API calls
export const api = {
  // Time entries operations
  listEntries: async (query?: TimeEntriesQuery) => {
    const validatedQuery = query ? TimeEntriesQuery.parse(query) : undefined;
    const response = await http.get<TimeEntriesResponse>('/api/time-entries-unified', validatedQuery);
    return TimeEntriesResponseSchema.parse(response);
  },

  createEntry: async (input: CreateTimeEntryRequest) => {
    const body = CreateTimeEntryRequest.parse(input);
    const response = await http.post<TimeEntryResponse>('/api/time-entries-unified', body);
    return TimeEntryResponseSchema.parse(response);
  },

  getEntry: async (id: number) => {
    const response = await http.get<TimeEntryResponse>(`/api/time-entries-unified/${id}`);
    return TimeEntryResponseSchema.parse(response);
  },

  updateEntry: async (id: number, input: UpdateTimeEntryRequest) => {
    const body = UpdateTimeEntryRequest.parse(input);
    const response = await http.patch<TimeEntryResponse>(`/api/time-entries-unified/${id}`, body);
    return TimeEntryResponseSchema.parse(response);
  },

  deleteEntry: async (id: number) => {
    const response = await http.delete<ApiResponse>(`/api/time-entries-unified/${id}`);
    return ApiResponseSchema.parse(response);
  },

  // Timer operations
  startTimer: async (input: StartTimerRequest) => {
    const body = StartTimerRequest.parse(input);
    const response = await http.post<{ success: boolean; data: OngoingTimer }>('/api/timers/ongoing', body);
    return response;
  },

  stopTimer: async (timerId: number) => {
    const response = await http.post<ApiResponse>(`/api/timers/ongoing/stop`, { timerId });
    return ApiResponseSchema.parse(response);
  },

  getOngoingTimer: async (userId?: number) => {
    const query = userId ? { userId } : undefined;
    const response = await http.get<{ success: boolean; data: OngoingTimer | null }>('/api/timers/user-ongoing', query);
    return response;
  },

  // Legacy endpoints (for backward compatibility)
  listEntriesLegacy: async (query?: TimeEntriesQuery) => {
    const validatedQuery = query ? TimeEntriesQuery.parse(query) : undefined;
    const response = await http.get<TimeEntriesResponse>('/api/time-entries', validatedQuery);
    return TimeEntriesResponseSchema.parse(response);
  },

  createEntryLegacy: async (input: CreateTimeEntryRequest) => {
    const body = CreateTimeEntryRequest.parse(input);
    const response = await http.post<TimeEntryResponse>('/api/time-entries', body);
    return TimeEntryResponseSchema.parse(response);
  },
} as const;

// Export types for use in components
export type ApiClient = typeof api;
export type { TimeEntry, TimeEntryWithDetails, CreateTimeEntryRequest, UpdateTimeEntryRequest };
