import { d as db, b as taskAssignments } from '../../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { taskId, userIds } = body;
    if (!taskId || !userIds || !Array.isArray(userIds)) {
      return new Response(JSON.stringify({ error: "Task ID and user IDs array are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await db.delete(taskAssignments).where(eq(taskAssignments.taskId, parseInt(taskId)));
    if (userIds.length > 0) {
      const assignments = userIds.map((userId) => ({
        taskId: parseInt(taskId),
        userId: parseInt(userId)
      }));
      await db.insert(taskAssignments).values(assignments);
    }
    return new Response(JSON.stringify({ message: "Task assignments updated successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating task assignments:", error);
    return new Response(JSON.stringify({ error: "Failed to update task assignments" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
