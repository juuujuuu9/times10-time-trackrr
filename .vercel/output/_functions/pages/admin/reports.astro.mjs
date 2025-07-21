import { c as createComponent, f as renderComponent, e as renderTemplate, m as maybeRenderHead, g as renderScript, d as addAttribute } from '../../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_6J3_7iip.mjs';
import { d as db, t as timeEntries, u as users, p as projects, a as tasks, c as clients } from '../../chunks/index_DQhihAc3.mjs';
import { sql, count } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const totalHours = await db.select({
    total: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`
  }).from(timeEntries).where(sql`${timeEntries.endTime} IS NOT NULL`);
  const totalUsers = await db.select({ count: count() }).from(users);
  const totalProjects = await db.select({ count: count() }).from(projects);
  const totalTasks = await db.select({ count: count() }).from(tasks);
  const hoursByUser = await db.select({
    userName: users.name,
    totalHours: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`
  }).from(users).leftJoin(timeEntries, sql`${users.id} = ${timeEntries.userId}`).where(sql`${timeEntries.endTime} IS NOT NULL`).groupBy(users.id, users.name).orderBy(sql`totalHours DESC`);
  const hoursByProject = await db.select({
    projectName: projects.name,
    clientName: clients.name,
    totalHours: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`
  }).from(projects).leftJoin(clients, sql`${projects.clientId} = ${clients.id}`).leftJoin(tasks, sql`${projects.id} = ${tasks.projectId}`).leftJoin(timeEntries, sql`${tasks.id} = ${timeEntries.taskId}`).where(sql`${timeEntries.endTime} IS NOT NULL`).groupBy(projects.id, projects.name, clients.name).orderBy(sql`totalHours DESC`);
  const hoursByTask = await db.select({
    taskName: tasks.name,
    projectName: projects.name,
    clientName: clients.name,
    totalHours: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`
  }).from(tasks).leftJoin(projects, sql`${tasks.projectId} = ${projects.id}`).leftJoin(clients, sql`${projects.clientId} = ${clients.id}`).leftJoin(timeEntries, sql`${tasks.id} = ${timeEntries.taskId}`).where(sql`${timeEntries.endTime} IS NOT NULL`).groupBy(tasks.id, tasks.name, projects.name, clients.name).orderBy(sql`totalHours DESC`);
  const recentEntries = await db.select({
    date: sql`DATE(${timeEntries.startTime})`,
    hours: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`
  }).from(timeEntries).where(sql`${timeEntries.endTime} IS NOT NULL AND ${timeEntries.startTime} >= NOW() - INTERVAL '30 days'`).groupBy(sql`DATE(${timeEntries.startTime})`).orderBy(sql`DATE(${timeEntries.startTime})`);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Reports", "currentPage": "reports" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6"> <!-- Header --> <div class="flex justify-between items-center"> <div> <h1 class="text-2xl font-bold text-white">Reports & Analytics</h1> <p class="text-gray-300">Comprehensive insights into your time tracking data</p> </div> <div class="flex space-x-3"> <button id="exportPdfBtn" class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
Export PDF
</button> <button id="exportCsvBtn" class="bg-[#10B981] hover:bg-[#059669] text-white font-medium py-2 px-4 rounded-lg transition-colors">
Export CSV
</button> </div> </div> <!-- Overview Stats --> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <div class="flex items-center"> <div class="p-2 bg-[#4F46E5] rounded-lg"> <span class="text-2xl text-white">⏱️</span> </div> <div class="ml-4"> <p class="text-sm font-medium text-gray-400">Total Hours</p> <p class="text-2xl font-bold text-white"> ${totalHours[0]?.total ? Math.round(totalHours[0].total * 10) / 10 : 0} </p> </div> </div> </div> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <div class="flex items-center"> <div class="p-2 bg-[#10B981] rounded-lg"> <span class="text-2xl text-white">👤</span> </div> <div class="ml-4"> <p class="text-sm font-medium text-gray-400">Active Users</p> <p class="text-2xl font-bold text-white">${totalUsers[0]?.count || 0}</p> </div> </div> </div> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <div class="flex items-center"> <div class="p-2 bg-[#EC4899] rounded-lg"> <span class="text-2xl text-white">📁</span> </div> <div class="ml-4"> <p class="text-sm font-medium text-gray-400">Total Projects</p> <p class="text-2xl font-bold text-white">${totalProjects[0]?.count || 0}</p> </div> </div> </div> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <div class="flex items-center"> <div class="p-2 bg-[#F59E0B] rounded-lg"> <span class="text-2xl text-white">✅</span> </div> <div class="ml-4"> <p class="text-sm font-medium text-gray-400">Total Tasks</p> <p class="text-2xl font-bold text-white">${totalTasks[0]?.count || 0}</p> </div> </div> </div> </div> <!-- Charts and Data --> <div class="grid grid-cols-1 lg:grid-cols-2 gap-6"> <!-- Hours by User --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 class="text-lg font-medium text-white">Hours by User</h3> </div> <div class="p-6"> <div class="space-y-4"> ${hoursByUser.slice(0, 10).map((user) => renderTemplate`<div class="flex items-center justify-between"> <div class="flex items-center"> <div class="w-8 h-8 bg-[#4F46E5] rounded-full flex items-center justify-center mr-3"> <span class="text-sm font-medium text-white"> ${user.userName.split(" ").map((n) => n[0]).join("").toUpperCase()} </span> </div> <span class="text-sm font-medium text-white">${user.userName}</span> </div> <div class="flex items-center"> <div class="w-32 bg-gray-600 rounded-full h-2 mr-3"> <div class="bg-[#4F46E5] h-2 rounded-full"${addAttribute(`width: ${Math.min(user.totalHours / (hoursByUser[0]?.totalHours || 1) * 100, 100)}%`, "style")}></div> </div> <span class="text-sm text-gray-300">${Math.round(user.totalHours * 10) / 10}h</span> </div> </div>`)} </div> </div> </div> <!-- Hours by Project --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 class="text-lg font-medium text-white">Hours by Project</h3> </div> <div class="p-6"> <div class="space-y-4"> ${hoursByProject.slice(0, 10).map((project) => renderTemplate`<div class="flex items-center justify-between"> <div class="flex-1 min-w-0"> <p class="text-sm font-medium text-white truncate">${project.projectName}</p> <p class="text-xs text-gray-400">${project.clientName}</p> </div> <div class="flex items-center ml-4"> <div class="w-24 bg-gray-600 rounded-full h-2 mr-3"> <div class="bg-[#10B981] h-2 rounded-full"${addAttribute(`width: ${Math.min(project.totalHours / (hoursByProject[0]?.totalHours || 1) * 100, 100)}%`, "style")}></div> </div> <span class="text-sm text-gray-300">${Math.round(project.totalHours * 10) / 10}h</span> </div> </div>`)} </div> </div> </div> </div> <!-- Top Tasks --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 class="text-lg font-medium text-white">Top Tasks by Hours</h3> </div> <div class="overflow-x-auto"> <table class="min-w-full divide-y divide-gray-700"> <thead class="bg-gray-700"> <tr> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Task
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Project
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Client
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Hours
</th> </tr> </thead> <tbody class="bg-gray-800 divide-y divide-gray-700"> ${hoursByTask.slice(0, 10).map((task) => renderTemplate`<tr class="hover:bg-gray-700"> <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white"> ${task.taskName} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${task.projectName} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300"> ${task.clientName} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${Math.round(task.totalHours * 10) / 10} hours
</td> </tr>`)} </tbody> </table> </div> </div> <!-- Time Trends Chart --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 class="text-lg font-medium text-white">Daily Hours (Last 30 Days)</h3> </div> <div class="p-6"> <div class="h-64 flex items-end space-x-2"> ${recentEntries.map((entry) => {
    const maxHours = Math.max(...recentEntries.map((e) => e.hours));
    const height = maxHours > 0 ? entry.hours / maxHours * 100 : 0;
    return renderTemplate`<div class="flex-1 flex flex-col items-center"> <div class="w-full bg-[#4F46E5] rounded-t"${addAttribute(`height: ${height}%`, "style")}></div> <div class="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left"> ${new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} </div> </div>`;
  })} </div> </div> </div> <!-- Filters --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <h3 class="text-lg font-medium text-white mb-4">Report Filters</h3> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"> <div> <label for="dateRange" class="block text-sm font-medium text-gray-300 mb-1">Date Range</label> <select id="dateRange" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="30">Last 30 Days</option> <option value="90">Last 90 Days</option> <option value="180">Last 6 Months</option> <option value="365">Last Year</option> </select> </div> <div> <label for="userFilter" class="block text-sm font-medium text-gray-300 mb-1">User</label> <select id="userFilter" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">All Users</option> ${hoursByUser.map((user) => renderTemplate`<option${addAttribute(user.userName, "value")}>${user.userName}</option>`)} </select> </div> <div> <label for="projectFilter" class="block text-sm font-medium text-gray-300 mb-1">Project</label> <select id="projectFilter" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">All Projects</option> ${hoursByProject.map((project) => renderTemplate`<option${addAttribute(project.projectName, "value")}>${project.clientName} - ${project.projectName}</option>`)} </select> </div> </div> </div> </div> ${renderScript($$result2, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/reports/index.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/reports/index.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/admin/reports/index.astro";
const $$url = "/admin/reports";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
