import{u as c,j as e,G as n,A as h,d as a,e as m,b as u,B as i,f as g}from"./mantine-gaEAkGgm.js";import{a as p,L as l,O as x}from"./react-vendor-CNHA2c5_.js";import{c as d}from"./createReactComponent-BDw6330a.js";/**
 * @license @tabler/icons-react v3.24.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var j=d("outline","moon","IconMoon",[["path",{d:"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z",key:"svg-0"}]]);/**
 * @license @tabler/icons-react v3.24.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var f=d("outline","sun","IconSun",[["path",{d:"M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",key:"svg-0"}],["path",{d:"M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",key:"svg-1"}]]);function v(){const{colorScheme:o,toggleColorScheme:t}=c();return e.jsx(n,{children:e.jsx(h,{onClick:()=>t(),color:o==="light"?"#5e81ac":"#ebcb8b",variant:"subtle",radius:"xl",size:36,children:o==="light"?e.jsx(j,{size:24}):e.jsx(f,{size:24})})})}function y({opened:o,toggle:t}){const r=p(),{colorScheme:s}=c();return e.jsx(a.Header,{bg:s==="light"?"#e5e9f0":"#3b4252",children:e.jsxs(n,{h:"100%",px:"md",justify:"space-between",children:[e.jsxs(n,{children:[e.jsx(m,{src:"favicon.jpeg",alt:"Logo",radius:"sm"}),e.jsx(u,{variant:"gradient",component:"span",gradient:{from:"#a3be8c",to:"#d08770"},size:"xl",fw:800,children:"Natural Queries"})]}),e.jsxs(n,{children:[e.jsx(i,{component:l,to:"/playground",variant:r.pathname.startsWith("/playground")?"filled":"light",radius:"md",color:s==="light"?"#5e81ac":"#d08770",children:"Playground Mode"}),e.jsx(i,{component:l,to:"/story",variant:r.pathname.startsWith("/story")?"filled":"light",radius:"md",color:s==="light"?"#5e81ac":"#d08770",children:"Story Mode"}),e.jsx(v,{})]})]})})}function k(){const[o,{toggle:t}]=g();return e.jsxs(a,{header:{height:60},padding:"md",children:[e.jsx(y,{opened:o,toggle:t}),e.jsx(a.Main,{children:e.jsx(x,{})})]})}export{k as AppShellLayout};
