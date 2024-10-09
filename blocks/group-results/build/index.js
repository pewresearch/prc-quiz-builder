(()=>{"use strict";var e,r={317:()=>{window.wp.i18n;const e=window.wp.blocks,r=window.wp.blockEditor,t=window.ReactJSXRuntime,o=window.prcIcons,s=JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":2,"name":"prc-quiz/group-results","version":"0.1.0","title":"Group Results","description":"Results for a community group as given by group id and archetype hash id","category":"text","attributes":{"allowedBlocks":{"type":"array"},"name":{"type":"string"},"total":{"type":"integer"},"typologyGroups":{"type":"string"},"answers":{"type":"string"}},"supports":{"anchor":true,"html":false,"multiple":false,"color":{"background":true,"text":true,"link":true},"spacing":{"blockGap":true,"margin":["top","bottom"],"padding":true},"typography":{"fontSize":true,"__experimentalFontFamily":true}},"parent":["prc-quiz/controller"],"providesContext":{"prc-quiz/groups/results/name":"name","prc-quiz/groups/results/typologyGroups":"typologyGroups","prc-quiz/groups/results/answers":"answers","prc-quiz/groups/results/total":"total"},"textdomain":"group-results","editorScript":"file:./index.js","editorStyle":"file:./index.css","style":"file:./style-index.css","render":"file:./render.php"}'),{name:n}=s,i={icon:function(){return(0,t.jsx)(o.Icon,{icon:"users-viewfinder"})},edit:function({attributes:e,setAttributes:o,context:s,clientId:n,isSelected:i}){const p=(0,r.useBlockProps)(),{allowedBlocks:u}=e,l=(0,r.useInnerBlocksProps)(p,{allowedBlocks:u});return(0,t.jsx)("div",{...l})},save:function({attributes:e}){return(0,t.jsx)(r.InnerBlocks.Content,{})}};(0,e.registerBlockType)(n,{...s,...i})}},t={};function o(e){var s=t[e];if(void 0!==s)return s.exports;var n=t[e]={exports:{}};return r[e](n,n.exports,o),n.exports}o.m=r,e=[],o.O=(r,t,s,n)=>{if(!t){var i=1/0;for(a=0;a<e.length;a++){t=e[a][0],s=e[a][1],n=e[a][2];for(var p=!0,u=0;u<t.length;u++)(!1&n||i>=n)&&Object.keys(o.O).every((e=>o.O[e](t[u])))?t.splice(u--,1):(p=!1,n<i&&(i=n));if(p){e.splice(a--,1);var l=s();void 0!==l&&(r=l)}}return r}n=n||0;for(var a=e.length;a>0&&e[a-1][2]>n;a--)e[a]=e[a-1];e[a]=[t,s,n]},o.o=(e,r)=>Object.prototype.hasOwnProperty.call(e,r),(()=>{var e={57:0,350:0};o.O.j=r=>0===e[r];var r=(r,t)=>{var s,n,i=t[0],p=t[1],u=t[2],l=0;if(i.some((r=>0!==e[r]))){for(s in p)o.o(p,s)&&(o.m[s]=p[s]);if(u)var a=u(o)}for(r&&r(t);l<i.length;l++)n=i[l],o.o(e,n)&&e[n]&&e[n][0](),e[n]=0;return o.O(a)},t=self.webpackChunkgroup_results=self.webpackChunkgroup_results||[];t.forEach(r.bind(null,0)),t.push=r.bind(null,t.push.bind(t))})();var s=o.O(void 0,[350],(()=>o(317)));s=o.O(s)})();
//# sourceMappingURL=index.js.map