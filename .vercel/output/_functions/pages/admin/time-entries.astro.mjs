import { c as createComponent, f as renderComponent, e as renderTemplate, m as maybeRenderHead, g as renderScript, d as addAttribute } from '../../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_6J3_7iip.mjs';
import { d as db, c as clients, p as projects, a as tasks, u as users, t as timeEntries } from '../../chunks/index_DQhihAc3.mjs';
import { sql } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allTimeEntries = await db.select({
    id: timeEntries.id,
    startTime: timeEntries.startTime,
    endTime: timeEntries.endTime,
    durationManual: timeEntries.durationManual,
    notes: timeEntries.notes,
    createdAt: timeEntries.createdAt,
    userName: users.name,
    taskName: tasks.name,
    projectName: projects.name,
    clientName: clients.name
  }).from(timeEntries).innerJoin(users, sql`${timeEntries.userId} = ${users.id}`).innerJoin(tasks, sql`${timeEntries.taskId} = ${tasks.id}`).innerJoin(projects, sql`${tasks.projectId} = ${projects.id}`).innerJoin(clients, sql`${projects.clientId} = ${clients.id}`).orderBy(sql`${timeEntries.startTime} DESC`);
  const allUsers = await db.select().from(users).orderBy(users.name);
  const allTasks = await db.select({
    id: tasks.id,
    name: tasks.name,
    projectName: projects.name,
    clientName: clients.name
  }).from(tasks).innerJoin(projects, sql`${tasks.projectId} = ${projects.id}`).innerJoin(clients, sql`${projects.clientId} = ${clients.id}`).orderBy(clients.name, projects.name, tasks.name);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Time Entries", "currentPage": "time-entries" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6"> <!-- Header --> <div class="flex justify-between items-center"> <div> <h1 class="text-2xl font-bold text-white">Time Entries</h1> <p class="text-gray-300">View and manage time tracking data</p> </div> <div class="flex space-x-3"> <button id="exportCsvBtn" class="bg-[#10B981] hover:bg-[#059669] text-white font-medium py-2 px-4 rounded-lg transition-colors">
Export CSV
</button> <button id="addTimeEntryBtn" class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors">
+ Add Entry
</button> </div> </div> <!-- Filters --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> <div> <label for="search" class="block text-sm font-medium text-gray-300 mb-1">Search</label> <input type="text" id="search" placeholder="Search entries..." class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div> <label for="userFilter" class="block text-sm font-medium text-gray-300 mb-1">User</label> <select id="userFilter" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">All Users</option> ${allUsers.map((user) => renderTemplate`<option${addAttribute(user.name, "value")}>${user.name}</option>`)} </select> </div> <div> <label for="taskFilter" class="block text-sm font-medium text-gray-300 mb-1">Task</label> <select id="taskFilter" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">All Tasks</option> ${allTasks.map((task) => renderTemplate`<option${addAttribute(task.name, "value")}>${task.clientName} - ${task.projectName} - ${task.name}</option>`)} </select> </div> <div> <label for="dateRange" class="block text-sm font-medium text-gray-300 mb-1">Date Range</label> <select id="dateRange" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">All Time</option> <option value="today">Today</option> <option value="week">This Week</option> <option value="month">This Month</option> <option value="quarter">This Quarter</option> </select> </div> </div> </div> <!-- Time Entries Table --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden"> <div class="overflow-x-auto"> <table class="min-w-full divide-y divide-gray-700"> <thead class="bg-gray-700"> <tr> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
User
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Task
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Project
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Start Time
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
End Time
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Duration
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Notes
</th> <th class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
Actions
</th> </tr> </thead> <tbody class="bg-gray-800 divide-y divide-gray-700"> ${allTimeEntries.map((entry) => {
    const startTime = new Date(entry.startTime);
    const endTime = entry.endTime ? new Date(entry.endTime) : null;
    const duration = endTime ? (endTime.getTime() - startTime.getTime()) / (1e3 * 60 * 60) : entry.durationManual ? entry.durationManual / 3600 : 0;
    return renderTemplate`<tr class="hover:bg-gray-700"> <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white"> ${entry.userName} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${entry.taskName} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${entry.projectName} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300"> ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300"> ${endTime ? `${endTime.toLocaleDateString()} ${endTime.toLocaleTimeString()}` : "Ongoing"} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${duration ? Math.round(duration * 10) / 10 : 0} hours
</td> <td class="px-6 py-4 text-sm text-gray-400 max-w-xs truncate"> ${entry.notes || "-"} </td> <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> <div class="flex justify-end space-x-2"> <button class="text-[#EC4899] hover:text-[#DB2777]"${addAttribute(`editTimeEntry(${entry.id})`, "onclick")}>
Edit
</button> <button class="text-red-400 hover:text-red-300"${addAttribute(`deleteTimeEntry(${entry.id})`, "onclick")}>
Delete
</button> </div> </td> </tr>`;
  })} </tbody> </table> </div> </div> ${allTimeEntries.length === 0 && renderTemplate`<div class="text-center py-12"> <div class="text-6xl mb-4">⏱️</div> <h3 class="text-lg font-medium text-white mb-2">No time entries yet</h3> <p class="text-gray-300 mb-4">Start tracking time to see entries here</p> <button class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors" onclick="document.getElementById('addTimeEntryBtn').click()">
Add Your First Entry
</button> </div>`} </div>  <div id="timeEntryModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-md w-full border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 id="timeEntryModalTitle" class="text-lg font-medium text-white">Add Time Entry</h3> </div> <form id="timeEntryForm" class="p-6"> <input type="hidden" id="timeEntryId"> <div class="mb-4"> <label for="timeEntryUser" class="block text-sm font-medium text-gray-300 mb-1">
User
</label> <select id="timeEntryUser" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">Select a user</option> ${allUsers.map((user) => renderTemplate`<option${addAttribute(user.id, "value")}>${user.name}</option>`)} </select> </div> <div class="mb-4"> <label for="timeEntryTask" class="block text-sm font-medium text-gray-300 mb-1">
Task
</label> <select id="timeEntryTask" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="">Select a task</option> ${allTasks.map((task) => renderTemplate`<option${addAttribute(task.id, "value")}>${task.clientName} - ${task.projectName} - ${task.name}</option>`)} </select> </div> <div class="mb-4"> <label for="timeEntryStart" class="block text-sm font-medium text-gray-300 mb-1">
Start Time
</label> <input type="datetime-local" id="timeEntryStart" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="mb-4"> <label for="timeEntryEnd" class="block text-sm font-medium text-gray-300 mb-1">
End Time
</label> <input type="datetime-local" id="timeEntryEnd" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="mb-4"> <label for="timeEntryNotes" class="block text-sm font-medium text-gray-300 mb-1">
Notes
</label> <textarea id="timeEntryNotes" rows="3" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"></textarea> </div> <div class="flex justify-end space-x-3"> <button type="button" onclick="closeTimeEntryModal()" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-md transition-colors">
Save Entry
</button> </div> </form> </div> </div> </div> ${renderScript($$result2, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/time-entries/index.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/time-entries/index.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/admin/time-entries/index.astro";
const $$url = "/admin/time-entries";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
