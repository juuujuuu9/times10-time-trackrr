import { c as createComponent, a as createAstro, r as renderHead, b as renderSlot, d as addAttribute, e as renderTemplate } from './astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                         */

const $$Astro = createAstro();
const $$AdminLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AdminLayout;
  const { title, currentPage = "dashboard" } = Astro2.props;
  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "\u{1F4CA}" },
    { name: "Clients", href: "/admin/clients", icon: "\u{1F465}" },
    { name: "Projects", href: "/admin/projects", icon: "\u{1F4C1}" },
    { name: "Users", href: "/admin/users", icon: "\u{1F464}" },
    { name: "Time Entries", href: "/admin/time-entries", icon: "\u23F1\uFE0F" },
    { name: "Reports", href: "/admin/reports", icon: "\u{1F4C8}" },
    { name: "Settings", href: "/admin/settings", icon: "\u2699\uFE0F" }
  ];
  return renderTemplate`<html lang="en" data-astro-cid-2kanml4j> <head><meta charset="UTF-8"><meta name="description" content="Times10 Admin Dashboard"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title} - Times10 Admin</title>${renderHead()}</head> <body class="bg-gray-900 font-sans" data-astro-cid-2kanml4j> <div class="flex h-screen" data-astro-cid-2kanml4j> <!-- Sidebar --> <div class="w-64 bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl border-r border-gray-700" data-astro-cid-2kanml4j> <div class="p-6 border-b border-gray-700" data-astro-cid-2kanml4j> <div class="flex items-center" data-astro-cid-2kanml4j> <div class="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center mr-3 shadow-lg" data-astro-cid-2kanml4j> <span class="text-white font-bold text-lg" data-astro-cid-2kanml4j>T</span> </div> <h1 class="text-xl font-bold text-white" data-astro-cid-2kanml4j>Times10 Admin</h1> </div> </div> <nav class="mt-6 px-4" data-astro-cid-2kanml4j> <div class="space-y-1" data-astro-cid-2kanml4j> ${navItems.map((item) => {
    const isActive = currentPage === item.href.split("/").pop() || currentPage === "dashboard" && item.href === "/admin";
    return renderTemplate`<a${addAttribute(item.href, "href")}${addAttribute(`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? "bg-[#EC4899] text-white shadow-lg transform scale-105" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`, "class")} data-astro-cid-2kanml4j> <span class="mr-3 text-lg" data-astro-cid-2kanml4j>${item.icon}</span> ${item.name} </a>`;
  })} </div> </nav> <!-- Sidebar Footer --> <div class="absolute bottom-0 w-64 p-4 border-t border-gray-700" data-astro-cid-2kanml4j> <div class="flex items-center text-gray-300 text-sm" data-astro-cid-2kanml4j> <span class="mr-2" data-astro-cid-2kanml4j>👤</span> <span data-astro-cid-2kanml4j>Admin User</span> </div> </div> </div> <!-- Main content --> <div class="flex-1 flex flex-col overflow-hidden" data-astro-cid-2kanml4j> <!-- Top bar --> <header class="bg-gray-800 shadow-sm border-b border-gray-700" data-astro-cid-2kanml4j> <div class="flex items-center justify-between px-6 py-4" data-astro-cid-2kanml4j> <div class="flex items-center" data-astro-cid-2kanml4j> <h2 class="text-2xl font-bold text-white" data-astro-cid-2kanml4j>${title}</h2> <div class="ml-4 px-3 py-1 bg-[#10B981] text-white text-sm font-medium rounded-full" data-astro-cid-2kanml4j>
Admin Panel
</div> </div> <div class="flex items-center space-x-4" data-astro-cid-2kanml4j> <button class="p-2 text-gray-400 hover:text-[#EC4899] transition-colors" data-astro-cid-2kanml4j> <span class="text-xl" data-astro-cid-2kanml4j>🔔</span> </button> <button class="p-2 text-gray-400 hover:text-[#EC4899] transition-colors" data-astro-cid-2kanml4j> <span class="text-xl" data-astro-cid-2kanml4j>⚙️</span> </button> <a href="/" class="inline-flex items-center px-4 py-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white font-medium rounded-lg transition-colors" data-astro-cid-2kanml4j> <span class="mr-2" data-astro-cid-2kanml4j>←</span>
Back to App
</a> </div> </div> </header> <!-- Page content --> <main class="flex-1 overflow-y-auto p-6 bg-gray-900" data-astro-cid-2kanml4j> ${renderSlot($$result, $$slots["default"])} </main> </div> </div> </body></html>`;
}, "/Users/user/Times10-Time-Tracker-2/src/layouts/AdminLayout.astro", void 0);

export { $$AdminLayout as $ };
