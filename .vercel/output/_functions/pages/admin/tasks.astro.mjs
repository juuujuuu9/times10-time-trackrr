import { c as createComponent, f as renderComponent, e as renderTemplate, m as maybeRenderHead, g as renderScript, d as addAttribute } from '../../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_DcFH0Yfs.mjs';
import { d as db, c as clients, p as projects, a as tasks, t as timeEntries, u as users, b as taskAssignments } from '../../chunks/index_DQhihAc3.mjs';
import { sql } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allTasks = await db.select({
    id: tasks.id,
    name: tasks.name,
    description: tasks.description,
    status: tasks.status,
    createdAt: tasks.createdAt,
    projectId: tasks.projectId,
    projectName: projects.name,
    clientName: clients.name,
    assignedUsers: sql`STRING_AGG(${users.name}, ', ')`,
    timeLogged: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`
  }).from(tasks).leftJoin(projects, sql`${tasks.projectId} = ${projects.id}`).leftJoin(clients, sql`${projects.clientId} = ${clients.id}`).leftJoin(taskAssignments, sql`${tasks.id} = ${taskAssignments.taskId}`).leftJoin(users, sql`${taskAssignments.userId} = ${users.id}`).leftJoin(timeEntries, sql`${tasks.id} = ${timeEntries.taskId}`).groupBy(tasks.id, projects.name, clients.name).orderBy(clients.name, projects.name, tasks.name);
  const tasksByProject = allTasks.reduce((acc, task) => {
    const projectKey = `${task.clientName} - ${task.projectName}`;
    if (!acc[projectKey]) {
      acc[projectKey] = [];
    }
    acc[projectKey].push(task);
    return acc;
  }, {});
  const allProjects = await db.select({
    id: projects.id,
    name: projects.name,
    clientName: clients.name
  }).from(projects).leftJoin(clients, sql`${projects.clientId} = ${clients.id}`).orderBy(clients.name, projects.name);
  const allUsers = await db.select().from(users).orderBy(users.name);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Tasks", "currentPage": "tasks" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6"> <!-- Header --> <div class="flex justify-between items-center"> <div> <h1 class="text-2xl font-bold text-white">Tasks</h1> <p class="text-gray-300">Manage tasks organized by project</p> </div> <button id="createTaskBtn" class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors">
+ Add Task
</button> </div> <!-- Filters --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <div class="flex flex-col sm:flex-row gap-4"> <div class="flex-1"> <label for="search" class="block text-sm font-medium text-gray-300 mb-1">Search</label> <input type="text" id="search" placeholder="Search tasks..." class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="sm:w-48"> <label for="statusFilter" class="block text-sm font-medium text-gray-300 mb-1">Status</label> <select id="statusFilter" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">All Statuses</option> <option value="pending">Pending</option> <option value="in-progress">In Progress</option> <option value="completed">Completed</option> <option value="archived">Archived</option> </select> </div> <div class="sm:w-48"> <label for="userFilter" class="block text-sm font-medium text-gray-300 mb-1">Assigned User</label> <select id="userFilter" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">All Users</option> ${allUsers.map((user) => renderTemplate`<option${addAttribute(user.name, "value")}>${user.name}</option>`)} </select> </div> </div> </div> <!-- Tasks by Project --> <div class="space-y-6"> ${Object.entries(tasksByProject).map(([projectKey, projectTasks]) => renderTemplate`<div class="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden"> <div class="px-6 py-4 bg-gray-700 border-b border-gray-600"> <h3 class="text-lg font-medium text-white">${projectKey}</h3> <p class="text-sm text-gray-300">${projectTasks.length} tasks</p> </div> <div class="overflow-x-auto"> <table class="min-w-full divide-y divide-gray-700"> <thead class="bg-gray-700"> <tr> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Task Name
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Status
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Assigned Users
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Time Logged
</th> <th class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
Actions
</th> </tr> </thead> <tbody class="bg-gray-800 divide-y divide-gray-700"> ${projectTasks.map((task) => renderTemplate`<tr class="hover:bg-gray-700"> <td class="px-6 py-4 whitespace-nowrap"> <div class="text-sm font-medium text-white">${task.name}</div> ${task.description && renderTemplate`<div class="text-sm text-gray-400 truncate max-w-xs">${task.description}</div>`} </td> <td class="px-6 py-4 whitespace-nowrap"> <span${addAttribute(`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === "completed" ? "bg-[#10B981] text-white" : task.status === "in-progress" ? "bg-[#F59E0B] text-white" : task.status === "archived" ? "bg-gray-600 text-gray-300" : "bg-[#4F46E5] text-white"}`, "class")}> ${task.status} </span> </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${task.assignedUsers || "Unassigned"} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${task.timeLogged ? Math.round(task.timeLogged * 10) / 10 : 0} hours
</td> <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> <div class="flex justify-end space-x-2"> <button class="text-[#4F46E5] hover:text-[#3730A3]"${addAttribute(`assignUsers(${task.id})`, "onclick")}>
Assign
</button> <button class="text-[#EC4899] hover:text-[#DB2777]"${addAttribute(`editTask(${task.id})`, "onclick")}>
Edit
</button> <button class="text-red-400 hover:text-red-300"${addAttribute(`deleteTask(${task.id})`, "onclick")}>
Delete
</button> </div> </td> </tr>`)} </tbody> </table> </div> </div>`)} </div> ${Object.keys(tasksByProject).length === 0 && renderTemplate`<div class="text-center py-12"> <div class="text-6xl mb-4">✅</div> <h3 class="text-lg font-medium text-white mb-2">No tasks yet</h3> <p class="text-gray-300 mb-4">Get started by adding your first task</p> <button class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors" onclick="document.getElementById('createTaskBtn').click()">
Add Your First Task
</button> </div>`} </div>  <div id="taskModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-md w-full border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 id="taskModalTitle" class="text-lg font-medium text-white">Add New Task</h3> </div> <form id="taskForm" class="p-6"> <input type="hidden" id="taskId"> <div class="mb-4"> <label for="taskName" class="block text-sm font-medium text-gray-300 mb-1">
Task Name
</label> <input type="text" id="taskName" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="mb-4"> <label for="taskDescription" class="block text-sm font-medium text-gray-300 mb-1">
Description
</label> <textarea id="taskDescription" rows="3" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"></textarea> </div> <div class="mb-4"> <label for="taskProject" class="block text-sm font-medium text-gray-300 mb-1">
Project
</label> <select id="taskProject" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">Select a project</option> ${allProjects.map((project) => renderTemplate`<option${addAttribute(project.id, "value")}>${project.clientName} - ${project.name}</option>`)} </select> </div> <div class="mb-4"> <label for="taskStatus" class="block text-sm font-medium text-gray-300 mb-1">
Status
</label> <select id="taskStatus" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="pending">Pending</option> <option value="in-progress">In Progress</option> <option value="completed">Completed</option> <option value="archived">Archived</option> </select> </div> <div class="flex justify-end space-x-3"> <button type="button" onclick="closeTaskModal()" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-md transition-colors">
Save Task
</button> </div> </form> </div> </div> </div>  <div id="assignmentModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-md w-full border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 class="text-lg font-medium text-white">Assign Users to Task</h3> </div> <div class="p-6"> <input type="hidden" id="assignmentTaskId"> <div class="mb-4"> <label class="block text-sm font-medium text-gray-300 mb-2">Select Users</label> <div class="space-y-2 max-h-48 overflow-y-auto"> ${allUsers.map((user) => renderTemplate`<label class="flex items-center"> <input type="checkbox"${addAttribute(user.id, "value")} class="rounded border-gray-500 text-[#4F46E5] focus:ring-[#4F46E5] bg-gray-700"> <span class="ml-2 text-sm text-white">${user.name}</span> </label>`)} </div> </div> <div class="flex justify-end space-x-3"> <button type="button" onclick="closeAssignmentModal()" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
Cancel
</button> <button onclick="saveAssignments()" class="px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-md transition-colors">
Save Assignments
</button> </div> </div> </div> </div> </div> ${renderScript($$result2, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/tasks/index.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/tasks/index.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/admin/tasks/index.astro";
const $$url = "/admin/tasks";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
