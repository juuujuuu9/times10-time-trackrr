import { d as db, u as users, b as taskAssignments } from '../../../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../../../renderers.mjs';

const GET = async ({ params }) => {
  try {
    const taskId = params.id;
    if (!taskId) {
      return new Response(JSON.stringify({ error: "Task ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const assignments = await db.select({
      taskId: taskAssignments.taskId,
      userId: taskAssignments.userId,
      userName: users.name,
      userEmail: users.email
    }).from(taskAssignments).leftJoin(users, eq(taskAssignments.userId, users.id)).where(eq(taskAssignments.taskId, parseInt(taskId)));
    return new Response(JSON.stringify(assignments), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching task assignments:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch task assignments" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
