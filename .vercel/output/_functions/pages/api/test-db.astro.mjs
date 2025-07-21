import { d as db, u as users, c as clients, p as projects, a as tasks, t as timeEntries } from '../../chunks/index_DQhihAc3.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  try {
    const allUsers = await db.select().from(users);
    const allClients = await db.select().from(clients);
    const allProjects = await db.select().from(projects);
    const allTasks = await db.select().from(tasks);
    const allTimeEntries = await db.select().from(timeEntries);
    return new Response(JSON.stringify({
      success: true,
      message: "Database connection successful!",
      counts: {
        users: allUsers.length,
        clients: allClients.length,
        projects: allProjects.length,
        tasks: allTasks.length,
        timeEntries: allTimeEntries.length
      },
      data: {
        users: allUsers,
        clients: allClients,
        projects: allProjects,
        tasks: allTasks,
        timeEntries: allTimeEntries
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, data } = body;
    switch (action) {
      case "create_user":
        if (!data.name || !data.email) {
          return new Response(JSON.stringify({
            success: false,
            message: "Name and email are required for user creation"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const [newUser] = await db.insert(users).values({
          name: data.name,
          email: data.email,
          role: data.role || "user"
        }).returning();
        return new Response(JSON.stringify({
          success: true,
          message: "User created successfully!",
          user: newUser
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      case "create_client":
        if (!data.name || !data.createdBy) {
          return new Response(JSON.stringify({
            success: false,
            message: "Name and createdBy are required for client creation"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const [newClient] = await db.insert(clients).values({
          name: data.name,
          createdBy: data.createdBy
        }).returning();
        return new Response(JSON.stringify({
          success: true,
          message: "Client created successfully!",
          client: newClient
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      case "create_project":
        if (!data.name || !data.clientId) {
          return new Response(JSON.stringify({
            success: false,
            message: "Name and clientId are required for project creation"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const [newProject] = await db.insert(projects).values({
          name: data.name,
          clientId: data.clientId
        }).returning();
        return new Response(JSON.stringify({
          success: true,
          message: "Project created successfully!",
          project: newProject
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      case "create_task":
        if (!data.name || !data.projectId) {
          return new Response(JSON.stringify({
            success: false,
            message: "Name and projectId are required for task creation"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const [newTask] = await db.insert(tasks).values({
          name: data.name,
          projectId: data.projectId,
          description: data.description,
          status: data.status || "pending"
        }).returning();
        return new Response(JSON.stringify({
          success: true,
          message: "Task created successfully!",
          task: newTask
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      case "create_time_entry":
        if (!data.taskId || !data.userId || !data.startTime) {
          return new Response(JSON.stringify({
            success: false,
            message: "taskId, userId, and startTime are required for time entry creation"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const [newTimeEntry] = await db.insert(timeEntries).values({
          taskId: data.taskId,
          userId: data.userId,
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : null,
          durationManual: data.durationManual,
          notes: data.notes
        }).returning();
        return new Response(JSON.stringify({
          success: true,
          message: "Time entry created successfully!",
          timeEntry: newTimeEntry
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      default:
        return new Response(JSON.stringify({
          success: false,
          message: "Invalid action. Supported actions: create_user, create_client, create_project, create_task, create_time_entry"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
  } catch (error) {
    console.error("Error in POST request:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Request failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
