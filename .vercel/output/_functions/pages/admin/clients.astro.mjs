import { c as createComponent, f as renderComponent, e as renderTemplate, m as maybeRenderHead, g as renderScript, d as addAttribute } from '../../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_DcFH0Yfs.mjs';
import { d as db, c as clients, u as users, p as projects } from '../../chunks/index_DQhihAc3.mjs';
import { count, sql } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allClients = await db.select({
    id: clients.id,
    name: clients.name,
    createdAt: clients.createdAt,
    createdByName: users.name,
    archived: clients.archived,
    projectCount: count(projects.id)
  }).from(clients).leftJoin(users, sql`${clients.createdBy} = ${users.id}`).leftJoin(projects, sql`${clients.id} = ${projects.clientId}`).groupBy(clients.id, users.name, clients.archived).orderBy(clients.createdAt);
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Clients", "currentPage": "clients" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-6"> <!-- Header --> <div class="flex justify-between items-center"> <div> <h1 class="text-2xl font-bold text-white">Clients</h1> <p class="text-gray-300">Manage your client relationships and projects</p> </div> <button id="createClientBtn" class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors">
+ Add Client
</button> </div> <!-- Filters --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 p-6"> <div class="flex flex-col sm:flex-row gap-4"> <div class="flex-1"> <label for="search" class="block text-sm font-medium text-gray-300 mb-1">Search</label> <input type="text" id="search" placeholder="Search clients..." class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="sm:w-48"> <label for="sort" class="block text-sm font-medium text-gray-300 mb-1">Sort by</label> <select id="sort" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="name">Name</option> <option value="created">Created Date</option> <option value="projects">Project Count</option> </select> </div> <div class="sm:w-48"> <label for="archiveFilter" class="block text-sm font-medium text-gray-300 mb-1">Status</label> <select id="archiveFilter" class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> <option value="active">Active</option> <option value="archived">Archived</option> <option value="all">All</option> </select> </div> </div> </div> <!-- Clients Table --> <div class="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden"> <div class="overflow-x-auto"> <table class="min-w-full divide-y divide-gray-700"> <thead class="bg-gray-700"> <tr> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Client Name
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Projects
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Created By
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Created Date
</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
Status
</th> <th class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
Actions
</th> </tr> </thead> <tbody class="bg-gray-800 divide-y divide-gray-700"> ${allClients.map((client) => renderTemplate`<tr class="hover:bg-gray-700"> <td class="px-6 py-4 whitespace-nowrap"> <div class="text-sm font-medium text-white">${client.name}</div> </td> <td class="px-6 py-4 whitespace-nowrap"> <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4F46E5] text-white" data-client-id="\${client.id}"> ${client.projectCount} projects
</span> </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-white"> ${client.createdByName} </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300"> ${new Date(client.createdAt).toLocaleDateString()} </td> <td class="px-6 py-4 whitespace-nowrap"> ${client.archived ? renderTemplate`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
Archived
</span>` : renderTemplate`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
Active
</span>`} </td> <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> <div class="flex justify-end space-x-2"> <button class="text-[#4F46E5] hover:text-[#3730A3]"${addAttribute(`viewProjects(${client.id}, '${client.name}', ${client.archived})`, "onclick")}>
Projects
</button> <button class="text-[#EC4899] hover:text-[#DB2777]"${addAttribute(`editClient(${client.id})`, "onclick")}>
Edit
</button> <button${addAttribute(client.archived ? "text-green-400 hover:text-green-300" : "text-yellow-400 hover:text-yellow-300", "class")}${addAttribute(client.archived ? `unarchiveClient(${client.id})` : `archiveClient(${client.id})`, "onclick")}> ${client.archived ? "Unarchive" : "Archive"} </button> <button class="text-red-400 hover:text-red-300 p-1"${addAttribute(`deleteClient(${client.id})`, "onclick")} title="Delete client"> <img src="/icons/trash-bin.svg" alt="Delete" class="w-4 h-4"> </button> </div> </td> </tr>`)} </tbody> </table> </div> </div> <div id="emptyState" class="text-center py-12 hidden"> <div class="text-6xl mb-4">👥</div> <h3 class="text-lg font-medium text-white mb-2">No clients yet</h3> <p class="text-gray-300 mb-4">Get started by adding your first client</p> <button class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors" onclick="document.getElementById('createClientBtn').click()">
Add Your First Client
</button> </div> </div>  <div id="clientModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-md w-full border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 id="modalTitle" class="text-lg font-medium text-white">Add New Client</h3> </div> <form id="clientForm" class="p-6"> <input type="hidden" id="clientId"> <div class="mb-4"> <label for="clientName" class="block text-sm font-medium text-gray-300 mb-1">
Client Name
</label> <input type="text" id="clientName" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="flex justify-end space-x-3"> <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-md transition-colors">
Save Client
</button> </div> </form> </div> </div> </div>  <div id="projectsModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-4xl w-full border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700 flex justify-between items-center"> <h3 id="projectsModalTitle" class="text-lg font-medium text-white">Projects</h3> <button onclick="closeProjectsModal()" class="text-gray-400 hover:text-white"> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path> </svg> </button> </div> <div class="p-6"> <div class="flex justify-between items-center mb-6"> <div> <h4 id="clientNameHeader" class="text-xl font-semibold text-white"></h4> <p id="clientDescription" class="text-gray-300">Manage projects for this client</p> </div> <button id="newProjectBtn" class="bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium py-2 px-4 rounded-lg transition-colors">
+ New Project
</button> </div> <div id="projectsList" class="space-y-3"> <!-- Projects will be loaded here --> </div> </div> </div> </div> </div>  <div id="newProjectModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-lg shadow-xl max-w-md w-full border border-gray-700"> <div class="px-6 py-4 border-b border-gray-700"> <h3 class="text-lg font-medium text-white">Add New Project</h3> </div> <form id="newProjectForm" class="p-6"> <input type="hidden" id="projectClientId"> <div class="mb-4"> <label for="projectName" class="block text-sm font-medium text-gray-300 mb-1">
Project Name
</label> <input type="text" id="projectName" required class="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-gray-700 text-white"> </div> <div class="flex justify-end space-x-3"> <button type="button" onclick="closeNewProjectModal()" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-md transition-colors">
Create Project
</button> </div> </form> </div> </div> </div> ${renderScript($$result2, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/clients/index.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/clients/index.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/admin/clients/index.astro";
const $$url = "/admin/clients";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
