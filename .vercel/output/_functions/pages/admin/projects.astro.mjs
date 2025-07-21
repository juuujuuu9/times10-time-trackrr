import { c as createComponent, f as renderComponent, e as renderTemplate, m as maybeRenderHead, g as renderScript, d as addAttribute } from '../../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_DcFH0Yfs.mjs';
import { d as db, c as clients, p as projects, t as timeEntries, a as tasks } from '../../chunks/index_DQhihAc3.mjs';
import { count, sql, eq } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allProjects = await db.select({
    id: projects.id,
    name: projects.name,
    createdAt: projects.createdAt,
    clientId: projects.clientId,
    clientName: clients.name,
    clientArchived: clients.archived,
    taskCount: count(tasks.id),
    totalHours: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`
  }).from(projects).leftJoin(clients, sql`${projects.clientId} = ${clients.id}`).leftJoin(tasks, sql`${projects.id} = ${tasks.projectId}`).leftJoin(timeEntries, sql`${tasks.id} = ${timeEntries.taskId}`).groupBy(projects.id, clients.name, clients.archived).orderBy(clients.name, projects.name);
  const projectsByClient = allProjects.reduce((acc, project) => {
    const clientName = project.clientName || "Unknown Client";
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(project);
    return acc;
  }, {});
  const activeProjectsByClient = Object.entries(projectsByClient).reduce((acc, [clientName, clientProjects]) => {
    const firstProject = clientProjects[0];
    if (!firstProject?.clientArchived) {
      acc[clientName] = clientProjects;
    }
    return acc;
  }, {});
  const allClients = await db.select().from(clients).where(eq(clients.archived, false)).orderBy(clients.name);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Projects", "currentPage": "projects" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6"> <!-- Header --> <div class="flex justify-between items-center"> <div> <h1 class="text-2xl font-bold text-white">Projects</h1> <p class="text-gray-300">Manage projects organized by client</p> </div> <button id="createProjectBtn" class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors">
+ Add Project
</button> </div> <!-- Filters --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <div class="flex flex-col sm:flex-row gap-4"> <div class="flex-1"> <label for="search" class="block text-sm font-medium text-gray-300 mb-1">Search</label> <input type="text" id="search" placeholder="Search projects..." class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="sm:w-48"> <label for="clientFilter" class="block text-sm font-medium text-gray-300 mb-1">Filter by Client</label> <select id="clientFilter" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">All Clients</option> ${allClients.map((client) => renderTemplate`<option${addAttribute(client.name, "value")}>${client.name}</option>`)} <option value="archived">[Archived Clients]</option> </select> </div> </div> </div> <!-- Projects by Client --> <div class="space-y-6"> ${Object.entries(projectsByClient).map(([clientName, clientProjects]) => {
    const firstProject = clientProjects[0];
    const isArchived = firstProject?.clientArchived || false;
    return renderTemplate`<div class="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden"${addAttribute(isArchived, "data-archived")}> <div class="px-6 py-4 bg-gray-700 border-b border-gray-600"> <h3 class="text-lg font-medium text-white">${clientName}</h3> <p class="text-sm text-gray-300">${clientProjects.length} projects</p> </div> <div class="overflow-x-auto"> <table class="min-w-full divide-y divide-gray-700"> <thead class="bg-gray-700"> <tr> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Project Name
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Tasks
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Total Hours
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Created Date
</th> <th class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
Actions
</th> </tr> </thead> <tbody class="bg-gray-800 divide-y divide-gray-700"> ${clientProjects.map((project) => renderTemplate`<tr class="hover:bg-gray-700"> <td class="px-6 py-4 whitespace-nowrap"> <div class="text-sm font-medium text-white">${project.name}</div> </td> <td class="px-6 py-4 whitespace-nowrap"> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4F46E5] text-white"> ${project.taskCount} tasks
</span> </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${project.totalHours ? Math.round(project.totalHours * 10) / 10 : 0} hours
</td> <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300"> ${new Date(project.createdAt).toLocaleDateString()} </td> <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> <div class="flex justify-end space-x-2"> <button type="button" class="text-[#4F46E5] hover:text-[#3730A3] view-tasks-btn"${addAttribute(project.id, "data-project-id")}${addAttribute(project.name, "data-project-name")}>
View Tasks
</button> <button type="button" class="text-[#EC4899] hover:text-[#DB2777] edit-project-btn"${addAttribute(project.id, "data-project-id")}>
Edit
</button> <button type="button" class="text-red-400 hover:text-red-300 delete-project-btn"${addAttribute(project.id, "data-project-id")}>
Delete
</button> </div> </td> </tr>`)} </tbody> </table> </div> </div>`;
  })} </div> ${Object.keys(activeProjectsByClient).length === 0 && renderTemplate`<div class="text-center py-12"> <div class="text-6xl mb-4">📁</div> <h3 class="text-lg font-medium text-white mb-2">No projects yet</h3> <p class="text-gray-300 mb-4">Get started by adding your first project</p> <button class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors" onclick="document.getElementById('createProjectBtn').click()">
Add Your First Project
</button> </div>`} </div>  <div id="projectModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-md w-full border border-gray-700" onclick="event.stopPropagation()"> <div class="px-6 py-4 border-b border-gray-700"> <h3 id="projectModalTitle" class="text-lg font-medium text-white">Add New Project</h3> </div> <form id="projectForm" class="p-6"> <input type="hidden" id="projectId"> <div class="mb-4"> <label for="projectName" class="block text-sm font-medium text-gray-300 mb-1">
Project Name
</label> <input type="text" id="projectName" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="mb-4"> <label for="projectClient" class="block text-sm font-medium text-gray-300 mb-1">
Client
</label> <div class="flex space-x-2"> <select id="projectClient" required class="flex-1 px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">Select a client</option> ${allClients.map((client) => renderTemplate`<option${addAttribute(client.id, "value")}>${client.name}</option>`)} </select> <button type="button" id="createClientBtn" class="px-3 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-md transition-colors text-sm font-medium">
+ New
</button> </div> </div> <div class="flex justify-end space-x-3"> <button type="button" id="cancelProjectBtn" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-md transition-colors">
Save Project
</button> </div> </form> </div> </div> </div>  <div id="clientModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-md w-full border border-gray-700" onclick="event.stopPropagation()"> <div class="px-6 py-4 border-b border-gray-700"> <h3 class="text-lg font-medium text-white">Create New Client</h3> </div> <form id="clientForm" class="p-6"> <div class="mb-4"> <label for="clientName" class="block text-sm font-medium text-gray-300 mb-1">
Client Name
</label> <input type="text" id="clientName" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white" placeholder="Enter client name"> </div> <div class="flex justify-end space-x-3"> <button type="button" id="cancelClientBtn" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-md transition-colors">
Create Client
</button> </div> </form> </div> </div> </div>  <div id="tasksModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-4xl w-full border border-gray-700" onclick="event.stopPropagation()"> <div class="px-6 py-4 border-b border-gray-700 flex justify-between items-center"> <h3 id="tasksModalTitle" class="text-lg font-medium text-white">Project Tasks</h3> <button type="button" id="closeTasksModalBtn" class="text-gray-400 hover:text-white"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path> </svg> </button> </div> <div class="p-6"> <!-- Tasks List --> <div class="mb-6"> <div class="flex justify-between items-center mb-4"> <h4 class="text-md font-medium text-white">Tasks</h4> <button type="button" id="addTaskBtn" class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors">
+ Add Task
</button> </div> <div id="tasksList" class="space-y-3"> <!-- Tasks will be loaded here --> </div> </div> </div> </div> </div> </div>  <div id="addTaskModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-md w-full border border-gray-700" onclick="event.stopPropagation()"> <div class="px-6 py-4 border-b border-gray-700"> <h3 class="text-lg font-medium text-white">Add New Task</h3> </div> <form id="addTaskForm" class="p-6"> <input type="hidden" id="taskProjectId"> <div class="mb-4"> <label for="taskName" class="block text-sm font-medium text-gray-300 mb-1">
Task Name
</label> <input type="text" id="taskName" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white" placeholder="Enter task name"> </div> <div class="mb-4"> <label for="taskDescription" class="block text-sm font-medium text-gray-300 mb-1">
Description
</label> <textarea id="taskDescription" rows="3" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white" placeholder="Enter task description"></textarea> </div> <div class="mb-4"> <label for="taskStatus" class="block text-sm font-medium text-gray-300 mb-1">
Status
</label> <select id="taskStatus" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="pending">Pending</option> <option value="in-progress">In Progress</option> <option value="completed">Completed</option> <option value="cancelled">Cancelled</option> </select> </div> <div class="mb-4"> <label class="block text-sm font-medium text-gray-300 mb-1">
Assign Users
</label> <div id="userAssignments" class="space-y-2 max-h-32 overflow-y-auto"> <!-- Users will be loaded here --> </div> </div> <div class="flex justify-end space-x-3"> <button type="button" id="cancelAddTaskBtn" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-md transition-colors">
Create Task
</button> </div> </form> </div> </div> </div> ${renderScript($$result2, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/projects/index.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/projects/index.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/admin/projects/index.astro";
const $$url = "/admin/projects";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
