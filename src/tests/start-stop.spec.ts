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
import { StartStopButton } from "../components/StartStopButton";

// Mock data
const mockTimer = {
  id: 1,
  userId: 1,
  taskId: 1,
  startTime: new Date().toISOString(),
  notes: null,
  createdAt: new Date().toISOString(),
};

const mockTimeEntry = {
  id: 1,
  userId: 1,
  taskId: 1,
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  durationManual: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// MSW server setup
const server = setupServer(
  // Start timer endpoint
  http.post("/api/timers/ongoing", async ({ request }) => {
    const body = await request.json();
    console.log("Start timer request:", body);
    
    return HttpResponse.json({
      success: true,
      data: mockTimer,
    });
  }),

  // Stop timer endpoint
  http.post("/api/timers/ongoing/stop", async ({ request }) => {
    const body = await request.json();
    console.log("Stop timer request:", body);
    
    return HttpResponse.json({
      success: true,
      data: mockTimeEntry,
    });
  }),

  // Get ongoing timer endpoint
  http.get("/api/timers/user-ongoing", () => {
    return HttpResponse.json({
      success: true,
      data: mockTimer,
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

describe("StartStopButton", () => {
  test("renders start button when no timer is active", () => {
    render(
      <TestWrapper>
        <StartStopButton />
      </TestWrapper>
    );

    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  test("renders stop button when timer is active", () => {
    render(
      <TestWrapper>
        <StartStopButton entry={mockTimer} />
      </TestWrapper>
    );

    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  test("prevents double submit on rapid clicks", async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <StartStopButton />
      </TestWrapper>
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    
    // Click multiple times rapidly
    await user.click(startButton);
    await user.click(startButton);
    await user.click(startButton);

    // Button should be disabled after first click
    expect(startButton).toBeDisabled();
  });

  test("handles start timer success", async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <StartStopButton />
      </TestWrapper>
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(startButton).toBeDisabled();
    });

    // Should show loading state
    expect(screen.getByText(/starting/i)).toBeInTheDocument();
  });

  test("handles stop timer success", async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <StartStopButton entry={mockTimer} />
      </TestWrapper>
    );

    const stopButton = screen.getByRole("button", { name: /stop/i });
    await user.click(stopButton);

    await waitFor(() => {
      expect(stopButton).toBeDisabled();
    });

    // Should show loading state
    expect(screen.getByText(/stopping/i)).toBeInTheDocument();
  });

  test("handles network error gracefully", async () => {
    // Override default handler for this test
    server.use(
      http.post("/api/timers/ongoing", () => {
        return HttpResponse.error();
      })
    );

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <StartStopButton />
      </TestWrapper>
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    // Button should be re-enabled after error
    expect(startButton).not.toBeDisabled();
  });

  test("handles 400 error with validation message", async () => {
    server.use(
      http.post("/api/timers/ongoing", () => {
        return HttpResponse.json(
          { error: "Task not found" },
          { status: 400 }
        );
      })
    );

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <StartStopButton />
      </TestWrapper>
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/task not found/i)).toBeInTheDocument();
    });
  });

  test("handles 401 unauthorized error", async () => {
    server.use(
      http.post("/api/timers/ongoing", () => {
        return HttpResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      })
    );

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <StartStopButton />
      </TestWrapper>
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    });
  });

  test("handles 500 server error", async () => {
    server.use(
      http.post("/api/timers/ongoing", () => {
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      })
    );

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <StartStopButton />
      </TestWrapper>
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  test("handles network timeout", async () => {
    server.use(
      http.post("/api/timers/ongoing", () => {
        return new Promise(() => {}); // Never resolves
      })
    );

    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <StartStopButton />
      </TestWrapper>
    );

    const startButton = screen.getByRole("button", { name: /start/i });
    await user.click(startButton);

    // Should show loading state during timeout
    expect(screen.getByText(/starting/i)).toBeInTheDocument();
  });
});
