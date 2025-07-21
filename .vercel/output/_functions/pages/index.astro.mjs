import { c as createComponent, a as createAstro, d as addAttribute, r as renderHead, b as renderSlot, e as renderTemplate, f as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_CoMPydnS.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                 */
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="Times10 Time Tracker"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderHead()}</head> <body> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/Users/user/Times10-Time-Tracker-2/src/layouts/Layout.astro", void 0);

function Timer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1e3);
    }
    return () => clearInterval(interval);
  }, [isRunning]);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  const resetTimer = () => {
    setTime(0);
    setIsRunning(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-lg shadow-lg", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-4", children: "Timer" }),
    /* @__PURE__ */ jsx("div", { className: "text-4xl font-mono text-center mb-6 text-blue-600", children: formatTime(time) }),
    /* @__PURE__ */ jsxs("div", { className: "flex space-x-4 justify-center", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: toggleTimer,
          className: `px-6 py-2 rounded-lg font-semibold transition-colors ${isRunning ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`,
          children: isRunning ? "Pause" : "Start"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: resetTimer,
          className: "px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors",
          children: "Reset"
        }
      )
    ] })
  ] });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Times10 Time Tracker" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"> <div class="text-center"> <h1 class="text-6xl font-bold text-gray-800 mb-4">
Times10 Time Tracker
</h1> <p class="text-xl text-gray-600 mb-8">
Welcome to your productivity companion
</p> <div class="space-x-4 mb-8"> <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
Start Tracking
</button> <a href="/admin" class="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-block">
Admin Dashboard
</a> </div> <div class="mb-8"> <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg"> <strong>✅ Database Connected!</strong> Your Neon PostgreSQL database is ready for time tracking.
</div> </div> ${renderComponent($$result2, "Timer", Timer, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/user/Times10-Time-Tracker-2/src/components/Timer", "client:component-export": "default" })} </div> </main> ` })}`;
}, "/Users/user/Times10-Time-Tracker-2/src/pages/index.astro", void 0);

const $$file = "/Users/user/Times10-Time-Tracker-2/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
