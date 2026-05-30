import{X as l,J as e,j as n,a as h,c as a,d as u,u as m,f as i,W as g}from"./mantine-CJTIAtuL.js";import{u as p,L as c,O as x}from"./react-vendor-Cuxx6LVD.js";import{c as d}from"./createReactComponent-BMq2117v.js";/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008",key:"svg-0"}]],f=d("outline","moon","Moon",j);/**
 * @license @tabler/icons-react v3.44.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["path",{d:"M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",key:"svg-0"}],["path",{d:"M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",key:"svg-1"}]],y=d("outline","sun","Sun",v);function S(){const{colorScheme:o,toggleColorScheme:t}=l();return e.jsx(n,{children:e.jsx(h,{onClick:()=>t(),color:o==="light"?"#5e81ac":"#ebcb8b",variant:"subtle",radius:"xl",size:36,children:o==="light"?e.jsx(f,{size:24}):e.jsx(y,{size:24})})})}function M({opened:o,toggle:t}){const r=p(),{colorScheme:s}=l();return e.jsx(a.Header,{bg:s==="light"?"#e5e9f0":"#3b4252",children:e.jsxs(n,{h:"100%",px:"md",justify:"space-between",children:[e.jsxs(n,{children:[e.jsx(u,{src:"favicon.jpeg",alt:"Logo",radius:"sm"}),e.jsx(m,{variant:"gradient",component:"span",gradient:{from:"#a3be8c",to:"#d08770"},size:"xl",fw:800,children:"Natural Queries"})]}),e.jsxs(n,{children:[e.jsx(i,{component:c,to:"/playground",variant:r.pathname.startsWith("/playground")?"filled":"light",radius:"md",color:s==="light"?"#5e81ac":"#d08770",children:"Playground Mode"}),e.jsx(i,{component:c,to:"/story",variant:r.pathname.startsWith("/story")?"filled":"light",radius:"md",color:s==="light"?"#5e81ac":"#d08770",children:"Story Mode"}),e.jsx(S,{})]})]})})}function L(){const[o,{toggle:t}]=g();return e.jsxs(a,{header:{height:60},padding:"md",children:[e.jsx(M,{opened:o,toggle:t}),e.jsx(a.Main,{children:e.jsx(x,{})})]})}export{L as AppShellLayout};
