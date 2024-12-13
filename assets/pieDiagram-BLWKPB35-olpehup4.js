import{p as V}from"./chunk-BAOP5US2-DbfYB33Y.js";import{aF as j,a7 as y,a3 as z,_ as u,l as F,g as U,C as q,G as Z,L as H,f as J,j as K,i as Q,k as X,m as Y,o as tt,p as et,q as at,E as rt}from"./SchemaViewer-C2S0312n.js";import{p as nt}from"./gitGraph-YCYPL57B-DFzQ0lMa.js";import{d as O}from"./arc-CBDCb8tM.js";import{o as it}from"./ordinal-Cboi1Yqb.js";import"./createReactComponent-C9gid5iy.js";import"./mantine-BtBNLNHi.js";import"./index-D830Ub0s.js";import"./react-vendor-C3MGBfbq.js";import"./_baseUniq-Bg6QeDqq.js";import"./_basePickBy-7dIGv6Kq.js";import"./clone-Il7oc0MT.js";import"./init-Gi6I4Gst.js";function ot(t,a){return a<t?-1:a>t?1:a>=t?0:NaN}function st(t){return t}function lt(){var t=st,a=ot,m=null,o=y(0),d=y(z),x=y(0);function i(e){var r,l=(e=j(e)).length,c,A,h=0,p=new Array(l),n=new Array(l),v=+o.apply(this,arguments),w=Math.min(z,Math.max(-z,d.apply(this,arguments)-v)),f,T=Math.min(Math.abs(w)/l,x.apply(this,arguments)),$=T*(w<0?-1:1),g;for(r=0;r<l;++r)(g=n[p[r]=r]=+t(e[r],r,e))>0&&(h+=g);for(a!=null?p.sort(function(S,C){return a(n[S],n[C])}):m!=null&&p.sort(function(S,C){return m(e[S],e[C])}),r=0,A=h?(w-l*$)/h:0;r<l;++r,v=f)c=p[r],g=n[c],f=v+(g>0?g*A:0)+$,n[c]={data:e[c],index:r,value:g,startAngle:v,endAngle:f,padAngle:T};return n}return i.value=function(e){return arguments.length?(t=typeof e=="function"?e:y(+e),i):t},i.sortValues=function(e){return arguments.length?(a=e,m=null,i):a},i.sort=function(e){return arguments.length?(m=e,a=null,i):m},i.startAngle=function(e){return arguments.length?(o=typeof e=="function"?e:y(+e),i):o},i.endAngle=function(e){return arguments.length?(d=typeof e=="function"?e:y(+e),i):d},i.padAngle=function(e){return arguments.length?(x=typeof e=="function"?e:y(+e),i):x},i}var ct=rt.pie,G={sections:new Map,showData:!1},M=G.sections,W=G.showData,pt=structuredClone(ct),ut=u(()=>structuredClone(pt),"getConfig"),dt=u(()=>{M=new Map,W=G.showData,at()},"clear"),gt=u(({label:t,value:a})=>{M.has(t)||(M.set(t,a),F.debug(`added new section: ${t}, with value: ${a}`))},"addSection"),ft=u(()=>M,"getSections"),mt=u(t=>{W=t},"setShowData"),ht=u(()=>W,"getShowData"),P={getConfig:ut,clear:dt,setDiagramTitle:et,getDiagramTitle:tt,setAccTitle:Y,getAccTitle:X,setAccDescription:Q,getAccDescription:K,addSection:gt,getSections:ft,setShowData:mt,getShowData:ht},vt=u((t,a)=>{V(t,a),a.setShowData(t.showData),t.sections.map(a.addSection)},"populateDb"),St={parse:u(async t=>{const a=await nt("pie",t);F.debug(a),vt(a,P)},"parse")},yt=u(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${t.pieOuterStrokeColor};
    stroke-width: ${t.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${t.pieTitleTextSize};
    fill: ${t.pieTitleTextColor};
    font-family: ${t.fontFamily};
  }
  .slice {
    font-family: ${t.fontFamily};
    fill: ${t.pieSectionTextColor};
    font-size:${t.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${t.pieLegendTextColor};
    font-family: ${t.fontFamily};
    font-size: ${t.pieLegendTextSize};
  }
`,"getStyles"),xt=yt,At=u(t=>{const a=[...t.entries()].map(o=>({label:o[0],value:o[1]})).sort((o,d)=>d.value-o.value);return lt().value(o=>o.value)(a)},"createPieArcs"),wt=u((t,a,m,o)=>{F.debug(`rendering pie chart
`+t);const d=o.db,x=U(),i=q(d.getConfig(),x.pie),e=40,r=18,l=4,c=450,A=c,h=Z(a),p=h.append("g");p.attr("transform","translate("+A/2+","+c/2+")");const{themeVariables:n}=x;let[v]=H(n.pieOuterStrokeWidth);v??=2;const w=i.textPosition,f=Math.min(A,c)/2-e,T=O().innerRadius(0).outerRadius(f),$=O().innerRadius(f*w).outerRadius(f*w);p.append("circle").attr("cx",0).attr("cy",0).attr("r",f+v/2).attr("class","pieOuterCircle");const g=d.getSections(),S=At(g),C=[n.pie1,n.pie2,n.pie3,n.pie4,n.pie5,n.pie6,n.pie7,n.pie8,n.pie9,n.pie10,n.pie11,n.pie12],D=it(C);p.selectAll("mySlices").data(S).enter().append("path").attr("d",T).attr("fill",s=>D(s.data.label)).attr("class","pieCircle");let L=0;g.forEach(s=>{L+=s}),p.selectAll("mySlices").data(S).enter().append("text").text(s=>(s.data.value/L*100).toFixed(0)+"%").attr("transform",s=>"translate("+$.centroid(s)+")").style("text-anchor","middle").attr("class","slice"),p.append("text").text(d.getDiagramTitle()).attr("x",0).attr("y",-(c-50)/2).attr("class","pieTitleText");const b=p.selectAll(".legend").data(D.domain()).enter().append("g").attr("class","legend").attr("transform",(s,k)=>{const E=r+l,I=E*D.domain().length/2,_=12*r,B=k*E-I;return"translate("+_+","+B+")"});b.append("rect").attr("width",r).attr("height",r).style("fill",D).style("stroke",D),b.data(S).append("text").attr("x",r+l).attr("y",r-l).text(s=>{const{label:k,value:E}=s.data;return d.getShowData()?`${k} [${E}]`:k});const R=Math.max(...b.selectAll("text").nodes().map(s=>s?.getBoundingClientRect().width??0)),N=A+e+r+l+R;h.attr("viewBox",`0 0 ${N} ${c}`),J(h,c,N,i.useMaxWidth)},"draw"),Ct={draw:wt},Ot={parser:St,db:P,renderer:Ct,styles:xt};export{Ot as diagram};
