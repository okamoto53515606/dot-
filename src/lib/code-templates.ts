import type { PixelArtData, MovementPattern } from './types';

const generateJavascriptCode = (pixelArt: PixelArtData, movement: MovementPattern): string => {
  const gridSize = 16;
  const pixelSize = 3;
  
  // This script is now designed to be directly embedded in a <script> tag.
  const scriptContent = `
    (function() {
      const id = 'pixel-art-animation-from-script';
      let el = document.getElementById(id);
      if (el) { el.remove(); } // Clean up previous instances

      const c = ${JSON.stringify(pixelArt.palette)};
      const p = ${JSON.stringify(pixelArt.pixelMap)};
      const m = '${movement}';
      const gs = ${gridSize};
      const ps = ${pixelSize};
      const canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.width = gs;
      canvas.height = gs;
      const ctx = canvas.getContext('2d');
      const characterWidth = gs * ps;

      Object.assign(canvas.style, {
          position: 'fixed',
          bottom: '10px',
          left: '0px',
          zIndex: '9999999',
          width: characterWidth + 'px',
          height: (gs * ps) + 'px',
          imageRendering: 'pixelated',
          pointerEvents: 'none',
      });

      document.body.appendChild(canvas);

      for (let y = 0; y < gs; y++) {
          for (let x = 0; x < gs; x++) {
              const colorId = p[y] && p[y][x] ? p[y][x] : 0;
              if (colorId !== 0 && c[colorId]) {
                  ctx.fillStyle = c[colorId];
                  ctx.fillRect(x, y, 1, 1);
              }
          }
      }

      let f = 0;
      let xPos = 0;
      let direction = 1;

      function animate() {
          if (m === 'walking') {
            xPos += 2 * direction;
            if (xPos + characterWidth >= window.innerWidth && direction === 1) {
              direction = -1;
            } else if (xPos <= 0 && direction === -1) {
              direction = 1;
            }
          } else {
            // Non-walking animations just traverse the screen and loop
            xPos += 2;
            if (xPos > window.innerWidth) {
                xPos = -characterWidth;
            }
          }
          
          let bounce = 0;
          if (m === 'jumping') {
              bounce = Math.abs(Math.sin(f * 0.07)) * 60;
          } else if (m === 'idle') {
              bounce = Math.sin(f * 0.05) * 20;
          } else if (m === 'walking') {
              bounce = Math.abs(Math.sin(f * 0.2) * 5); // A little bob
          }

          canvas.style.transform = 'translateX(' + xPos + 'px)';
          canvas.style.bottom = (10 + bounce) + 'px';
          
          f++;
          requestAnimationFrame(animate);
      }
      animate();
    })();
  `;
  return `<script>${scriptContent}</script>`;
};

export function getFullJsCode(data: PixelArtData, movementPattern: MovementPattern): string {
  return generateJavascriptCode(data, movementPattern);
}

export function getHtmlEmbedCode(data: PixelArtData, movementPattern: MovementPattern, previewDataUrl: string): string {
    const jsCode = generateJavascriptCode(data, movementPattern);
    const base64JsCode = typeof window !== 'undefined' ? window.btoa(jsCode.replace(/<\/script>|<script>/g, '')) : Buffer.from(jsCode.replace(/<\/script>|<script>/g, '')).toString('base64');
    
    const onclickHandler = `(function(){try{var s=document.createElement('script');s.textContent=atob('${base64JsCode}');document.body.appendChild(s);this.style.display='none';}catch(e){console.error('Failed to load pixel art.',e)}}).call(this)`;

    const finalHtml = `<a href="javascript:void(0)" onclick="${onclickHandler.replace(/"/g, '&quot;')}"><img src="${previewDataUrl}" alt="Pixel Art Preview" style="image-rendering:pixelated;width:128px;height:128px;border:1px solid #eee;"></a>`;

    return finalHtml;
}
