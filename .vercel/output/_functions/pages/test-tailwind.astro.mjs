import { c as createComponent, r as renderHead, e as renderTemplate } from '../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                         */
export { renderers } from '../renderers.mjs';

const $$TestTailwind = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en" data-astro-cid-vhmp6yxj> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Tailwind CSS Test</title>${renderHead()}</head> <body class="bg-gray-100 p-8" data-astro-cid-vhmp6yxj> <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6" data-astro-cid-vhmp6yxj> <h1 class="text-2xl font-bold text-gray-900 mb-4" data-astro-cid-vhmp6yxj>Tailwind CSS Test</h1> <p class="text-gray-600 mb-4" data-astro-cid-vhmp6yxj>If you can see this styled content, Tailwind CSS is working!</p> <div class="space-y-2" data-astro-cid-vhmp6yxj> <div class="bg-blue-500 text-white p-3 rounded" data-astro-cid-vhmp6yxj>Blue Box</div> <div class="bg-green-500 text-white p-3 rounded" data-astro-cid-vhmp6yxj>Green Box</div> <div class="bg-red-500 text-white p-3 rounded" data-astro-cid-vhmp6yxj>Red Box</div> </div> <a href="/admin" class="inline-block mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" data-astro-cid-vhmp6yxj>
Go to Admin
</a> </div> </body></html>`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/test-tailwind.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/test-tailwind.astro";
const $$url = "/test-tailwind";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$TestTailwind,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
