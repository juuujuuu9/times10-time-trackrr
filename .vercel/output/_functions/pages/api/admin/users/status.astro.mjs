import { d as db, u as users } from '../../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../../renderers.mjs';

const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return new Response(JSON.stringify({ error: "User ID and status are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!["active", "inactive"].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be "active" or "inactive"' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedUser = await db.update(users).set({
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, parseInt(id))).returning();
    if (updatedUser.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ message: `User ${status} successfully` }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return new Response(JSON.stringify({ error: "Failed to update user status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
