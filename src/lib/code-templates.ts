import type { MovementPattern, PixelArtData } from "@/lib/types";

const getMinifiedJs = (pixelMap: number[][], palette: Record<string, string>, movement: MovementPattern) => {
  // Use color ID 0 for transparency, don't draw it.
  const code = `
(function(container){
var p=${JSON.stringify(pixelMap)};
var c=${JSON.stringify(palette)};
var m='${movement}';
var gs=16;var ps=16;
var d=document;var w=window;
var cv=d.createElement('canvas');
var ct=cv.getContext('2d');
var cnt=container||d.body;
cv.width=gs*ps;cv.height=gs*ps;
ct.imageSmoothingEnabled=false;
if(!container){
cv.style.position='fixed';cv.style.top='20px';cv.style.left='20px';cv.style.zIndex='9999';cv.style.border='2px solid #333';cv.style.boxShadow='0 5px 15px rgba(0,0,0,0.3)';
cv.style.imageRendering='pixelated';
} else {
cv.style.width='100%';cv.style.height='100%';
cv.style.imageRendering='pixelated';
}
cnt.appendChild(cv);
var f=0;
function dr(){
ct.clearRect(0,0,cv.width,cv.height);
var xo=0;var yo=0;
if(m==='walking'){xo=Math.floor(f/4)%gs}
if(m==='idle'){yo=Math.sin(f*0.05)*2*ps/16}
if(m==='jumping'){yo=Math.abs(Math.sin(f*0.07))*(-gs/2)*ps/16}
for(var y=0;y<gs;y++){
for(var x=0;x<gs;x++){
var col_idx=(x+xo)%gs;
var cid=p[y][col_idx];
if(c[cid]){
ct.fillStyle=c[cid];
ct.fillRect(x*ps,y*ps+yo,ps,ps);
}}}
f++;
w.requestAnimationFrame(dr);
}
dr();
})
`;
  return code.replace(/\s*\n\s*/g, '');
};

export const getFullJsCode = (data: PixelArtData, movement: MovementPattern): string => {
  const minified = getMinifiedJs(data.pixelMap, data.palette, movement);
  return `${minified}();`;
};

export const getBookmarkletCode = (data: PixelArtData, movement: MovementPattern): string => {
  const minified = getMinifiedJs(data.pixelMap, data.palette, movement);
  return `javascript:${encodeURIComponent(`${minified}();`)}`;
};

export const getHtmlEmbedCode = (data: PixelArtData, movement: MovementPattern, previewDataUrl: string): string => {
  const uniqueId = `pixel-art-embed-${Date.now()}`;
  const jsCode = getMinifiedJs(data.pixelMap, data.palette, movement);

  return `
<div id="${uniqueId}" style="cursor: pointer; width: 256px; height: 256px; border: 1px solid #ddd; border-radius: 8px; background-color: #f0f4f8; background-image: url('${previewDataUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center; image-rendering: pixelated;" title="Click to animate"></div>
<script>
  (function() {
    var el = document.getElementById('${uniqueId}');
    if (!el) return;
    el.addEventListener('click', function() {
      this.onclick = null;
      this.style.cursor = 'default';
      this.innerHTML = '';
      (${jsCode})(this);
    }, { once: true });
  })();
</script>
  `.trim();
};
