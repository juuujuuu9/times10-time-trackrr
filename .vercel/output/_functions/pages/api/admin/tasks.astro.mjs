import { d as db, a as tasks } from '../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  try {
    const allTasks = await db.select().from(tasks);
    return new Response(JSON.stringify(allTasks), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch tasks" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, description, projectId, status } = body;
    if (!name || !projectId) {
      return new Response(JSON.stringify({ error: "Task name and project ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const newTask = await db.insert(tasks).values({
      name,
      description: description || null,
      projectId: parseInt(projectId),
      status: status || "pending"
    }).returning();
    return new Response(JSON.stringify(newTask[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return new Response(JSON.stringify({ error: "Failed to create task" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, description, projectId, status } = body;
    if (!id || !name || !projectId) {
      return new Response(JSON.stringify({ error: "Task ID, name, and project ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedTask = await db.update(tasks).set({
      name,
      description: description || null,
      projectId: parseInt(projectId),
      status: status || "pending",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(tasks.id, parseInt(id))).returning();
    if (updatedTask.length === 0) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(updatedTask[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return new Response(JSON.stringify({ error: "Failed to update task" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
