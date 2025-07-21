import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_BN7JFiw8.mjs';
import { manifest } from './manifest_BDTRVt4C.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin/clients.astro.mjs');
const _page2 = () => import('./pages/admin/projects.astro.mjs');
const _page3 = () => import('./pages/admin/reports.astro.mjs');
const _page4 = () => import('./pages/admin/settings.astro.mjs');
const _page5 = () => import('./pages/admin/tasks.astro.mjs');
const _page6 = () => import('./pages/admin/time-entries.astro.mjs');
const _page7 = () => import('./pages/admin/users.astro.mjs');
const _page8 = () => import('./pages/admin.astro.mjs');
const _page9 = () => import('./pages/api/admin/clients/_id_.astro.mjs');
const _page10 = () => import('./pages/api/admin/clients.astro.mjs');
const _page11 = () => import('./pages/api/admin/projects/_id_/tasks.astro.mjs');
const _page12 = () => import('./pages/api/admin/projects/_id_.astro.mjs');
const _page13 = () => import('./pages/api/admin/projects.astro.mjs');
const _page14 = () => import('./pages/api/admin/tasks/assign.astro.mjs');
const _page15 = () => import('./pages/api/admin/tasks/_id_/assignments.astro.mjs');
const _page16 = () => import('./pages/api/admin/tasks/_id_.astro.mjs');
const _page17 = () => import('./pages/api/admin/tasks.astro.mjs');
const _page18 = () => import('./pages/api/admin/time-entries/_id_.astro.mjs');
const _page19 = () => import('./pages/api/admin/time-entries.astro.mjs');
const _page20 = () => import('./pages/api/admin/users/role.astro.mjs');
const _page21 = () => import('./pages/api/admin/users/status.astro.mjs');
const _page22 = () => import('./pages/api/admin/users.astro.mjs');
const _page23 = () => import('./pages/api/test-db.astro.mjs');
const _page24 = () => import('./pages/test-db.astro.mjs');
const _page25 = () => import('./pages/test-tailwind.astro.mjs');
const _page26 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/admin/clients/index.astro", _page1],
    ["src/pages/admin/projects/index.astro", _page2],
    ["src/pages/admin/reports/index.astro", _page3],
    ["src/pages/admin/settings/index.astro", _page4],
    ["src/pages/admin/tasks/index.astro", _page5],
    ["src/pages/admin/time-entries/index.astro", _page6],
    ["src/pages/admin/users/index.astro", _page7],
    ["src/pages/admin/index.astro", _page8],
    ["src/pages/api/admin/clients/[id].ts", _page9],
    ["src/pages/api/admin/clients.ts", _page10],
    ["src/pages/api/admin/projects/[id]/tasks.ts", _page11],
    ["src/pages/api/admin/projects/[id].ts", _page12],
    ["src/pages/api/admin/projects.ts", _page13],
    ["src/pages/api/admin/tasks/assign.ts", _page14],
    ["src/pages/api/admin/tasks/[id]/assignments.ts", _page15],
    ["src/pages/api/admin/tasks/[id].ts", _page16],
    ["src/pages/api/admin/tasks.ts", _page17],
    ["src/pages/api/admin/time-entries/[id].ts", _page18],
    ["src/pages/api/admin/time-entries.ts", _page19],
    ["src/pages/api/admin/users/role.ts", _page20],
    ["src/pages/api/admin/users/status.ts", _page21],
    ["src/pages/api/admin/users.ts", _page22],
    ["src/pages/api/test-db.ts", _page23],
    ["src/pages/test-db.astro", _page24],
    ["src/pages/test-tailwind.astro", _page25],
    ["src/pages/index.astro", _page26]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "bcd7be99-b419-4a5b-9ff5-ca28ea80b136",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
