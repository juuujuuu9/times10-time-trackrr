import { c as createComponent, f as renderComponent, e as renderTemplate, m as maybeRenderHead, g as renderScript, d as addAttribute } from '../../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_6J3_7iip.mjs';
import { d as db, u as users, a as tasks, t as timeEntries } from '../../chunks/index_DQhihAc3.mjs';
import { count, sql } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    totalHours: sql`COALESCE(SUM(EXTRACT(EPOCH FROM (${timeEntries.endTime} - ${timeEntries.startTime}))/3600), 0)`,
    taskCount: count(tasks.id)
  }).from(users).leftJoin(timeEntries, sql`${users.id} = ${timeEntries.userId}`).leftJoin(tasks, sql`${users.id} = ${tasks.id}`).groupBy(users.id).orderBy(users.name);
  const usersWithStatus = allUsers.map((user) => ({
    ...user,
    status: user.totalHours > 0 ? "active" : "inactive"
  }));
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Users", "currentPage": "users" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="space-y-8"> <!-- Header --> <div class="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6"> <div class="flex items-center justify-between"> <div class="flex items-center"> <div class="w-12 h-12 bg-gradient-to-r from-[#4F46E5] to-[#3730A3] rounded-xl flex items-center justify-center mr-4"> <span class="text-white text-xl">👥</span> </div> <div> <h1 class="text-3xl font-bold text-white">Users</h1> <p class="text-gray-300 mt-1">Manage team members and their roles</p> </div> </div> <button id="inviteUserBtn" class="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:from-[#3730A3] hover:to-[#312E81] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
➕ Invite User
</button> </div> </div> <!-- Stats Overview --> <div class="grid grid-cols-1 md:grid-cols-3 gap-6"> <div class="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6"> <div class="flex items-center"> <div class="p-3 bg-gradient-to-r from-[#10B981] to-[#059669] rounded-xl"> <span class="text-2xl text-white">👤</span> </div> <div class="ml-4"> <p class="text-sm font-medium text-gray-400">Total Users</p> <p class="text-3xl font-bold text-white">${usersWithStatus.length}</p> </div> </div> </div> <div class="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6"> <div class="flex items-center"> <div class="p-3 bg-gradient-to-r from-[#4F46E5] to-[#3730A3] rounded-xl"> <span class="text-2xl text-white">🟢</span> </div> <div class="ml-4"> <p class="text-sm font-medium text-gray-400">Active Users</p> <p class="text-3xl font-bold text-white">${usersWithStatus.filter((u) => u.status === "active").length}</p> </div> </div> </div> <div class="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6"> <div class="flex items-center"> <div class="p-3 bg-gradient-to-r from-[#EC4899] to-[#DB2777] rounded-xl"> <span class="text-2xl text-white">👑</span> </div> <div class="ml-4"> <p class="text-sm font-medium text-gray-400">Admins</p> <p class="text-3xl font-bold text-white">${usersWithStatus.filter((u) => u.role === "admin").length}</p> </div> </div> </div> </div> <!-- Filters --> <div class="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6"> <div class="flex flex-col sm:flex-row gap-6"> <div class="flex-1"> <label for="search" class="block text-sm font-semibold text-gray-300 mb-2">Search Users</label> <input type="text" id="search" placeholder="Search by name or email..." class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all duration-200 bg-gray-700 text-white"> </div> <div class="sm:w-48"> <label for="roleFilter" class="block text-sm font-semibold text-gray-300 mb-2">Role</label> <select id="roleFilter" class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all duration-200 bg-gray-700 text-white"> <option value="">All Roles</option> <option value="admin">Admin</option> <option value="user">User</option> </select> </div> <div class="sm:w-48"> <label for="statusFilter" class="block text-sm font-semibold text-gray-300 mb-2">Status</label> <select id="statusFilter" class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all duration-200 bg-gray-700 text-white"> <option value="">All Statuses</option> <option value="active">Active</option> <option value="inactive">Inactive</option> </select> </div> </div> </div> <!-- Users Table --> <div class="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden"> <div class="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-700"> <div class="flex items-center"> <div class="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center mr-3"> <span class="text-gray-300 text-xl">📋</span> </div> <h3 class="text-xl font-semibold text-white">User Management</h3> </div> </div> <div class="overflow-x-auto"> <table class="min-w-full divide-y divide-gray-700"> <thead class="bg-gray-700"> <tr> <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
User
</th> <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
Role
</th> <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
Status
</th> <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
Total Hours
</th> <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
Joined Date
</th> <th class="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
Actions
</th> </tr> </thead> <tbody class="bg-gray-800 divide-y divide-gray-700"> ${usersWithStatus.map((user) => renderTemplate`<tr class="hover:bg-gray-700 transition-colors duration-200"> <td class="px-6 py-4 whitespace-nowrap"> <div class="flex items-center"> <div class="flex-shrink-0 h-12 w-12"> <div class="h-12 w-12 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#3730A3] flex items-center justify-center shadow-lg"> <span class="text-sm font-bold text-white"> ${user.name.split(" ").map((n) => n[0]).join("").toUpperCase()} </span> </div> </div> <div class="ml-4"> <div class="text-sm font-semibold text-white">${user.name}</div> <div class="text-sm text-gray-400">${user.email}</div> </div> </div> </td> <td class="px-6 py-4 whitespace-nowrap"> <span${addAttribute(`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${user.role === "admin" ? "bg-[#EC4899] text-white" : "bg-[#4F46E5] text-white"}`, "class")}> ${user.role === "admin" ? "\u{1F451} Admin" : "\u{1F464} User"} </span> </td> <td class="px-6 py-4 whitespace-nowrap"> <span${addAttribute(`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${user.status === "active" ? "bg-[#10B981] text-white" : "bg-gray-600 text-gray-300"}`, "class")}> ${user.status === "active" ? "\u{1F7E2} Active" : "\u26AA Inactive"} </span> </td> <td class="px-6 py-4 whitespace-nowrap"> <div class="flex items-center"> <span class="text-sm font-semibold text-white"> ${user.totalHours ? Math.round(user.totalHours * 10) / 10 : 0} hours
</span> ${user.totalHours > 0 && renderTemplate`<div class="ml-2 w-16 bg-gray-600 rounded-full h-2"> <div class="bg-[#4F46E5] h-2 rounded-full"${addAttribute(`width: ${Math.min(user.totalHours / 100 * 100, 100)}%`, "style")}></div> </div>`} </div> </td> <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300"> <div class="bg-gray-700 px-3 py-1 rounded-lg border border-gray-600"> ${new Date(user.createdAt).toLocaleDateString()} </div> </td> <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"> <div class="flex justify-end space-x-2"> <button class="px-3 py-1 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-lg transition-colors text-xs font-medium"${addAttribute(`editUser(${user.id})`, "onclick")}>
✏️ Edit
</button> <button class="px-3 py-1 bg-[#EC4899] hover:bg-[#DB2777] text-white rounded-lg transition-colors text-xs font-medium"${addAttribute(`changeRole(${user.id})`, "onclick")}>
🔄 Role
</button> <button${addAttribute(`px-3 py-1 rounded-lg transition-colors text-xs font-medium ${user.status === "active" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[#10B981] hover:bg-[#059669] text-white"}`, "class")}${addAttribute(`toggleUserStatus(${user.id}, '${user.status}')`, "onclick")}> ${user.status === "active" ? "\u274C Deactivate" : "\u2705 Activate"} </button> </div> </td> </tr>`)} </tbody> </table> </div> </div> ${usersWithStatus.length === 0 && renderTemplate`<div class="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-12 text-center"> <div class="w-20 h-20 bg-gradient-to-r from-[#4F46E5] to-[#3730A3] rounded-full flex items-center justify-center mx-auto mb-6"> <span class="text-white text-3xl">👤</span> </div> <h3 class="text-2xl font-bold text-white mb-2">No users yet</h3> <p class="text-gray-300 mb-6">Get started by inviting your first team member to join your organization</p> <button class="bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:from-[#3730A3] hover:to-[#312E81] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg" onclick="document.getElementById('inviteUserBtn').click()">
➕ Invite Your First User
</button> </div>`} </div>  <div id="inviteModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-xl shadow-xl max-w-md w-full border border-gray-700"> <div class="px-6 py-4 bg-gradient-to-r from-[#1F2937] to-gray-700 border-b border-gray-700"> <div class="flex items-center"> <div class="w-10 h-10 bg-[#4F46E5] rounded-lg flex items-center justify-center mr-3"> <span class="text-white text-xl">📧</span> </div> <h3 class="text-xl font-semibold text-white">Invite New User</h3> </div> </div> <form id="inviteForm" class="p-6"> <div class="mb-6"> <label for="inviteName" class="block text-sm font-semibold text-gray-300 mb-2">
Full Name
</label> <input type="text" id="inviteName" required class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all duration-200 bg-gray-700 text-white" placeholder="Enter full name"> </div> <div class="mb-6"> <label for="inviteEmail" class="block text-sm font-semibold text-gray-300 mb-2">
Email Address
</label> <input type="email" id="inviteEmail" required class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all duration-200 bg-gray-700 text-white" placeholder="Enter email address"> </div> <div class="mb-6"> <label for="inviteRole" class="block text-sm font-semibold text-gray-300 mb-2">
Role
</label> <select id="inviteRole" required class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all duration-200 bg-gray-700 text-white"> <option value="user">👤 User</option> <option value="admin">👑 Admin</option> </select> </div> <div class="flex justify-end space-x-3"> <button type="button" onclick="closeInviteModal()" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-gradient-to-r from-[#4F46E5] to-[#3730A3] hover:from-[#3730A3] hover:to-[#312E81] text-white rounded-lg transition-all duration-200 font-semibold">
📧 Send Invitation
</button> </div> </form> </div> </div> </div>  <div id="editUserModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-xl shadow-xl max-w-md w-full border border-gray-700"> <div class="px-6 py-4 bg-gradient-to-r from-[#1F2937] to-gray-700 border-b border-gray-700"> <div class="flex items-center"> <div class="w-10 h-10 bg-[#10B981] rounded-lg flex items-center justify-center mr-3"> <span class="text-white text-xl">✏️</span> </div> <h3 class="text-xl font-semibold text-white">Edit User</h3> </div> </div> <form id="editUserForm" class="p-6"> <input type="hidden" id="editUserId"> <div class="mb-6"> <label for="editUserName" class="block text-sm font-semibold text-gray-300 mb-2">
Full Name
</label> <input type="text" id="editUserName" required class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all duration-200 bg-gray-700 text-white" placeholder="Enter full name"> </div> <div class="mb-6"> <label for="editUserEmail" class="block text-sm font-semibold text-gray-300 mb-2">
Email Address
</label> <input type="email" id="editUserEmail" required class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all duration-200 bg-gray-700 text-white" placeholder="Enter email address"> </div> <div class="flex justify-end space-x-3"> <button type="button" onclick="closeEditUserModal()" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium">
Cancel
</button> <button type="submit" class="px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-lg transition-all duration-200 font-semibold">
💾 Save Changes
</button> </div> </form> </div> </div> </div>  <div id="roleModal" class="fixed inset-0 bg-black/50 hidden z-50"> <div class="flex items-center justify-center min-h-screen p-4"> <div class="bg-[#1F2937] rounded-xl shadow-xl max-w-md w-full border border-gray-700"> <div class="px-6 py-4 bg-gradient-to-r from-[#1F2937] to-gray-700 border-b border-gray-700"> <div class="flex items-center"> <div class="w-10 h-10 bg-[#EC4899] rounded-lg flex items-center justify-center mr-3"> <span class="text-white text-xl">👑</span> </div> <h3 class="text-xl font-semibold text-white">Change User Role</h3> </div> </div> <div class="p-6"> <input type="hidden" id="roleUserId"> <div class="mb-6"> <label for="newRole" class="block text-sm font-semibold text-gray-300 mb-2">
New Role
</label> <select id="newRole" class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all duration-200 bg-gray-700 text-white"> <option value="user">👤 User</option> <option value="admin">👑 Admin</option> </select> </div> <div class="flex justify-end space-x-3"> <button type="button" onclick="closeRoleModal()" class="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium">
Cancel
</button> <button onclick="saveRoleChange()" class="px-4 py-2 bg-gradient-to-r from-[#EC4899] to-[#DB2777] hover:from-[#DB2777] hover:to-[#BE185D] text-white rounded-lg transition-all duration-200 font-semibold">
👑 Save Role
</button> </div> </div> </div> </div> </div> ${renderScript($$result2, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/users/index.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/admin/users/index.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/admin/users/index.astro";
const $$url = "/admin/users";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
