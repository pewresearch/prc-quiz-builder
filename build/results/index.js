(()=>{"use strict";var e,r={9141:()=>{const e=window.wp.blocks,r=window.wp.blockEditor,t=window.ReactJSXRuntime,s=window.prcIcons,o=JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"prc-quiz/results","version":"1.0.0","title":"Results","category":"prc-quiz","attributes":{"allowedBlocks":{"type":"array"},"score":{"type":"string"},"submission":{"type":"string"}},"supports":{"anchor":true,"html":false,"multiple":false,"customClassName":true,"align":["wide","full","center"],"color":{"background":true,"text":true,"link":true},"spacing":{"blockGap":true,"margin":["top","bottom"],"padding":true},"typography":{"fontSize":true,"__experimentalFontFamily":true}},"parent":["prc-quiz/controller"],"usesContext":["prc-quiz/type"],"providesContext":{"prc-quiz/results/score":"score","prc-quiz/results/submissionData":"submission"},"textdomain":"results","editorScript":"file:./index.js","editorStyle":"file:./index.css","style":"file:./style-index.css","render":"file:./render.php"}'),{name:i}=o,n={icon:function({variant:e=""}){return"group"===e?(0,t.jsx)(s.Icon,{icon:"users-viewfinder",library:"solid"}):(0,t.jsx)(s.Icon,{icon:"face-viewfinder",library:"solid"})},edit:function({attributes:e,setAttributes:s,context:o,clientId:i,isSelected:n}){const l=(0,r.useBlockProps)(),{allowedBlocks:c}=e,u=(0,r.useInnerBlocksProps)(l,{allowedBlocks:c||null});return(0,t.jsx)("div",{...u})},save:function({attributes:e}){return(0,t.jsx)(r.InnerBlocks.Content,{})}};(0,e.registerBlockType)(i,{...o,...n})}},t={};function s(e){var o=t[e];if(void 0!==o)return o.exports;var i=t[e]={exports:{}};return r[e](i,i.exports,s),i.exports}s.m=r,e=[],s.O=(r,t,o,i)=>{if(!t){var n=1/0;for(a=0;a<e.length;a++){t=e[a][0],o=e[a][1],i=e[a][2];for(var l=!0,c=0;c<t.length;c++)(!1&i||n>=i)&&Object.keys(s.O).every((e=>s.O[e](t[c])))?t.splice(c--,1):(l=!1,i<n&&(n=i));if(l){e.splice(a--,1);var u=o();void 0!==u&&(r=u)}}return r}i=i||0;for(var a=e.length;a>0&&e[a-1][2]>i;a--)e[a]=e[a-1];e[a]=[t,o,i]},s.o=(e,r)=>Object.prototype.hasOwnProperty.call(e,r),(()=>{var e={950:0,106:0};s.O.j=r=>0===e[r];var r=(r,t)=>{var o,i,n=t[0],l=t[1],c=t[2],u=0;if(n.some((r=>0!==e[r]))){for(o in l)s.o(l,o)&&(s.m[o]=l[o]);if(c)var a=c(s)}for(r&&r(t);u<n.length;u++)i=n[u],s.o(e,i)&&e[i]&&e[i][0](),e[i]=0;return s.O(a)},t=self.webpackChunk_prc_quiz=self.webpackChunk_prc_quiz||[];t.forEach(r.bind(null,0)),t.push=r.bind(null,t.push.bind(t))})();var o=s.O(void 0,[106],(()=>s(9141)));o=s.O(o)})();
//# sourceMappingURL=index.js.map