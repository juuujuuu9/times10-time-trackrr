import { d as db, c as clients } from '../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  try {
    const allClients = await db.select().from(clients);
    return new Response(JSON.stringify(allClients), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch clients" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { name } = body;
    if (!name) {
      return new Response(JSON.stringify({ error: "Client name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const newClient = await db.insert(clients).values({
      name,
      createdBy: 1
    }).returning();
    return new Response(JSON.stringify(newClient[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return new Response(JSON.stringify({ error: "Failed to create client" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name } = body;
    if (!id || !name) {
      return new Response(JSON.stringify({ error: "Client ID and name are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedClient = await db.update(clients).set({ name, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clients.id, id)).returning();
    if (updatedClient.length === 0) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(updatedClient[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return new Response(JSON.stringify({ error: "Failed to update client" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PATCH = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, archived } = body;
    if (id === void 0 || archived === void 0) {
      return new Response(JSON.stringify({ error: "Client ID and archived status are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedClient = await db.update(clients).set({ archived, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clients.id, id)).returning();
    if (updatedClient.length === 0) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(updatedClient[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error archiving/unarchiving client:", error);
    return new Response(JSON.stringify({ error: "Failed to update client archive status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  PATCH,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
