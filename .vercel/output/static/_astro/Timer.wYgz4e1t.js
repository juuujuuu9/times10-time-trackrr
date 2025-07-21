import{r as c}from"./index.BVOCwoKb.js";var d={exports:{}},i={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var m;function p(){if(m)return i;m=1;var u=Symbol.for("react.transitional.element"),a=Symbol.for("react.fragment");function s(l,t,e){var o=null;if(e!==void 0&&(o=""+e),t.key!==void 0&&(o=""+t.key),"key"in t){e={};for(var r in t)r!=="key"&&(e[r]=t[r])}else e=t;return t=e.ref,{$$typeof:u,type:l,key:o,ref:t!==void 0?t:null,props:e}}return i.Fragment=a,i.jsx=s,i.jsxs=s,i}var f;function h(){return f||(f=1,d.exports=p()),d.exports}var n=h();function g(){const[u,a]=c.useState(0),[s,l]=c.useState(!1);c.useEffect(()=>{let r;return s&&(r=setInterval(()=>{a(x=>x+1)},1e3)),()=>clearInterval(r)},[s]);const t=r=>{const x=Math.floor(r/60),v=r%60;return`${x.toString().padStart(2,"0")}:${v.toString().padStart(2,"0")}`},e=()=>{l(!s)},o=()=>{a(0),l(!1)};return n.jsxs("div",{className:"bg-white p-6 rounded-lg shadow-lg",children:[n.jsx("h2",{className:"text-2xl font-bold text-gray-800 mb-4",children:"Timer"}),n.jsx("div",{className:"text-4xl font-mono text-center mb-6 text-blue-600",children:t(u)}),n.jsxs("div",{className:"flex space-x-4 justify-center",children:[n.jsx("button",{onClick:e,className:`px-6 py-2 rounded-lg font-semibold transition-colors ${s?"bg-red-500 hover:bg-red-600 text-white":"bg-green-500 hover:bg-green-600 text-white"}`,children:s?"Pause":"Start"}),n.jsx("button",{onClick:o,className:"px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors",children:"Reset"})]})]})}export{g as default};
