import { d as db, u as users } from '../../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../../renderers.mjs';

const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, role } = body;
    if (!id || !role) {
      return new Response(JSON.stringify({ error: "User ID and role are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!["admin", "user"].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role. Must be "admin" or "user"' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedUser = await db.update(users).set({
      role,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, parseInt(id))).returning();
    if (updatedUser.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(updatedUser[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return new Response(JSON.stringify({ error: "Failed to update user role" }), {
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
