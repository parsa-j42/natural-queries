import{_ as s,T as xt,U as kt,V as vt,g as _t,l as E,s as j,W as bt,X as wt,Y as St,q as Et}from"./SchemaViewer-C2S0312n.js";import{d as nt}from"./arc-CBDCb8tM.js";import"./createReactComponent-C9gid5iy.js";import"./mantine-BtBNLNHi.js";import"./index-D830Ub0s.js";import"./react-vendor-C3MGBfbq.js";var Q=function(){var n=s(function(x,i,a,c){for(a=a||{},c=x.length;c--;a[x[c]]=i);return a},"o"),t=[6,8,10,11,12,14,16,17,20,21],e=[1,9],l=[1,10],r=[1,11],d=[1,12],h=[1,13],f=[1,16],m=[1,17],u={trace:s(function(){},"trace"),yy:{},symbols_:{error:2,start:3,timeline:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,period_statement:18,event_statement:19,period:20,event:21,$accept:0,$end:1},terminals_:{2:"error",4:"timeline",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",20:"period",21:"event"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,1],[18,1],[19,1]],performAction:s(function(i,a,c,p,y,o,w){var v=o.length-1;switch(y){case 1:return o[v-1];case 2:this.$=[];break;case 3:o[v-1].push(o[v]),this.$=o[v-1];break;case 4:case 5:this.$=o[v];break;case 6:case 7:this.$=[];break;case 8:p.getCommonDb().setDiagramTitle(o[v].substr(6)),this.$=o[v].substr(6);break;case 9:this.$=o[v].trim(),p.getCommonDb().setAccTitle(this.$);break;case 10:case 11:this.$=o[v].trim(),p.getCommonDb().setAccDescription(this.$);break;case 12:p.addSection(o[v].substr(8)),this.$=o[v].substr(8);break;case 15:p.addTask(o[v],0,""),this.$=o[v];break;case 16:p.addEvent(o[v].substr(2)),this.$=o[v];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},n(t,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:e,12:l,14:r,16:d,17:h,18:14,19:15,20:f,21:m},n(t,[2,7],{1:[2,1]}),n(t,[2,3]),{9:18,11:e,12:l,14:r,16:d,17:h,18:14,19:15,20:f,21:m},n(t,[2,5]),n(t,[2,6]),n(t,[2,8]),{13:[1,19]},{15:[1,20]},n(t,[2,11]),n(t,[2,12]),n(t,[2,13]),n(t,[2,14]),n(t,[2,15]),n(t,[2,16]),n(t,[2,4]),n(t,[2,9]),n(t,[2,10])],defaultActions:{},parseError:s(function(i,a){if(a.recoverable)this.trace(i);else{var c=new Error(i);throw c.hash=a,c}},"parseError"),parse:s(function(i){var a=this,c=[0],p=[],y=[null],o=[],w=this.table,v="",N=0,A=0,z=2,U=1,$=o.slice.call(arguments,1),g=Object.create(this.lexer),b={yy:{}};for(var L in this.yy)Object.prototype.hasOwnProperty.call(this.yy,L)&&(b.yy[L]=this.yy[L]);g.setInput(i,b.yy),b.yy.lexer=g,b.yy.parser=this,typeof g.yylloc>"u"&&(g.yylloc={});var P=g.yylloc;o.push(P);var W=g.options&&g.options.ranges;typeof b.yy.parseError=="function"?this.parseError=b.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Z(T){c.length=c.length-2*T,y.length=y.length-T,o.length=o.length-T}s(Z,"popStack");function tt(){var T;return T=p.pop()||g.lex()||U,typeof T!="number"&&(T instanceof Array&&(p=T,T=p.pop()),T=a.symbols_[T]||T),T}s(tt,"lex");for(var S,C,I,J,R={},B,M,et,O;;){if(C=c[c.length-1],this.defaultActions[C]?I=this.defaultActions[C]:((S===null||typeof S>"u")&&(S=tt()),I=w[C]&&w[C][S]),typeof I>"u"||!I.length||!I[0]){var K="";O=[];for(B in w[C])this.terminals_[B]&&B>z&&O.push("'"+this.terminals_[B]+"'");g.showPosition?K="Parse error on line "+(N+1)+`:
`+g.showPosition()+`
Expecting `+O.join(", ")+", got '"+(this.terminals_[S]||S)+"'":K="Parse error on line "+(N+1)+": Unexpected "+(S==U?"end of input":"'"+(this.terminals_[S]||S)+"'"),this.parseError(K,{text:g.match,token:this.terminals_[S]||S,line:g.yylineno,loc:P,expected:O})}if(I[0]instanceof Array&&I.length>1)throw new Error("Parse Error: multiple actions possible at state: "+C+", token: "+S);switch(I[0]){case 1:c.push(S),y.push(g.yytext),o.push(g.yylloc),c.push(I[1]),S=null,A=g.yyleng,v=g.yytext,N=g.yylineno,P=g.yylloc;break;case 2:if(M=this.productions_[I[1]][1],R.$=y[y.length-M],R._$={first_line:o[o.length-(M||1)].first_line,last_line:o[o.length-1].last_line,first_column:o[o.length-(M||1)].first_column,last_column:o[o.length-1].last_column},W&&(R._$.range=[o[o.length-(M||1)].range[0],o[o.length-1].range[1]]),J=this.performAction.apply(R,[v,A,N,b.yy,I[1],y,o].concat($)),typeof J<"u")return J;M&&(c=c.slice(0,-1*M*2),y=y.slice(0,-1*M),o=o.slice(0,-1*M)),c.push(this.productions_[I[1]][0]),y.push(R.$),o.push(R._$),et=w[c[c.length-2]][c[c.length-1]],c.push(et);break;case 3:return!0}}return!0},"parse")},k=function(){var x={EOF:1,parseError:s(function(a,c){if(this.yy.parser)this.yy.parser.parseError(a,c);else throw new Error(a)},"parseError"),setInput:s(function(i,a){return this.yy=a||this.yy||{},this._input=i,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:s(function(){var i=this._input[0];this.yytext+=i,this.yyleng++,this.offset++,this.match+=i,this.matched+=i;var a=i.match(/(?:\r\n?|\n).*/g);return a?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),i},"input"),unput:s(function(i){var a=i.length,c=i.split(/(?:\r\n?|\n)/g);this._input=i+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-a),this.offset-=a;var p=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),c.length-1&&(this.yylineno-=c.length-1);var y=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:c?(c.length===p.length?this.yylloc.first_column:0)+p[p.length-c.length].length-c[0].length:this.yylloc.first_column-a},this.options.ranges&&(this.yylloc.range=[y[0],y[0]+this.yyleng-a]),this.yyleng=this.yytext.length,this},"unput"),more:s(function(){return this._more=!0,this},"more"),reject:s(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:s(function(i){this.unput(this.match.slice(i))},"less"),pastInput:s(function(){var i=this.matched.substr(0,this.matched.length-this.match.length);return(i.length>20?"...":"")+i.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:s(function(){var i=this.match;return i.length<20&&(i+=this._input.substr(0,20-i.length)),(i.substr(0,20)+(i.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:s(function(){var i=this.pastInput(),a=new Array(i.length+1).join("-");return i+this.upcomingInput()+`
`+a+"^"},"showPosition"),test_match:s(function(i,a){var c,p,y;if(this.options.backtrack_lexer&&(y={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(y.yylloc.range=this.yylloc.range.slice(0))),p=i[0].match(/(?:\r\n?|\n).*/g),p&&(this.yylineno+=p.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:p?p[p.length-1].length-p[p.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+i[0].length},this.yytext+=i[0],this.match+=i[0],this.matches=i,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(i[0].length),this.matched+=i[0],c=this.performAction.call(this,this.yy,this,a,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),c)return c;if(this._backtrack){for(var o in y)this[o]=y[o];return!1}return!1},"test_match"),next:s(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var i,a,c,p;this._more||(this.yytext="",this.match="");for(var y=this._currentRules(),o=0;o<y.length;o++)if(c=this._input.match(this.rules[y[o]]),c&&(!a||c[0].length>a[0].length)){if(a=c,p=o,this.options.backtrack_lexer){if(i=this.test_match(c,y[o]),i!==!1)return i;if(this._backtrack){a=!1;continue}else return!1}else if(!this.options.flex)break}return a?(i=this.test_match(a,y[p]),i!==!1?i:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:s(function(){var a=this.next();return a||this.lex()},"lex"),begin:s(function(a){this.conditionStack.push(a)},"begin"),popState:s(function(){var a=this.conditionStack.length-1;return a>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:s(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:s(function(a){return a=this.conditionStack.length-1-Math.abs(a||0),a>=0?this.conditionStack[a]:"INITIAL"},"topState"),pushState:s(function(a){this.begin(a)},"pushState"),stateStackSize:s(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:s(function(a,c,p,y){switch(p){case 0:break;case 1:break;case 2:return 10;case 3:break;case 4:break;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;case 8:return this.popState(),"acc_title_value";case 9:return this.begin("acc_descr"),14;case 10:return this.popState(),"acc_descr_value";case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 21;case 16:return 20;case 17:return 6;case 18:return"INVALID"}},"anonymous"),rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:timeline\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^:\n]+)/i,/^(?::\s[^:\n]+)/i,/^(?:[^#:\n]+)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18],inclusive:!0}}};return x}();u.lexer=k;function _(){this.yy={}}return s(_,"Parser"),_.prototype=u,u.Parser=_,new _}();Q.parser=Q;var Tt=Q,at={};wt(at,{addEvent:()=>yt,addSection:()=>ht,addTask:()=>pt,addTaskOrg:()=>gt,clear:()=>ct,default:()=>It,getCommonDb:()=>ot,getSections:()=>dt,getTasks:()=>ut});var F="",lt=0,X=[],G=[],V=[],ot=s(()=>St,"getCommonDb"),ct=s(function(){X.length=0,G.length=0,F="",V.length=0,Et()},"clear"),ht=s(function(n){F=n,X.push(n)},"addSection"),dt=s(function(){return X},"getSections"),ut=s(function(){let n=rt();const t=100;let e=0;for(;!n&&e<t;)n=rt(),e++;return G.push(...V),G},"getTasks"),pt=s(function(n,t,e){const l={id:lt++,section:F,type:F,task:n,score:t||0,events:e?[e]:[]};V.push(l)},"addTask"),yt=s(function(n){V.find(e=>e.id===lt-1).events.push(n)},"addEvent"),gt=s(function(n){const t={section:F,type:F,description:n,task:n,classes:[]};G.push(t)},"addTaskOrg"),rt=s(function(){const n=s(function(e){return V[e].processed},"compileTask");let t=!0;for(const[e,l]of V.entries())n(e),t=t&&l.processed;return t},"compileTasks"),It={clear:ct,getCommonDb:ot,addSection:ht,getSections:dt,getTasks:ut,addTask:pt,addTaskOrg:gt,addEvent:yt},Nt=12,q=s(function(n,t){const e=n.append("rect");return e.attr("x",t.x),e.attr("y",t.y),e.attr("fill",t.fill),e.attr("stroke",t.stroke),e.attr("width",t.width),e.attr("height",t.height),e.attr("rx",t.rx),e.attr("ry",t.ry),t.class!==void 0&&e.attr("class",t.class),e},"drawRect"),Lt=s(function(n,t){const l=n.append("circle").attr("cx",t.cx).attr("cy",t.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),r=n.append("g");r.append("circle").attr("cx",t.cx-15/3).attr("cy",t.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),r.append("circle").attr("cx",t.cx+15/3).attr("cy",t.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666");function d(m){const u=nt().startAngle(Math.PI/2).endAngle(3*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);m.append("path").attr("class","mouth").attr("d",u).attr("transform","translate("+t.cx+","+(t.cy+2)+")")}s(d,"smile");function h(m){const u=nt().startAngle(3*Math.PI/2).endAngle(5*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);m.append("path").attr("class","mouth").attr("d",u).attr("transform","translate("+t.cx+","+(t.cy+7)+")")}s(h,"sad");function f(m){m.append("line").attr("class","mouth").attr("stroke",2).attr("x1",t.cx-5).attr("y1",t.cy+7).attr("x2",t.cx+5).attr("y2",t.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666")}return s(f,"ambivalent"),t.score>3?d(r):t.score<3?h(r):f(r),l},"drawFace"),Mt=s(function(n,t){const e=n.append("circle");return e.attr("cx",t.cx),e.attr("cy",t.cy),e.attr("class","actor-"+t.pos),e.attr("fill",t.fill),e.attr("stroke",t.stroke),e.attr("r",t.r),e.class!==void 0&&e.attr("class",e.class),t.title!==void 0&&e.append("title").text(t.title),e},"drawCircle"),ft=s(function(n,t){const e=t.text.replace(/<br\s*\/?>/gi," "),l=n.append("text");l.attr("x",t.x),l.attr("y",t.y),l.attr("class","legend"),l.style("text-anchor",t.anchor),t.class!==void 0&&l.attr("class",t.class);const r=l.append("tspan");return r.attr("x",t.x+t.textMargin*2),r.text(e),l},"drawText"),$t=s(function(n,t){function e(r,d,h,f,m){return r+","+d+" "+(r+h)+","+d+" "+(r+h)+","+(d+f-m)+" "+(r+h-m*1.2)+","+(d+f)+" "+r+","+(d+f)}s(e,"genPoints");const l=n.append("polygon");l.attr("points",e(t.x,t.y,50,20,7)),l.attr("class","labelBox"),t.y=t.y+t.labelMargin,t.x=t.x+.5*t.labelMargin,ft(n,t)},"drawLabel"),Pt=s(function(n,t,e){const l=n.append("g"),r=Y();r.x=t.x,r.y=t.y,r.fill=t.fill,r.width=e.width,r.height=e.height,r.class="journey-section section-type-"+t.num,r.rx=3,r.ry=3,q(l,r),mt(e)(t.text,l,r.x,r.y,r.width,r.height,{class:"journey-section section-type-"+t.num},e,t.colour)},"drawSection"),it=-1,At=s(function(n,t,e){const l=t.x+e.width/2,r=n.append("g");it++;const d=300+5*30;r.append("line").attr("id","task"+it).attr("x1",l).attr("y1",t.y).attr("x2",l).attr("y2",d).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),Lt(r,{cx:l,cy:300+(5-t.score)*30,score:t.score});const h=Y();h.x=t.x,h.y=t.y,h.fill=t.fill,h.width=e.width,h.height=e.height,h.class="task task-type-"+t.num,h.rx=3,h.ry=3,q(r,h),mt(e)(t.task,r,h.x,h.y,h.width,h.height,{class:"task"},e,t.colour)},"drawTask"),Ct=s(function(n,t){q(n,{x:t.startx,y:t.starty,width:t.stopx-t.startx,height:t.stopy-t.starty,fill:t.fill,class:"rect"}).lower()},"drawBackgroundRect"),Ht=s(function(){return{x:0,y:0,fill:void 0,"text-anchor":"start",width:100,height:100,textMargin:0,rx:0,ry:0}},"getTextObj"),Y=s(function(){return{x:0,y:0,width:100,anchor:"start",height:100,rx:0,ry:0}},"getNoteRect"),mt=function(){function n(r,d,h,f,m,u,k,_){const x=d.append("text").attr("x",h+m/2).attr("y",f+u/2+5).style("font-color",_).style("text-anchor","middle").text(r);l(x,k)}s(n,"byText");function t(r,d,h,f,m,u,k,_,x){const{taskFontSize:i,taskFontFamily:a}=_,c=r.split(/<br\s*\/?>/gi);for(let p=0;p<c.length;p++){const y=p*i-i*(c.length-1)/2,o=d.append("text").attr("x",h+m/2).attr("y",f).attr("fill",x).style("text-anchor","middle").style("font-size",i).style("font-family",a);o.append("tspan").attr("x",h+m/2).attr("dy",y).text(c[p]),o.attr("y",f+u/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),l(o,k)}}s(t,"byTspan");function e(r,d,h,f,m,u,k,_){const x=d.append("switch"),a=x.append("foreignObject").attr("x",h).attr("y",f).attr("width",m).attr("height",u).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");a.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(r),t(r,x,h,f,m,u,k,_),l(a,k)}s(e,"byFo");function l(r,d){for(const h in d)h in d&&r.attr(h,d[h])}return s(l,"_setTextAttrs"),function(r){return r.textPlacement==="fo"?e:r.textPlacement==="old"?n:t}}(),Rt=s(function(n){n.append("defs").append("marker").attr("id","arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z")},"initGraphics");function D(n,t){n.each(function(){var e=j(this),l=e.text().split(/(\s+|<br>)/).reverse(),r,d=[],h=1.1,f=e.attr("y"),m=parseFloat(e.attr("dy")),u=e.text(null).append("tspan").attr("x",0).attr("y",f).attr("dy",m+"em");for(let k=0;k<l.length;k++)r=l[l.length-1-k],d.push(r),u.text(d.join(" ").trim()),(u.node().getComputedTextLength()>t||r==="<br>")&&(d.pop(),u.text(d.join(" ").trim()),r==="<br>"?d=[""]:d=[r],u=e.append("tspan").attr("x",0).attr("y",f).attr("dy",h+"em").text(r))})}s(D,"wrap");var Ft=s(function(n,t,e,l){const r=e%Nt-1,d=n.append("g");t.section=r,d.attr("class",(t.class?t.class+" ":"")+"timeline-node "+("section-"+r));const h=d.append("g"),f=d.append("g"),u=f.append("text").text(t.descr).attr("dy","1em").attr("alignment-baseline","middle").attr("dominant-baseline","middle").attr("text-anchor","middle").call(D,t.width).node().getBBox(),k=l.fontSize?.replace?l.fontSize.replace("px",""):l.fontSize;return t.height=u.height+k*1.1*.5+t.padding,t.height=Math.max(t.height,t.maxHeight),t.width=t.width+2*t.padding,f.attr("transform","translate("+t.width/2+", "+t.padding/2+")"),zt(h,t,r,l),t},"drawNode"),Vt=s(function(n,t,e){const l=n.append("g"),d=l.append("text").text(t.descr).attr("dy","1em").attr("alignment-baseline","middle").attr("dominant-baseline","middle").attr("text-anchor","middle").call(D,t.width).node().getBBox(),h=e.fontSize?.replace?e.fontSize.replace("px",""):e.fontSize;return l.remove(),d.height+h*1.1*.5+t.padding},"getVirtualNodeHeight"),zt=s(function(n,t,e){n.append("path").attr("id","node-"+t.id).attr("class","node-bkg node-"+t.type).attr("d",`M0 ${t.height-5} v${-t.height+2*5} q0,-5 5,-5 h${t.width-2*5} q5,0 5,5 v${t.height-5} H0 Z`),n.append("line").attr("class","node-line-"+e).attr("x1",0).attr("y1",t.height).attr("x2",t.width).attr("y2",t.height)},"defaultBkg"),H={drawRect:q,drawCircle:Mt,drawSection:Pt,drawText:ft,drawLabel:$t,drawTask:At,drawBackgroundRect:Ct,getTextObj:Ht,getNoteRect:Y,initGraphics:Rt,drawNode:Ft,getVirtualNodeHeight:Vt},Wt=s(function(n,t,e,l){const r=_t(),d=r.leftMargin??50;E.debug("timeline",l.db);const h=r.securityLevel;let f;h==="sandbox"&&(f=j("#i"+t));const u=(h==="sandbox"?j(f.nodes()[0].contentDocument.body):j("body")).select("#"+t);u.append("g");const k=l.db.getTasks(),_=l.db.getCommonDb().getDiagramTitle();E.debug("task",k),H.initGraphics(u);const x=l.db.getSections();E.debug("sections",x);let i=0,a=0,c=0,p=0,y=50+d,o=50;p=50;let w=0,v=!0;x.forEach(function($){const g={number:w,descr:$,section:w,width:150,padding:20,maxHeight:i},b=H.getVirtualNodeHeight(u,g,r);E.debug("sectionHeight before draw",b),i=Math.max(i,b+20)});let N=0,A=0;E.debug("tasks.length",k.length);for(const[$,g]of k.entries()){const b={number:$,descr:g,section:g.section,width:150,padding:20,maxHeight:a},L=H.getVirtualNodeHeight(u,b,r);E.debug("taskHeight before draw",L),a=Math.max(a,L+20),N=Math.max(N,g.events.length);let P=0;for(const W of g.events){const Z={descr:W,section:g.section,number:g.section,width:150,padding:20,maxHeight:50};P+=H.getVirtualNodeHeight(u,Z,r)}A=Math.max(A,P)}E.debug("maxSectionHeight before draw",i),E.debug("maxTaskHeight before draw",a),x&&x.length>0?x.forEach($=>{const g=k.filter(W=>W.section===$),b={number:w,descr:$,section:w,width:200*Math.max(g.length,1)-50,padding:20,maxHeight:i};E.debug("sectionNode",b);const L=u.append("g"),P=H.drawNode(L,b,w,r);E.debug("sectionNode output",P),L.attr("transform",`translate(${y}, ${p})`),o+=i+50,g.length>0&&st(u,g,w,y,o,a,r,N,A,i,!1),y+=200*Math.max(g.length,1),o=p,w++}):(v=!1,st(u,k,w,y,o,a,r,N,A,i,!0));const z=u.node().getBBox();E.debug("bounds",z),_&&u.append("text").text(_).attr("x",z.width/2-d).attr("font-size","4ex").attr("font-weight","bold").attr("y",20),c=v?i+a+150:a+100,u.append("g").attr("class","lineWrapper").append("line").attr("x1",d).attr("y1",c).attr("x2",z.width+3*d).attr("y2",c).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#arrowhead)"),bt(void 0,u,r.timeline?.padding??50,r.timeline?.useMaxWidth??!1)},"draw"),st=s(function(n,t,e,l,r,d,h,f,m,u,k){for(const _ of t){const x={descr:_.task,section:e,number:e,width:150,padding:20,maxHeight:d};E.debug("taskNode",x);const i=n.append("g").attr("class","taskWrapper"),c=H.drawNode(i,x,e,h).height;if(E.debug("taskHeight after draw",c),i.attr("transform",`translate(${l}, ${r})`),d=Math.max(d,c),_.events){const p=n.append("g").attr("class","lineWrapper");let y=d;r+=100,y=y+Bt(n,_.events,e,l,r,h),r-=100,p.append("line").attr("x1",l+190/2).attr("y1",r+d).attr("x2",l+190/2).attr("y2",r+d+(k?d:u)+m+120).attr("stroke-width",2).attr("stroke","black").attr("marker-end","url(#arrowhead)").attr("stroke-dasharray","5,5")}l=l+200,k&&!h.timeline?.disableMulticolor&&e++}r=r-10},"drawTasks"),Bt=s(function(n,t,e,l,r,d){let h=0;const f=r;r=r+100;for(const m of t){const u={descr:m,section:e,number:e,width:150,padding:20,maxHeight:50};E.debug("eventNode",u);const k=n.append("g").attr("class","eventWrapper"),x=H.drawNode(k,u,e,d).height;h=h+x,k.attr("transform",`translate(${l}, ${r})`),r=r+10+x}return r=f,h},"drawEvents"),Ot={setConf:s(()=>{},"setConf"),draw:Wt},jt=s(n=>{let t="";for(let e=0;e<n.THEME_COLOR_LIMIT;e++)n["lineColor"+e]=n["lineColor"+e]||n["cScaleInv"+e],xt(n["lineColor"+e])?n["lineColor"+e]=kt(n["lineColor"+e],20):n["lineColor"+e]=vt(n["lineColor"+e],20);for(let e=0;e<n.THEME_COLOR_LIMIT;e++){const l=""+(17-3*e);t+=`
    .section-${e-1} rect, .section-${e-1} path, .section-${e-1} circle, .section-${e-1} path  {
      fill: ${n["cScale"+e]};
    }
    .section-${e-1} text {
     fill: ${n["cScaleLabel"+e]};
    }
    .node-icon-${e-1} {
      font-size: 40px;
      color: ${n["cScaleLabel"+e]};
    }
    .section-edge-${e-1}{
      stroke: ${n["cScale"+e]};
    }
    .edge-depth-${e-1}{
      stroke-width: ${l};
    }
    .section-${e-1} line {
      stroke: ${n["cScaleInv"+e]} ;
      stroke-width: 3;
    }

    .lineWrapper line{
      stroke: ${n["cScaleLabel"+e]} ;
    }

    .disabled, .disabled circle, .disabled text {
      fill: lightgray;
    }
    .disabled text {
      fill: #efefef;
    }
    `}return t},"genSections"),Gt=s(n=>`
  .edge {
    stroke-width: 3;
  }
  ${jt(n)}
  .section-root rect, .section-root path, .section-root circle  {
    fill: ${n.git0};
  }
  .section-root text {
    fill: ${n.gitBranchLabel0};
  }
  .icon-container {
    height:100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .edge {
    fill: none;
  }
  .eventWrapper  {
   filter: brightness(120%);
  }
`,"getStyles"),qt=Gt,Yt={db:at,renderer:Ot,parser:Tt,styles:qt};export{Yt as diagram};
