import { d as db, c as clients, p as projects } from '../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  try {
    const allProjects = await db.select({
      id: projects.id,
      name: projects.name,
      clientId: projects.clientId,
      archived: projects.archived,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientArchived: clients.archived
    }).from(projects).leftJoin(clients, eq(projects.clientId, clients.id)).where(eq(clients.archived, false));
    const cleanProjects = allProjects.map((project) => ({
      id: project.id,
      name: project.name,
      clientId: project.clientId,
      archived: project.archived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
    return new Response(JSON.stringify(cleanProjects), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch projects" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, clientId } = body;
    if (!name || !clientId) {
      return new Response(JSON.stringify({ error: "Project name and client ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const newProject = await db.insert(projects).values({
      name,
      clientId: parseInt(clientId)
    }).returning();
    return new Response(JSON.stringify(newProject[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return new Response(JSON.stringify({ error: "Failed to create project" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PUT = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, clientId } = body;
    if (!id || !name || !clientId) {
      return new Response(JSON.stringify({ error: "Project ID, name, and client ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedProject = await db.update(projects).set({
      name,
      clientId: parseInt(clientId),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projects.id, parseInt(id))).returning();
    if (updatedProject.length === 0) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(updatedProject[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return new Response(JSON.stringify({ error: "Failed to update project" }), {
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
      return new Response(JSON.stringify({ error: "Project ID and archived status are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedProject = await db.update(projects).set({ archived, updatedAt: /* @__PURE__ */ new Date() }).where(eq(projects.id, id)).returning();
    if (updatedProject.length === 0) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(updatedProject[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error archiving/unarchiving project:", error);
    return new Response(JSON.stringify({ error: "Failed to update project archive status" }), {
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
