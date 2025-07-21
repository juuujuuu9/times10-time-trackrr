import { d as db, t as timeEntries } from '../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  try {
    const allTimeEntries = await db.select().from(timeEntries);
    return new Response(JSON.stringify(allTimeEntries), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch time entries" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, taskId, startTime, endTime, notes } = body;
    if (!userId || !taskId || !startTime) {
      return new Response(JSON.stringify({ error: "User ID, task ID, and start time are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const newTimeEntry = await db.insert(timeEntries).values({
      userId: parseInt(userId),
      taskId: parseInt(taskId),
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      notes: notes || null
    }).returning();
    return new Response(JSON.stringify(newTimeEntry[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return new Response(JSON.stringify({ error: "Failed to create time entry" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, userId, taskId, startTime, endTime, notes } = body;
    if (!id || !userId || !taskId || !startTime) {
      return new Response(JSON.stringify({ error: "ID, user ID, task ID, and start time are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedTimeEntry = await db.update(timeEntries).set({
      userId: parseInt(userId),
      taskId: parseInt(taskId),
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      notes: notes || null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(timeEntries.id, parseInt(id))).returning();
    if (updatedTimeEntry.length === 0) {
      return new Response(JSON.stringify({ error: "Time entry not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(updatedTimeEntry[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return new Response(JSON.stringify({ error: "Failed to update time entry" }), {
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
