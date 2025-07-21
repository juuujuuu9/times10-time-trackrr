import { d as db, u as users, t as timeEntries, a as tasks, b as taskAssignments } from '../../../../../chunks/index_DQhihAc3.mjs';
import { sql, eq } from 'drizzle-orm';
export { renderers } from '../../../../../renderers.mjs';

const GET = async ({ params }) => {
  try {
    const projectId = params.id;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const projectTasks = await db.select({
      id: tasks.id,
      name: tasks.name,
      description: tasks.description,
      status: tasks.status,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      totalHours: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`,
      assignedUsers: sql`STRING_AGG(DISTINCT ${users.name}, ', ')`,
      assignedUserIds: sql`STRING_AGG(DISTINCT ${users.id}::text, ', ')`
    }).from(tasks).leftJoin(taskAssignments, eq(tasks.id, taskAssignments.taskId)).leftJoin(users, eq(taskAssignments.userId, users.id)).leftJoin(timeEntries, eq(tasks.id, timeEntries.taskId)).where(eq(tasks.projectId, parseInt(projectId))).groupBy(tasks.id).orderBy(tasks.createdAt);
    return new Response(JSON.stringify(projectTasks), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch project tasks" }), {
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
