import { c as createComponent, a as createAstro, d as addAttribute, r as renderHead, e as renderTemplate } from '../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import 'clsx';
import { d as db, u as users, c as clients, p as projects, a as tasks, t as timeEntries } from '../chunks/index_DQhihAc3.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$TestDb = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$TestDb;
  let result = { success: false, message: "No test run" };
  try {
    const [newUser] = await db.insert(users).values({
      name: "John Doe",
      email: "john@example.com",
      role: "admin"
    }).returning();
    const [newClient] = await db.insert(clients).values({
      name: "Acme Corp",
      createdBy: newUser.id
    }).returning();
    const [newProject] = await db.insert(projects).values({
      name: "Website Redesign",
      clientId: newClient.id
    }).returning();
    const [newTask] = await db.insert(tasks).values({
      name: "Design Homepage",
      projectId: newProject.id,
      description: "Create new homepage design",
      status: "in_progress"
    }).returning();
    const [newTimeEntry] = await db.insert(timeEntries).values({
      taskId: newTask.id,
      userId: newUser.id,
      startTime: /* @__PURE__ */ new Date(),
      notes: "Started working on homepage design"
    }).returning();
    const allUsers = await db.select().from(users);
    const allClients = await db.select().from(clients);
    const allProjects = await db.select().from(projects);
    const allTasks = await db.select().from(tasks);
    const allTimeEntries = await db.select().from(timeEntries);
    result = {
      success: true,
      message: "All database operations successful!",
      data: {
        user: newUser,
        client: newClient,
        project: newProject,
        task: newTask,
        timeEntry: newTimeEntry,
        counts: {
          users: allUsers.length,
          clients: allClients.length,
          projects: allProjects.length,
          tasks: allTasks.length,
          timeEntries: allTimeEntries.length
        }
      }
    };
  } catch (error) {
    result = {
      success: false,
      message: "Database test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
  return renderTemplate`<html lang="en"> <head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="viewport" content="width=device-width"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>Database Test</title>${renderHead()}</head> <body> <div style="padding: 2rem; font-family: Arial, sans-serif;"> <h1>Database Schema Test</h1> <div style="margin: 1rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 4px;"> <h2>Test Result:</h2> <p><strong>Success:</strong> ${result.success ? "\u2705 Yes" : "\u274C No"}</p> <p><strong>Message:</strong> ${result.message}</p> ${result.error && renderTemplate`<div style="background: #fee; padding: 1rem; border-radius: 4px; margin: 1rem 0;"> <strong>Error:</strong> ${result.error} </div>`} ${result.success && result.data && renderTemplate`<div style="margin-top: 2rem;"> <h3>Created Data:</h3> <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;"> <div style="background: #f0f0f0; padding: 1rem; border-radius: 4px;"> <h4>User</h4> <pre>${JSON.stringify(result.data.user, null, 2)}</pre> </div> <div style="background: #f0f0f0; padding: 1rem; border-radius: 4px;"> <h4>Client</h4> <pre>${JSON.stringify(result.data.client, null, 2)}</pre> </div> <div style="background: #f0f0f0; padding: 1rem; border-radius: 4px;"> <h4>Project</h4> <pre>${JSON.stringify(result.data.project, null, 2)}</pre> </div> <div style="background: #f0f0f0; padding: 1rem; border-radius: 4px;"> <h4>Task</h4> <pre>${JSON.stringify(result.data.task, null, 2)}</pre> </div> <div style="background: #f0f0f0; padding: 1rem; border-radius: 4px;"> <h4>Time Entry</h4> <pre>${JSON.stringify(result.data.timeEntry, null, 2)}</pre> </div> </div> <div style="margin-top: 2rem;"> <h3>Database Counts:</h3> <ul> <li>Users: ${result.data.counts.users}</li> <li>Clients: ${result.data.counts.clients}</li> <li>Projects: ${result.data.counts.projects}</li> <li>Tasks: ${result.data.counts.tasks}</li> <li>Time Entries: ${result.data.counts.timeEntries}</li> </ul> </div> </div>`} </div> <div style="margin-top: 2rem;"> <h2>Database Schema Summary:</h2> <ul> <li><strong>users:</strong> id, email, name, role</li> <li><strong>clients:</strong> id, name, created_by</li> <li><strong>projects:</strong> id, client_id, name</li> <li><strong>tasks:</strong> id, project_id, name, description, status</li> <li><strong>task_assignments:</strong> task_id, user_id</li> <li><strong>time_entries:</strong> id, task_id, user_id, start_time, end_time, duration_manual, notes</li> </ul> </div> </div> </body></html>`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/test-db.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/test-db.astro";
const $$url = "/test-db";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$TestDb,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
