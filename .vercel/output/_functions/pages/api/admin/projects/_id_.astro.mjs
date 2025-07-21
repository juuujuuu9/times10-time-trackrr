import { d as db, p as projects, a as tasks, t as timeEntries, b as taskAssignments } from '../../../../chunks/index_DQhihAc3.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;
const GET = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const projectId = parseInt(id);
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (project.length === 0) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(project[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch project" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const projectId = parseInt(id);
    const projectTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.projectId, projectId));
    const taskIds = projectTasks.map((task) => task.id);
    if (taskIds.length > 0) {
      for (const taskId of taskIds) {
        await db.delete(timeEntries).where(eq(timeEntries.taskId, taskId));
      }
      for (const taskId of taskIds) {
        await db.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId));
      }
      await db.delete(tasks).where(eq(tasks.projectId, projectId));
    }
    const deletedProject = await db.delete(projects).where(eq(projects.id, projectId)).returning();
    if (deletedProject.length === 0) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ message: "Project deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return new Response(JSON.stringify({ error: "Failed to delete project" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
