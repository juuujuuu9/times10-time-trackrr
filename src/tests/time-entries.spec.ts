/**
 * IMPORTANT: This file MUST call the API only via src/lib/api/client.ts.
 * Changing endpoints, paths, or schemas is forbidden. If impossible, add a
 * TODO(api-extension) and stop. See /cursor-guides/extension-proposal.md.
 */

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TimeEntriesList } from "../components/TimeEntriesList";

// Mock data
const mockTimeEntries = [
  {
    id: 1,
    userId: 1,
    taskId: 1,
    startTime: "2024-01-01T09:00:00Z",
    endTime: "2024-01-01T17:00:00Z",
    durationManual: null,
    notes: "Working on project",
    createdAt: "2024-01-01T09:00:00Z",
    updatedAt: "2024-01-01T17:00:00Z",
    userName: "John Doe",
    taskName: "General",
    projectName: "Project Alpha",
    clientName: "Client A",
    duration: 28800, // 8 hours
  },
  {
    id: 2,
    userId: 1,
    taskId: 2,
    startTime: "2024-01-02T09:00:00Z",
    endTime: "2024-01-02T12:00:00Z",
    durationManual: null,
    notes: "Meeting with client",
    createdAt: "2024-01-02T09:00:00Z",
    updatedAt: "2024-01-02T12:00:00Z",
    userName: "John Doe",
    taskName: "General",
    projectName: "Project Beta",
    clientName: "Client B",
    duration: 10800, // 3 hours
  },
];

// MSW server setup
const server = setupServer(
  // List time entries
  http.get("/api/time-entries-unified", ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const limit = url.searchParams.get("limit");
    
    console.log("List time entries request:", { userId, limit });
    
    return HttpResponse.json({
      success: true,
      data: mockTimeEntries,
    });
  }),

  // Create time entry
  http.post("/api/time-entries-unified", async ({ request }) => {
    const body = await request.json();
    console.log("Create time entry request:", body);
    
    const newEntry = {
      id: 3,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userName: "John Doe",
      taskName: "General",
      projectName: "Project Gamma",
      clientName: "Client C",
      duration: 7200, // 2 hours
    };
    
    return HttpResponse.json({
      success: true,
      data: newEntry,
    });
  }),

  // Update time entry
  http.patch("/api/time-entries-unified/:id", async ({ request, params }) => {
    const body = await request.json();
    const id = params.id;
    console.log("Update time entry request:", { id, body });
    
    const updatedEntry = {
      id: parseInt(id as string),
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: updatedEntry,
    });
  }),

  // Delete time entry
  http.delete("/api/time-entries-unified/:id", ({ params }) => {
    const id = params.id;
    console.log("Delete time entry request:", { id });
    
    return HttpResponse.json({
      success: true,
      message: "Time entry deleted successfully",
    });
  })
);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("TimeEntriesList", () => {
  test("renders time entries list", async () => {
    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      expect(screen.getByText("Project Beta")).toBeInTheDocument();
    });
  });

  test("handles empty time entries list", async () => {
    server.use(
      http.get("/api/time-entries-unified", () => {
        return HttpResponse.json({
          success: true,
          data: [],
        });
      })
    );

    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no time entries/i)).toBeInTheDocument();
    });
  });

  test("handles create time entry success", async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    const createButton = screen.getByRole("button", { name: /create/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/time entry created/i)).toBeInTheDocument();
    });
  });

  test("handles update time entry success", async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/time entry updated/i)).toBeInTheDocument();
    });
  });

  test("handles delete time entry success", async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/time entry deleted/i)).toBeInTheDocument();
    });
  });

  test("handles network error gracefully", async () => {
    server.use(
      http.get("/api/time-entries-unified", () => {
        return HttpResponse.error();
      })
    );

    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading/i)).toBeInTheDocument();
    });
  });

  test("handles 400 validation error", async () => {
    server.use(
      http.post("/api/time-entries-unified", () => {
        return HttpResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    const createButton = screen.getByRole("button", { name: /create/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/missing required fields/i)).toBeInTheDocument();
    });
  });

  test("handles 401 unauthorized error", async () => {
    server.use(
      http.get("/api/time-entries-unified", () => {
        return HttpResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      })
    );

    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    });
  });

  test("handles 500 server error", async () => {
    server.use(
      http.get("/api/time-entries-unified", () => {
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      })
    );

    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  test("prevents duplicate mutations on rapid clicks", async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    
    server.use(
      http.post("/api/time-entries-unified", () => {
        requestCount++;
        return HttpResponse.json({
          success: true,
          data: { id: 3, ...mockTimeEntries[0] },
        });
      })
    );
    
    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    const createButton = screen.getByRole("button", { name: /create/i });
    
    // Click multiple times rapidly
    await user.click(createButton);
    await user.click(createButton);
    await user.click(createButton);

    // Should only make one request
    expect(requestCount).toBe(1);
  });

  test("shows loading state during mutations", async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TimeEntriesList />
      </TestWrapper>
    );

    const createButton = screen.getByRole("button", { name: /create/i });
    await user.click(createButton);

    // Should show loading state
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
  });
});
