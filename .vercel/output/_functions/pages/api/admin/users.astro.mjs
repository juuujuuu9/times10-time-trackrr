import { d as db, u as users } from '../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  try {
    const allUsers = await db.select().from(users);
    return new Response(JSON.stringify(allUsers), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, role } = body;
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return new Response(JSON.stringify({ error: "User with this email already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }
    const newUser = await db.insert(users).values({
      name,
      email,
      role: role || "user"
    }).returning();
    return new Response(JSON.stringify(newUser[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ error: "Failed to create user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, email } = body;
    if (!id || !name || !email) {
      return new Response(JSON.stringify({ error: "ID, name, and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedUser = await db.update(users).set({
      name,
      email,
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
    console.error("Error updating user:", error);
    return new Response(JSON.stringify({ error: "Failed to update user" }), {
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
