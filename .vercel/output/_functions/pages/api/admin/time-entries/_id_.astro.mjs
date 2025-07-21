import { d as db, t as timeEntries } from '../../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const DELETE = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Time entry ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const deletedTimeEntry = await db.delete(timeEntries).where(eq(timeEntries.id, parseInt(id))).returning();
    if (deletedTimeEntry.length === 0) {
      return new Response(JSON.stringify({ error: "Time entry not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ message: "Time entry deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return new Response(JSON.stringify({ error: "Failed to delete time entry" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
