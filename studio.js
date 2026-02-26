// SAFWAN STUDIO v3 - FULL ENGINE
const PRESETS=[{name:'TikTok',w:1080,h:1920,icon:'📱'},{name:'YouTube',w:1920,h:1080,icon:'▶️'},{name:'Facebook',w:1200,h:628,icon:'f'},{name:'Twitter/X',w:1200,h:675,icon:'𝕏'},{name:'Instagram',w:1080,h:1080,icon:'▣'},{name:'Story',w:1080,h:1920,icon:'◎'},{name:'Snapchat',w:1080,h:1920,icon:'👻'},{name:'Pinterest',w:1000,h:1500,icon:'P'},{name:'LinkedIn',w:1200,h:627,icon:'in'},{name:'YouTube Short',w:1080,h:1920,icon:'🎬'},{name:'A4 طباعة',w:2480,h:3508,icon:'📄'},{name:'مربع',w:1080,h:1080,icon:'⬜'},{name:'بانوراما',w:2560,h:1440,icon:'🖼'},{name:'4K UHD',w:3840,h:2160,icon:'🎥'},{name:'HD 1080p',w:1920,h:1080,icon:'📺'},{name:'HD 720p',w:1280,h:720,icon:'📻'},{name:'ويب',w:1440,h:900,icon:'🌐'},{name:'بانر',w:728,h:90,icon:'📢'}];
let isDark=true,mode='static',currentTool='brush',currentColor='#1a1a1a',brushSize=12,brushOpacity=100,brushFlow=80,brushSmooth=50,brushHard=85,brushSpacing=5,brushScatter=0,brushType='round',safwanBrush='ink',zoom=1,canvasW=1080,canvasH=1080,isDrawing=false,lastX=0,lastY=0,smoothX=0,smoothY=0,historyStack=[],histIdx=-1,MAX_HIST=50,layers=[],activeLayer=0,isSelecting=false,selStartX=0,selStartY=0,previewSnapshot=null,gradientStart=null,symmetryMode=false;
let frames=[],currentFrame=0,fps=12,isPlaying=false,playInterval=null,onionSkin=false,loopPlay=true;
let drawCanvas,drawCtx;

window.addEventListener('load',()=>{
  const params=new URLSearchParams(location.search);
  mode=params.get('mode')||'static';
  drawCanvas=document.getElementById('mainCanvas');
  drawCtx=drawCanvas.getContext('2d',{willReadFrequently:true});
  setupCanvasSize(canvasW,canvasH,'#ffffff');
  setupMode();setupDrawEvents();generateColorSwatches();buildPresets();
  addLayer(false);renderLayers();zoomFit();saveHistory();
  toast('مرحباً بصفوان ستوديو v3! 🎨');
});

function setupMode(){
  const badge=document.getElementById('modeBadge');
  const animPanel=document.getElementById('animPanel');
  const statusMode=document.getElementById('statusMode');
  const exportGifBtn=document.getElementById('exportGifBtn');
  if(mode==='animation'){
    if(badge){badge.textContent='🎬 رسم متحرك';badge.style.cssText='font-size:0.7rem;font-weight:800;padding:0.2rem 0.7rem;border-radius:100px;background:rgba(78,205,196,0.2);color:var(--accent2);border:1px solid rgba(78,205,196,0.4)';}
    if(animPanel)animPanel.style.display='flex';
    if(statusMode)statusMode.textContent='🎬 رسم متحرك';
    if(exportGifBtn)exportGifBtn.style.display='block';
    if(frames.length===0)frames.push(captureFrame());
    renderAnimTimeline();updateFrameCounter();
  }else{
    if(badge){badge.textContent='🎨 رسم ثابت';badge.style.cssText='font-size:0.7rem;font-weight:800;padding:0.2rem 0.7rem;border-radius:100px;background:rgba(255,107,107,0.15);color:var(--accent1);border:1px solid rgba(255,107,107,0.3)';}
    if(animPanel)animPanel.style.display='none';
    if(statusMode)statusMode.textContent='🎨 رسم ثابت';
  }
}

function setupCanvasSize(w,h,bgFill){
  canvasW=w;canvasH=h;drawCanvas.width=w;drawCanvas.height=h;
  if(bgFill&&bgFill!=='transparent'){drawCtx.fillStyle=bgFill;drawCtx.fillRect(0,0,w,h);}
  const el=document.getElementById('canvasSizeDisplay');if(el)el.textContent=w+'×'+h;
  const pw=document.getElementById('propW');if(pw)pw.value=w;
  const ph=document.getElementById('propH');if(ph)ph.value=h;
}

function captureFrame(){return drawCtx.getImageData(0,0,canvasW,canvasH);}
function restoreFrame(imgData){
  if(!imgData){drawCtx.fillStyle='#ffffff';drawCtx.fillRect(0,0,canvasW,canvasH);return;}
  if(imgData.width!==canvasW||imgData.height!==canvasH){
    const tmp=document.createElement('canvas');tmp.width=imgData.width;tmp.height=imgData.height;
    tmp.getContext('2d').putImageData(imgData,0,0);
    drawCtx.fillStyle='#ffffff';drawCtx.fillRect(0,0,canvasW,canvasH);
    drawCtx.drawImage(tmp,0,0,canvasW,canvasH);
  }else{drawCtx.putImageData(imgData,0,0);}
}

function setupDrawEvents(){
  drawCanvas.addEventListener('mousedown',onStart);
  drawCanvas.addEventListener('mousemove',onMove);
  drawCanvas.addEventListener('mouseup',onEnd);
  drawCanvas.addEventListener('mouseleave',onEnd);
  drawCanvas.addEventListener('contextmenu',e=>{e.preventDefault();setTool('eyedropper');});
  drawCanvas.addEventListener('mousemove',e=>{const{x,y}=getCoords(e);const el=document.getElementById('cursorPos');if(el)el.textContent=Math.round(x)+', '+Math.round(y);});
  drawCanvas.addEventListener('touchstart',e=>{e.preventDefault();onStart(e.touches[0]);},{passive:false});
  drawCanvas.addEventListener('touchmove',e=>{e.preventDefault();onMove(e.touches[0]);},{passive:false});
  drawCanvas.addEventListener('touchend',e=>{onEnd(e.changedTouches[0]);},{passive:false});
  document.getElementById('canvasArea').addEventListener('wheel',e=>{e.preventDefault();e.deltaY<0?zoomIn():zoomOut();},{passive:false});
}

function getCoords(e){const rect=drawCanvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*(canvasW/rect.width),y:(e.clientY-rect.top)*(canvasH/rect.height)};}

function onStart(e){
  if(e.button!==undefined&&e.button!==0)return;
  if(isPlaying)return;
  isDrawing=true;
  const{x,y}=getCoords(e);lastX=smoothX=x;lastY=smoothY=y;previewSnapshot=null;
  switch(currentTool){
    case 'fill':floodFill(Math.round(x),Math.round(y));isDrawing=false;return;
    case 'eyedropper':pickColor(x,y);isDrawing=false;return;
    case 'text':addText(x,y);isDrawing=false;return;
    case 'zoom-tool':zoomIn();isDrawing=false;return;
    case 'pan':drawCanvas.style.cursor='grabbing';return;
    case 'gradient':gradientStart={x,y};return;
  }
  const shapeTools=['line','rect','ellipse','star','polygon','arrow','bezier','rect-select','ellipse-select','lasso','crop','ruler-tool'];
  if(shapeTools.includes(currentTool)){isSelecting=true;selStartX=x;selStartY=y;previewSnapshot=captureFrame();return;}
}

function onMove(e){
  if(!isDrawing)return;
  const{x,y}=getCoords(e);
  const sm=brushSmooth/100;smoothX=smoothX*sm+x*(1-sm);smoothY=smoothY*sm+y*(1-sm);
  if(isSelecting){drawShapePreview(currentTool,selStartX,selStartY,smoothX,smoothY);lastX=smoothX;lastY=smoothY;return;}
  switch(currentTool){
    case 'brush':case 'pen':case 'marker':case 'watercolor':case 'calligraphy':drawStroke(lastX,lastY,smoothX,smoothY);break;
    case 'pencil':drawPencil(lastX,lastY,smoothX,smoothY);break;
    case 'airbrush':drawAirbrush(smoothX,smoothY);break;
    case 'eraser':drawEraser(lastX,lastY,smoothX,smoothY);break;
    case 'smudge':drawSmudge(smoothX,smoothY);break;
    case 'blur':drawBlurTool(smoothX,smoothY);break;
    case 'dodge':applyTonal(smoothX,smoothY,'dodge');break;
    case 'burn':applyTonal(smoothX,smoothY,'burn');break;
    case 'sharpen':drawSharpen(smoothX,smoothY);break;
    case 'symmetry':drawStroke(lastX,lastY,smoothX,smoothY);drawMirror(lastX,lastY,smoothX,smoothY);break;
    case 'ruler-tool':drawShapePreview('line',selStartX,selStartY,smoothX,smoothY);break;
  }
  lastX=smoothX;lastY=smoothY;
}

function onEnd(e){
  if(!isDrawing)return;isDrawing=false;
  const cx=e?getCoords(e).x:smoothX,cy=e?getCoords(e).y:smoothY;
  const shapeTools=['line','rect','ellipse','star','polygon','arrow','bezier','ruler-tool'];
  if(isSelecting&&shapeTools.includes(currentTool)&&previewSnapshot){restoreFrame(previewSnapshot);drawShapeFinal(currentTool,selStartX,selStartY,cx,cy);}
  if(currentTool==='gradient'&&gradientStart){applyGradientTool(gradientStart.x,gradientStart.y,cx,cy);gradientStart=null;}
  if(currentTool==='pan')drawCanvas.style.cursor='grab';
  isSelecting=false;previewSnapshot=null;saveHistory();
  if(mode==='animation'){frames[currentFrame]=captureFrame();updateFrameThumb(currentFrame);}
}

function drawStroke(x1,y1,x2,y2){
  const ctx=drawCtx;ctx.save();
  if(brushType==='soft'||safwanBrush==='water'){
    const dist=Math.hypot(x2-x1,y2-y1);const steps=Math.max(1,Math.ceil(dist/(brushSize*0.12)));
    for(let i=0;i<=steps;i++){const t=i/steps;const px=x1+(x2-x1)*t,py=y1+(y2-y1)*t;
      const grad=ctx.createRadialGradient(px,py,0,px,py,brushSize/2);
      grad.addColorStop(0,hexToRgba(currentColor,(brushFlow/100)*0.18));grad.addColorStop(brushHard/100,hexToRgba(currentColor,(brushFlow/100)*0.08));grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalAlpha=brushOpacity/100;ctx.fillStyle=grad;ctx.beginPath();ctx.arc(px,py,brushSize/2,0,Math.PI*2);ctx.fill();}
  }else if(brushType==='spray'){
    ctx.fillStyle=currentColor;
    for(let i=0;i<50;i++){const a=Math.random()*Math.PI*2,r=Math.pow(Math.random(),0.5)*brushSize/2;ctx.globalAlpha=(brushOpacity/100)*(brushFlow/100)*0.25;ctx.beginPath();ctx.arc(x2+Math.cos(a)*r,y2+Math.sin(a)*r,0.8,0,Math.PI*2);ctx.fill();}
  }else if(safwanBrush==='ink'){
    const speed=Math.hypot(x2-x1,y2-y1);const w=Math.max(0.5,brushSize*(1-speed*0.008));
    ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=hexToRgba(currentColor,brushFlow/100);ctx.globalAlpha=brushOpacity/100;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }else if(safwanBrush==='paint'){
    ctx.lineWidth=brushSize;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=hexToRgba(currentColor,brushFlow/100*0.85);ctx.globalAlpha=brushOpacity/100;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    for(let i=0;i<3;i++){const ox=(Math.random()-0.5)*brushSize*0.5,oy=(Math.random()-0.5)*brushSize*0.3;ctx.globalAlpha=(brushOpacity/100)*0.1;ctx.lineWidth=brushSize*(0.2+Math.random()*0.3);ctx.beginPath();ctx.moveTo(x1+ox,y1+oy);ctx.lineTo(x2+ox,y2+oy);ctx.stroke();}
  }else if(safwanBrush==='charcoal'){
    for(let i=0;i<6;i++){const ox=(Math.random()-0.5)*brushSize*0.8,oy=(Math.random()-0.5)*brushSize*0.3;ctx.globalAlpha=(brushOpacity/100)*0.3;ctx.lineWidth=brushSize*(0.2+Math.random()*0.5);ctx.lineCap='round';ctx.strokeStyle=currentColor;ctx.beginPath();ctx.moveTo(x1+ox,y1+oy);ctx.lineTo(x2+ox,y2+oy);ctx.stroke();}
  }else if(brushType==='flat'){
    const angle=Math.atan2(y2-y1,x2-x1);ctx.save();ctx.translate(x2,y2);ctx.rotate(angle);
    ctx.fillStyle=hexToRgba(currentColor,brushFlow/100);ctx.globalAlpha=brushOpacity/100;
    const len=Math.hypot(x2-x1,y2-y1)+1;ctx.fillRect(-len/2,-brushSize/4,len,brushSize/2);ctx.restore();
  }else{
    ctx.lineWidth=brushSize;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=hexToRgba(currentColor,brushFlow/100);ctx.globalAlpha=brushOpacity/100;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  if(brushScatter>0){ctx.fillStyle=currentColor;for(let i=0;i<Math.ceil(brushScatter/8);i++){const a=Math.random()*Math.PI*2,r=Math.random()*brushSize*2;ctx.globalAlpha=(brushOpacity/100)*0.3;ctx.beginPath();ctx.arc(x2+Math.cos(a)*r,y2+Math.sin(a)*r,Math.random()*2,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
}

function drawPencil(x1,y1,x2,y2){const ctx=drawCtx;ctx.save();const dist=Math.hypot(x2-x1,y2-y1);const steps=Math.max(1,Math.ceil(dist*2));for(let i=0;i<steps;i++){const t=i/steps;const px=x1+(x2-x1)*t+(Math.random()-0.5)*1.2,py=y1+(y2-y1)*t+(Math.random()-0.5)*1.2;ctx.globalAlpha=(brushOpacity/100)*0.6*(0.5+Math.random()*0.5);ctx.fillStyle=currentColor;ctx.beginPath();ctx.arc(px,py,Math.max(0.4,brushSize/5),0,Math.PI*2);ctx.fill();}ctx.restore();}
function drawAirbrush(x,y){const ctx=drawCtx;ctx.save();for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,r=Math.pow(Math.random(),0.4)*brushSize;ctx.globalAlpha=(brushOpacity/100)*(brushFlow/100)*0.055;ctx.fillStyle=currentColor;ctx.beginPath();ctx.arc(x+Math.cos(a)*r,y+Math.sin(a)*r,0.8,0,Math.PI*2);ctx.fill();}ctx.restore();}
function drawEraser(x1,y1,x2,y2){const ctx=drawCtx;ctx.save();ctx.globalCompositeOperation='destination-out';ctx.lineWidth=brushSize*2;ctx.lineCap=brushType==='square'?'square':'round';ctx.lineJoin='round';ctx.strokeStyle='rgba(0,0,0,1)';ctx.globalAlpha=brushOpacity/100;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
function drawSmudge(x,y){const size=Math.round(brushSize*1.5);const sx=Math.max(0,Math.round(x)-size),sy=Math.max(0,Math.round(y)-size);const sw=Math.min(size*2,canvasW-sx),sh=Math.min(size*2,canvasH-sy);if(sw<2||sh<2)return;drawCtx.putImageData(boxBlur(drawCtx.getImageData(sx,sy,sw,sh),2),sx,sy);}
function drawBlurTool(x,y){const size=Math.round(brushSize*2);const sx=Math.max(0,Math.round(x)-size),sy=Math.max(0,Math.round(y)-size);const sw=Math.min(size*2,canvasW-sx),sh=Math.min(size*2,canvasH-sy);if(sw<2||sh<2)return;drawCtx.putImageData(boxBlur(drawCtx.getImageData(sx,sy,sw,sh),4),sx,sy);}
function applyTonal(x,y,m){const size=Math.round(brushSize);const sx=Math.max(0,Math.round(x)-size),sy=Math.max(0,Math.round(y)-size);const sw=Math.min(size*2,canvasW-sx),sh=Math.min(size*2,canvasH-sy);if(sw<2||sh<2)return;const img=drawCtx.getImageData(sx,sy,sw,sh);const d=img.data;const str=(brushOpacity/100)*0.1;for(let i=0;i<d.length;i+=4){if(m==='dodge'){d[i]=Math.min(255,d[i]+(255-d[i])*str);d[i+1]=Math.min(255,d[i+1]+(255-d[i+1])*str);d[i+2]=Math.min(255,d[i+2]+(255-d[i+2])*str);}else{d[i]=Math.max(0,d[i]*(1-str));d[i+1]=Math.max(0,d[i+1]*(1-str));d[i+2]=Math.max(0,d[i+2]*(1-str));}}drawCtx.putImageData(img,sx,sy);}
function drawSharpen(x,y){const size=Math.round(brushSize);const sx=Math.max(0,Math.round(x)-size),sy=Math.max(0,Math.round(y)-size);const sw=Math.min(size*2,canvasW-sx),sh=Math.min(size*2,canvasH-sy);if(sw<2||sh<2)return;const img=drawCtx.getImageData(sx,sy,sw,sh);const blurred=boxBlur(img,1);const d=img.data,b=blurred.data;for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,Math.max(0,d[i]+(d[i]-b[i])*0.7));d[i+1]=Math.min(255,Math.max(0,d[i+1]+(d[i+1]-b[i+1])*0.7));d[i+2]=Math.min(255,Math.max(0,d[i+2]+(d[i+2]-b[i+2])*0.7));}drawCtx.putImageData(img,sx,sy);}
function drawMirror(x1,y1,x2,y2){const cx=canvasW/2;drawCtx.save();drawCtx.lineWidth=brushSize;drawCtx.lineCap='round';drawCtx.lineJoin='round';drawCtx.strokeStyle=hexToRgba(currentColor,brushFlow/100);drawCtx.globalAlpha=brushOpacity/100;drawCtx.beginPath();drawCtx.moveTo(cx+(cx-x1),y1);drawCtx.lineTo(cx+(cx-x2),y2);drawCtx.stroke();drawCtx.restore();}

function drawShapePreview(tool,x1,y1,x2,y2){if(!previewSnapshot)return;restoreFrame(previewSnapshot);renderShape(tool,x1,y1,x2,y2,true);}
function drawShapeFinal(tool,x1,y1,x2,y2){renderShape(tool,x1,y1,x2,y2,false);}
function renderShape(tool,x1,y1,x2,y2,preview){
  const ctx=drawCtx;ctx.save();ctx.strokeStyle=currentColor;ctx.fillStyle=hexToRgba(currentColor,0.12);ctx.lineWidth=brushSize;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=brushOpacity/100;
  if(preview)ctx.setLineDash([6,3]);
  switch(tool){
    case 'line':case 'ruler-tool':ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();break;
    case 'rect':{const rx=Math.min(x1,x2),ry=Math.min(y1,y2),rw=Math.abs(x2-x1),rh=Math.abs(y2-y1);ctx.beginPath();ctx.rect(rx,ry,rw,rh);ctx.stroke();if(!preview)ctx.fill();break;}
    case 'ellipse':{const cx=(x1+x2)/2,cy=(y1+y2)/2,rx=Math.max(1,Math.abs(x2-x1)/2),ry=Math.max(1,Math.abs(y2-y1)/2);ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.stroke();if(!preview)ctx.fill();break;}
    case 'star':{const cx=(x1+x2)/2,cy=(y1+y2)/2,outer=Math.hypot(x2-cx,y2-cy),inner=outer*0.42;ctx.beginPath();for(let i=0;i<10;i++){const r=i%2===0?outer:inner,a=(i*Math.PI/5)-Math.PI/2;i===0?ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}ctx.closePath();ctx.stroke();break;}
    case 'polygon':{const cx=(x1+x2)/2,cy=(y1+y2)/2,r=Math.hypot(x2-cx,y2-cy);ctx.beginPath();for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2-Math.PI/2;i===0?ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}ctx.closePath();ctx.stroke();break;}
    case 'arrow':{const angle=Math.atan2(y2-y1,x2-x1),len=20+brushSize*2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-len*Math.cos(angle-0.4),y2-len*Math.sin(angle-0.4));ctx.lineTo(x2-len*Math.cos(angle+0.4),y2-len*Math.sin(angle+0.4));ctx.closePath();ctx.fillStyle=currentColor;ctx.fill();break;}
    case 'bezier':{const cp1x=x1+(x2-x1)*0.25,cp1y=y1-(y2-y1)*0.6,cp2x=x1+(x2-x1)*0.75,cp2y=y2+(y2-y1)*0.6;ctx.beginPath();ctx.moveTo(x1,y1);ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x2,y2);ctx.stroke();break;}
  }
  ctx.restore();
}

function boxBlur(imgData,r){const w=imgData.width,h=imgData.height,src=imgData.data,out=new Uint8ClampedArray(src.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let rr=0,g=0,b=0,a=0,n=0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h){const i=(ny*w+nx)*4;rr+=src[i];g+=src[i+1];b+=src[i+2];a+=src[i+3];n++;}}const i=(y*w+x)*4;out[i]=rr/n;out[i+1]=g/n;out[i+2]=b/n;out[i+3]=a/n;}return new ImageData(out,w,h);}

function floodFill(sx,sy){
  if(sx<0||sx>=canvasW||sy<0||sy>=canvasH)return;
  const img=drawCtx.getImageData(0,0,canvasW,canvasH);const d=img.data;
  const startIdx=(sy*canvasW+sx)*4;const tr=d[startIdx],tg=d[startIdx+1],tb=d[startIdx+2];
  const fr=parseInt(currentColor.slice(1,3),16),fg=parseInt(currentColor.slice(3,5),16),fb=parseInt(currentColor.slice(5,7),16);
  if(tr===fr&&tg===fg&&tb===fb)return;
  const tol=30;function matches(i){return Math.abs(d[i]-tr)<=tol&&Math.abs(d[i+1]-tg)<=tol&&Math.abs(d[i+2]-tb)<=tol;}
  const vis=new Uint8Array(canvasW*canvasH);const stack=[sy*canvasW+sx];let iter=0;
  while(stack.length&&iter<3000000){iter++;const pos=stack.pop();if(vis[pos])continue;const px=pos%canvasW,py=Math.floor(pos/canvasW);if(px<0||px>=canvasW||py<0||py>=canvasH)continue;const i=pos*4;if(!matches(i))continue;vis[pos]=1;d[i]=fr;d[i+1]=fg;d[i+2]=fb;d[i+3]=255;if(px+1<canvasW)stack.push(pos+1);if(px-1>=0)stack.push(pos-1);if(py+1<canvasH)stack.push(pos+canvasW);if(py-1>=0)stack.push(pos-canvasW);}
  drawCtx.putImageData(img,0,0);saveHistory();toast('تم الملء');
}

function applyGradientTool(x1,y1,x2,y2){const grad=drawCtx.createLinearGradient(x1,y1,x2,y2);grad.addColorStop(0,currentColor);grad.addColorStop(1,'rgba(0,0,0,0)');drawCtx.save();drawCtx.globalAlpha=brushOpacity/100;drawCtx.fillStyle=grad;drawCtx.fillRect(0,0,canvasW,canvasH);drawCtx.restore();saveHistory();toast('تدرج مُطبّق');}
function pickColor(x,y){const p=drawCtx.getImageData(Math.max(0,Math.round(x)),Math.max(0,Math.round(y)),1,1).data;const hex='#'+[p[0],p[1],p[2]].map(v=>v.toString(16).padStart(2,'0')).join('');selectColor(hex);toast('اللون: '+hex);}
function addText(x,y){const text=prompt('أدخل النص:','نص هنا');if(!text)return;drawCtx.save();drawCtx.font=`${Math.max(12,brushSize*3)}px Cairo, sans-serif`;drawCtx.fillStyle=currentColor;drawCtx.globalAlpha=brushOpacity/100;drawCtx.textAlign='center';drawCtx.textBaseline='middle';drawCtx.fillText(text,x,y);drawCtx.restore();saveHistory();toast('نص مضاف');}

function hslToHex(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,'0');};return `#${f(0)}${f(8)}${f(4)}`;}
function hexToRgba(hex,a=1){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}

function generateColorSwatches(){
  const colors=[];
  for(let i=0;i<=20;i++){const v=Math.round(i*12.75).toString(16).padStart(2,'0');colors.push('#'+v+v+v);}
  const skins=['#FDDBB4','#F5C89E','#E8B98A','#D4A574','#C49060','#B47C4C','#A36838','#8D5524','#7C4916','#6B3A0A','#FFF0E0','#FFE4C4','#FFD4A0','#F4C090','#E8A87C','#DC9068','#C07850','#A46040','#885030','#6C4020','#FFE8D5','#FFDABC','#FFCCA3','#F5BE90','#E8A878','#D89060','#C07848','#A86030','#906018','#784808'];
  colors.push(...skins);
  for(let h=0;h<360;h+=4)for(let s of[100,80,60])for(let l of[15,25,35,45,55,65,75,85])colors.push(hslToHex(h,s,l));
  for(let h=0;h<360;h+=8)colors.push(hslToHex(h,45,85));
  ['#8B4513','#A0522D','#CD853F','#DEB887','#556B2F','#2F4F4F','#008080','#FF00FF','#00FFFF','#00FF00','#FF6600','#FF0066'].forEach(c=>colors.push(c));
  const pal=[...new Set(colors)].slice(0,1200);
  const container=document.getElementById('colorSwatches');if(!container)return;container.innerHTML='';
  pal.forEach(c=>{const el=document.createElement('div');el.className='swatch';el.style.background=c;el.title=c;el.onclick=()=>selectColor(c);container.appendChild(el);});
}

function selectColor(color){
  currentColor=color;
  const fg=document.getElementById('fgSwatch');if(fg)fg.style.background=color;
  const hx=document.getElementById('hexInput');if(hx)hx.value=color.replace('#','');
  const np=document.getElementById('colorPickerNative');if(np)np.value=color;
  const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);
  const sr=document.getElementById('sliderR');if(sr)sr.value=r;const sg=document.getElementById('sliderG');if(sg)sg.value=g;const sb=document.getElementById('sliderB');if(sb)sb.value=b;
  document.querySelectorAll('.swatch').forEach(s=>s.classList.toggle('active',s.title===color));
}
function applyNativeColor(){const el=document.getElementById('colorPickerNative');if(el)selectColor(el.value);}
function applyHex(){const v='#'+(document.getElementById('hexInput').value||'').replace('#','');if(/^#[0-9A-Fa-f]{6}$/.test(v))selectColor(v);}
function applyRGB(){const r=document.getElementById('sliderR').value,g=document.getElementById('sliderG').value,b=document.getElementById('sliderB').value;selectColor('#'+[r,g,b].map(v=>parseInt(v).toString(16).padStart(2,'0')).join(''));}

function selectSafwanBrush(el,name){
  safwanBrush=name;document.querySelectorAll('.safwan-brush-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');
  const p={ink:{size:4,opacity:100,flow:95,smooth:20,hard:95,spacing:2,scatter:0},sketch:{size:2,opacity:65,flow:55,smooth:15,hard:65,spacing:1,scatter:0},paint:{size:22,opacity:85,flow:75,smooth:65,hard:45,spacing:5,scatter:5},charcoal:{size:14,opacity:40,flow:35,smooth:35,hard:15,spacing:3,scatter:12},water:{size:28,opacity:50,flow:45,smooth:75,hard:8,spacing:8,scatter:0}}[name];
  if(!p)return;brushSize=p.size;brushOpacity=p.opacity;brushFlow=p.flow;brushSmooth=p.smooth;brushHard=p.hard;brushSpacing=p.spacing;brushScatter=p.scatter;brushType=name==='water'?'soft':name==='charcoal'?'spray':'round';
  ['Size','Opacity','Flow','Smooth','Hard','Spacing','Scatter'].forEach(k=>{const el2=document.getElementById('brush'+k);if(el2)el2.value=p[k.toLowerCase()];});updateBrush();toast('🖌 '+el.textContent.trim());
}
function setBrushType(type,el){brushType=type;document.querySelectorAll('.brush-preset-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');}
function updateBrush(){
  const get=id=>{const el=document.getElementById(id);return el?parseInt(el.value):0;};
  brushSize=get('brushSize');brushOpacity=get('brushOpacity');brushFlow=get('brushFlow');brushSmooth=get('brushSmooth');brushHard=get('brushHard');brushSpacing=get('brushSpacing');brushScatter=get('brushScatter');
  const set=(id,v,s)=>{const el=document.getElementById(id);if(el)el.textContent=v+s;};
  set('brushSizeVal',brushSize,'px');set('brushOpacityVal',brushOpacity,'%');set('brushFlowVal',brushFlow,'%');set('brushSmoothVal',brushSmooth,'%');set('brushHardVal',brushHard,'%');set('brushSpacingVal',brushSpacing,'%');set('brushScatterVal',brushScatter,'%');
}

const toolNames={select:'تحديد',brush:'فرشاة',pencil:'رصاص',pen:'قلم حبر',calligraphy:'خطاطي',marker:'ماركر',airbrush:'هواء',watercolor:'مائية',eraser:'ممحاة',smudge:'تلطيخ',blur:'تمويه',sharpen:'حدة',dodge:'تفتيح',burn:'تعتيم',fill:'دلو',gradient:'تدرج',eyedropper:'قطارة',line:'خط',rect:'مستطيل',ellipse:'دائرة',polygon:'مضلع',star:'نجمة',bezier:'منحنى',arrow:'سهم',text:'نص',crop:'اقتصاص',pan:'تحريك','zoom-tool':'تكبير','ruler-tool':'مسطرة',symmetry:'تماثل','rect-select':'تحديد مستطيل','ellipse-select':'تحديد دائري',lasso:'لاسو','magic-wand':'عصا سحرية'};
const toolCursors={brush:'crosshair',pencil:'crosshair',eraser:'cell',fill:'cell',eyedropper:'crosshair',pan:'grab',text:'text','zoom-tool':'zoom-in',select:'default',gradient:'crosshair'};
function setTool(tool){
  currentTool=tool;document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  const btn=document.getElementById('tool-'+tool);if(btn)btn.classList.add('active');
  const st=document.getElementById('statusTool');if(st)st.textContent=toolNames[tool]||tool;
  drawCanvas.style.cursor=toolCursors[tool]||'crosshair';symmetryMode=tool==='symmetry';
  toast('الأداة: '+(toolNames[tool]||tool));
}

function addLayer(notify=true){layers.push({id:Date.now(),name:'طبقة '+(layers.length+1),visible:true,locked:false,opacity:100,blend:'source-over'});activeLayer=layers.length-1;renderLayers();if(notify)toast('طبقة جديدة');}
function deleteLayer(){if(layers.length<=1){toast('لا يمكن حذف آخر طبقة');return;}layers.splice(activeLayer,1);activeLayer=Math.min(activeLayer,layers.length-1);renderLayers();toast('تم الحذف');}
function duplicateLayer(){const c={...layers[activeLayer],id:Date.now(),name:layers[activeLayer].name+' (نسخة)'};layers.splice(activeLayer+1,0,c);activeLayer++;renderLayers();toast('تم التكرار');}
function toggleLayerVis(i){layers[i].visible=!layers[i].visible;renderLayers();}
function toggleLayerLock(i){layers[i].locked=!layers[i].locked;renderLayers();toast(layers[i].locked?'مقفلة 🔒':'مفتوحة 🔓');}
function updateLayerOpacity(){const v=document.getElementById('layerOpacity').value;document.getElementById('layerOpacityVal').textContent=v+'%';layers[activeLayer].opacity=parseInt(v);}
function applyBlendMode(){layers[activeLayer].blend=document.getElementById('blendMode').value;toast('وضع المزج');}
function mergeDown(){toast('دمج');}function mergeLayers(){toast('دمج الكل');}function flattenImage(){toast('تسطيح');}

function renderLayers(){
  const list=document.getElementById('layersList');if(!list)return;list.innerHTML='';
  [...layers].reverse().forEach((layer,ri)=>{
    const idx=layers.length-1-ri;const el=document.createElement('div');el.className='layer-item'+(idx===activeLayer?' active':'');el.onclick=()=>{activeLayer=idx;renderLayers();};
    el.innerHTML=`<div class="layer-thumb" style="background:${layer.visible?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.2)'}"></div><span class="layer-name" ondblclick="renameLayer(${idx},this)">${layer.name}</span><div class="layer-actions"><button class="layer-btn" onclick="event.stopPropagation();toggleLayerVis(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${layer.visible?'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>':'<line x1="1" y1="1" x2="23" y2="23"/>'}</svg></button><button class="layer-btn" onclick="event.stopPropagation();toggleLayerLock(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/></svg></button></div>`;
    list.appendChild(el);
  });
  const st=document.getElementById('statusLayers');if(st)st.textContent=layers.length+' طبقة';
}
function renameLayer(idx,el){const input=document.createElement('input');input.className='layer-name-input';input.value=layers[idx].name;el.replaceWith(input);input.focus();input.select();input.onblur=()=>{layers[idx].name=input.value||layers[idx].name;renderLayers();};input.onkeydown=e=>{if(e.key==='Enter')input.blur();};}

function saveHistory(){historyStack=historyStack.slice(0,histIdx+1);historyStack.push(captureFrame());if(historyStack.length>MAX_HIST)historyStack.shift();histIdx=historyStack.length-1;const sh=document.getElementById('statusHistory');if(sh)sh.textContent=histIdx+' خطوة';}
function doUndo(){if(histIdx<=0){toast('لا يوجد تراجع');return;}histIdx--;restoreFrame(historyStack[histIdx]);if(mode==='animation'){frames[currentFrame]=captureFrame();updateFrameThumb(currentFrame);}toast('↩ تراجع');}
function doRedo(){if(histIdx>=historyStack.length-1){toast('لا يوجد إعادة');return;}histIdx++;restoreFrame(historyStack[histIdx]);if(mode==='animation'){frames[currentFrame]=captureFrame();updateFrameThumb(currentFrame);}toast('↪ إعادة');}

function zoomIn(){zoom=Math.min(zoom*1.25,32);applyZoom();}
function zoomOut(){zoom=Math.max(zoom/1.25,0.04);applyZoom();}
function zoomFit(){const area=document.getElementById('canvasArea');if(!area)return;zoom=Math.min((area.clientWidth-80)/canvasW,(area.clientHeight-80)/canvasH)*0.9;applyZoom();}
function applyZoom(){const w=Math.round(canvasW*zoom),h=Math.round(canvasH*zoom);drawCanvas.style.width=w+'px';drawCanvas.style.height=h+'px';const checker=document.getElementById('canvasChecker');if(checker){checker.style.width=w+'px';checker.style.height=h+'px';}const pct=Math.round(zoom*100)+'%';const zd=document.getElementById('zoomDisplay');if(zd)zd.textContent=pct;const zp=document.getElementById('zoomPct');if(zp)zp.textContent=pct;}
function toggleGrid(){const g=document.getElementById('bgGrid');if(g)g.classList.toggle('show');toast('شبكة');}
function toggleChecker(){const c=document.getElementById('canvasChecker');if(c){const show=c.classList.toggle('show');c.style.display=show?'block':'none';}toast('شطرنج');}

function buildPresets(){
  const d=document.getElementById('dialogPresets');
  if(d)PRESETS.forEach(p=>{const b=document.createElement('button');b.style.cssText='background:var(--bg3);border:1px solid var(--border);border-radius:7px;padding:0.3rem;font-size:0.6rem;font-weight:700;color:var(--text3);cursor:pointer;font-family:var(--font);text-align:center;transition:all 0.2s';b.innerHTML=`<div>${p.icon}</div><div style="font-weight:800;color:var(--text2)">${p.name}</div><div style="font-size:0.5rem">${p.w}×${p.h}</div>`;b.onmouseover=()=>{b.style.borderColor='var(--accent2)';b.style.color='var(--accent2)';};b.onmouseout=()=>{b.style.borderColor='var(--border)';b.style.color='var(--text3)';};b.onclick=()=>{document.getElementById('newW').value=p.w;document.getElementById('newH').value=p.h;};d.appendChild(b);});
  const pp=document.getElementById('sizePresetsBtns');
  if(pp)PRESETS.forEach(p=>{const b=document.createElement('button');b.className='size-preset-btn';b.innerHTML=`<span class="sp-name">${p.name}</span><span class="sp-dim">${p.w}×${p.h}</span>`;b.onclick=()=>{document.getElementById('propW').value=p.w;document.getElementById('propH').value=p.h;applyCanvasSize();};pp.appendChild(b);});
}

function applyCanvasSize(){const w=parseInt(document.getElementById('propW').value)||canvasW;const h=parseInt(document.getElementById('propH').value)||canvasH;const old=captureFrame();setupCanvasSize(w,h,'#ffffff');try{drawCtx.putImageData(old,0,0);}catch(e){}zoomFit();saveHistory();toast('الحجم: '+w+'×'+h);}
function showNewCanvas(){document.getElementById('newCanvasDialog').classList.add('open');}
function createNewCanvas(){
  const w=parseInt(document.getElementById('newW').value)||1080;const h=parseInt(document.getElementById('newH').value)||1080;
  const bg=document.getElementById('newBg').value;const bgCol=document.getElementById('newBgColor').value;const nm=document.getElementById('newMode').value;
  const fill=bg==='white'?'#ffffff':bg==='black'?'#000000':bg==='custom'?bgCol:null;
  setupCanvasSize(w,h,fill);historyStack=[];histIdx=-1;saveHistory();layers=[];addLayer(false);renderLayers();
  document.getElementById('newCanvasDialog').classList.remove('open');
  if(nm!==mode){mode=nm;if(mode==='animation'){frames=[captureFrame()];currentFrame=0;}setupMode();}
  else if(mode==='animation'){frames=[captureFrame()];currentFrame=0;renderAnimTimeline();updateFrameCounter();}
  zoomFit();toast('✅ مشروع جديد '+w+'×'+h);
}

function exportPNG(){const a=document.createElement('a');a.download='safwan-studio.png';a.href=drawCanvas.toDataURL('image/png');a.click();toast('✅ PNG');}
function exportJPEG(){const t=document.createElement('canvas');t.width=canvasW;t.height=canvasH;const tc=t.getContext('2d');tc.fillStyle='#fff';tc.fillRect(0,0,canvasW,canvasH);tc.drawImage(drawCanvas,0,0);const a=document.createElement('a');a.download='safwan-studio.jpg';a.href=t.toDataURL('image/jpeg',0.95);a.click();toast('✅ JPEG');}
function exportWebP(){const a=document.createElement('a');a.download='safwan-studio.webp';a.href=drawCanvas.toDataURL('image/webp',0.92);a.click();toast('✅ WebP');}
function exportTransparent(){const a=document.createElement('a');a.download='safwan-transparent.png';a.href=drawCanvas.toDataURL('image/png');a.click();toast('✅ PNG شفاف');}
function exportGIF(){toast('🔄 استخدم تصدير فيديو WebM');}

function exportVideo(){
  if(mode!=='animation'||frames.length===0){exportPNG();return;}
  try{
    frames[currentFrame]=captureFrame();
    const stream=drawCanvas.captureStream(fps);
    const mimeType=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
    const rec=new MediaRecorder(stream,{mimeType});const chunks=[];
    rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
    rec.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'});const a=document.createElement('a');a.download='safwan-animation.webm';a.href=URL.createObjectURL(blob);a.click();toast('✅ تم تصدير الفيديو!');};
    rec.start(100);let fi=0;
    const iv=setInterval(()=>{if(fi>=frames.length){clearInterval(iv);setTimeout(()=>rec.stop(),200);return;}restoreFrame(frames[fi]);fi++;},1000/fps);
    toast('🎬 جاري التصدير...');
  }catch(e){toast('خطأ: '+e.message);}
}

function doFlipH(){const t=document.createElement('canvas');t.width=canvasW;t.height=canvasH;const c=t.getContext('2d');c.translate(canvasW,0);c.scale(-1,1);c.drawImage(drawCanvas,0,0);drawCtx.clearRect(0,0,canvasW,canvasH);drawCtx.drawImage(t,0,0);saveHistory();toast('قلب أفقي');}
function doFlipV(){const t=document.createElement('canvas');t.width=canvasW;t.height=canvasH;const c=t.getContext('2d');c.translate(0,canvasH);c.scale(1,-1);c.drawImage(drawCanvas,0,0);drawCtx.clearRect(0,0,canvasW,canvasH);drawCtx.drawImage(t,0,0);saveHistory();toast('قلب رأسي');}
function doRotateCW(){const t=document.createElement('canvas');t.width=canvasH;t.height=canvasW;const c=t.getContext('2d');c.translate(canvasH/2,canvasW/2);c.rotate(Math.PI/2);c.drawImage(drawCanvas,-canvasW/2,-canvasH/2);[canvasW,canvasH]=[canvasH,canvasW];drawCanvas.width=canvasW;drawCanvas.height=canvasH;drawCtx.drawImage(t,0,0);saveHistory();zoomFit();toast('تدوير 90°');}
function doSelectAll(){toast('تحديد الكل');}
function doCopy(){drawCanvas.toBlob(b=>navigator.clipboard.write([new ClipboardItem({'image/png':b})]).catch(()=>{}));toast('نسخ');}
function doPaste(){navigator.clipboard.read().then(items=>{for(const item of items)if(item.types.includes('image/png'))item.getType('image/png').then(blob=>{const img=new Image();img.onload=()=>{drawCtx.drawImage(img,0,0);saveHistory();};img.src=URL.createObjectURL(blob);});}).catch(()=>toast('لا توجد صورة'));}
function clearCanvas(){if(!confirm('مسح اللوحة؟'))return;drawCtx.fillStyle='#ffffff';drawCtx.fillRect(0,0,canvasW,canvasH);saveHistory();toast('تم المسح');}
function addFilterBlur(){const s=parseInt(prompt('قوة التمويه:','5'))||5;drawCtx.putImageData(boxBlur(captureFrame(),s),0,0);saveHistory();toast('تمويه');}
function addFilterBrightness(){const v=parseInt(prompt('السطوع:','20'))||20;const img=captureFrame();const d=img.data;for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,Math.max(0,d[i]+v));d[i+1]=Math.min(255,Math.max(0,d[i+1]+v));d[i+2]=Math.min(255,Math.max(0,d[i+2]+v));}drawCtx.putImageData(img,0,0);saveHistory();toast('سطوع');}
function addFilterGrayscale(){const img=captureFrame();const d=img.data;for(let i=0;i<d.length;i+=4){const g=d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114;d[i]=d[i+1]=d[i+2]=g;}drawCtx.putImageData(img,0,0);saveHistory();toast('رمادي');}
function handleRefImport(e){const file=e.target.files[0];if(!file)return;const img=new Image();img.onload=()=>{drawCtx.save();drawCtx.globalAlpha=0.5;drawCtx.drawImage(img,0,0,canvasW,canvasH);drawCtx.restore();saveHistory();toast('مرجع مستورد');};img.src=URL.createObjectURL(file);}
function handleFileOpen(e){const file=e.target.files[0];if(!file)return;const img=new Image();img.onload=()=>{setupCanvasSize(img.width,img.height,null);drawCtx.drawImage(img,0,0);saveHistory();zoomFit();toast('تم فتح الصورة');};img.src=URL.createObjectURL(file);}
function updateRefOpacity(){const v=document.getElementById('refOpacity').value;document.getElementById('refOpacityVal').textContent=v+'%';}
function toggleRefLock(){toast('مرجع');}function removeRef(){toast('تم حذف المرجع');}

// ============ ANIMATION ============
function updateFrameCounter(){const fc=document.getElementById('frameCounter');if(fc)fc.textContent='فريم '+(currentFrame+1)+' / '+frames.length;}

function switchToFrame(idx){
  if(mode==='animation')frames[currentFrame]=captureFrame();
  currentFrame=idx;restoreFrame(frames[currentFrame]);updateFrameCounter();
  document.querySelectorAll('.frame-item').forEach((el,i)=>el.classList.toggle('active',i===idx));
}

function updateFrameThumb(idx){
  const tc2=document.getElementById('frameThumb-'+idx);if(!tc2){renderAnimTimeline();return;}
  const mcc=tc2.getContext('2d');const tmp=document.createElement('canvas');tmp.width=canvasW;tmp.height=canvasH;
  if(frames[idx])tmp.getContext('2d').putImageData(frames[idx],0,0);else{tmp.getContext('2d').fillStyle='#fff';tmp.getContext('2d').fillRect(0,0,canvasW,canvasH);}
  mcc.clearRect(0,0,tc2.width,tc2.height);mcc.drawImage(tmp,0,0,tc2.width,tc2.height);
}

function renderAnimTimeline(){
  const tl=document.getElementById('animTimeline');if(!tl)return;tl.innerHTML='';
  frames.forEach((fr,i)=>{
    const el=document.createElement('div');el.className='frame-item'+(i===currentFrame?' active':'');
    el.onclick=()=>{if(!isPlaying)switchToFrame(i);};
    const mc=document.createElement('canvas');mc.id='frameThumb-'+i;mc.width=64;mc.height=Math.max(1,Math.round(64*canvasH/canvasW));mc.style.cssText='width:100%;height:100%;display:block;';
    const mcc=mc.getContext('2d');mcc.fillStyle='#fff';mcc.fillRect(0,0,64,mc.height);
    if(fr){const tmp=document.createElement('canvas');tmp.width=canvasW;tmp.height=canvasH;tmp.getContext('2d').putImageData(fr,0,0);mcc.drawImage(tmp,0,0,64,mc.height);}
    el.appendChild(mc);const num=document.createElement('div');num.className='frame-num';num.textContent=i+1;el.appendChild(num);
    const dur=document.createElement('div');dur.className='frame-duration';dur.textContent=Math.round(1000/fps)+'ms';el.appendChild(dur);
    tl.appendChild(el);
  });
  const addBtn=document.createElement('div');addBtn.className='frame-add-btn';addBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';addBtn.onclick=addFrame;tl.appendChild(addBtn);
  updateFrameCounter();
}

function addFrame(){
  if(mode!=='animation')return;frames[currentFrame]=captureFrame();frames.push(null);currentFrame=frames.length-1;
  drawCtx.fillStyle='#ffffff';drawCtx.fillRect(0,0,canvasW,canvasH);frames[currentFrame]=captureFrame();
  renderAnimTimeline();updateFrameCounter();saveHistory();toast('➕ فريم '+currentFrame);
}
function duplicateFrame(){if(mode!=='animation')return;frames[currentFrame]=captureFrame();const copy=new ImageData(new Uint8ClampedArray(frames[currentFrame].data),canvasW,canvasH);frames.splice(currentFrame+1,0,copy);currentFrame++;restoreFrame(frames[currentFrame]);renderAnimTimeline();updateFrameCounter();toast('📋 تكرار فريم');}
function deleteFrame(){if(mode!=='animation')return;if(frames.length<=1){toast('لا يمكن حذف آخر فريم');return;}frames.splice(currentFrame,1);currentFrame=Math.min(currentFrame,frames.length-1);restoreFrame(frames[currentFrame]);renderAnimTimeline();updateFrameCounter();toast('🗑 حذف فريم');}
function frameNext(){if(mode!=='animation')return;frames[currentFrame]=captureFrame();switchToFrame((currentFrame+1)%frames.length);}
function framePrev(){if(mode!=='animation')return;frames[currentFrame]=captureFrame();switchToFrame((currentFrame-1+frames.length)%frames.length);}
function updateFPS(){fps=parseInt(document.getElementById('fpsInput').value)||12;}
function toggleLoop(){loopPlay=!loopPlay;toast(loopPlay?'🔁 تكرار':'▶ مرة');}
function toggleOnionSkin(){onionSkin=!onionSkin;toast(onionSkin?'🧅 بصل مفعّل':'بصل مخفي');}
function togglePlay(){isPlaying?stopPlay():startPlay();}

function startPlay(){
  if(frames.length===0)return;frames[currentFrame]=captureFrame();isPlaying=true;
  const icon=document.getElementById('playIcon');if(icon)icon.innerHTML='<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  let fi=0;
  playInterval=setInterval(()=>{
    restoreFrame(frames[fi]);
    document.querySelectorAll('.frame-item').forEach((el,i)=>el.classList.toggle('active',i===fi));
    const fc=document.getElementById('frameCounter');if(fc)fc.textContent='فريم '+(fi+1)+' / '+frames.length;
    fi++;if(fi>=frames.length){if(loopPlay)fi=0;else stopPlay();}
  },1000/fps);
}
function stopPlay(){
  isPlaying=false;clearInterval(playInterval);playInterval=null;
  const icon=document.getElementById('playIcon');if(icon)icon.innerHTML='<polygon points="5 3 19 12 5 21 5 3"/>';
  restoreFrame(frames[currentFrame]);
}

// ============ FIRE PROJECT ============
function openSampleProject(){
  if(!confirm('فتح مشروع نار متحركة الجاهز؟'))return;
  stopPlay();mode='animation';canvasW=400;canvasH=500;drawCanvas.width=canvasW;drawCanvas.height=canvasH;
  frames=[];
  for(let f=0;f<10;f++){
    const tmp=document.createElement('canvas');tmp.width=canvasW;tmp.height=canvasH;
    drawFireFrame(tmp.getContext('2d'),f,10,canvasW,canvasH);
    frames.push(tmp.getContext('2d').getImageData(0,0,canvasW,canvasH));
  }
  currentFrame=0;fps=14;const fpsEl=document.getElementById('fpsInput');if(fpsEl)fpsEl.value=fps;
  restoreFrame(frames[0]);saveHistory();
  document.getElementById('animPanel').style.display='flex';
  const badge=document.getElementById('modeBadge');if(badge){badge.textContent='🎬 رسم متحرك';badge.style.cssText='font-size:0.7rem;font-weight:800;padding:0.2rem 0.7rem;border-radius:100px;background:rgba(78,205,196,0.2);color:var(--accent2);border:1px solid rgba(78,205,196,0.4)';}
  const sm=document.getElementById('statusMode');if(sm)sm.textContent='🎬 رسم متحرك';
  const egb=document.getElementById('exportGifBtn');if(egb)egb.style.display='block';
  renderAnimTimeline();updateFrameCounter();zoomFit();toast('🔥 نار متحركة جاهزة! اضغط ▶ للتشغيل');
}

function drawFireFrame(ctx,frameIdx,totalFrames,w,h){
  const t=frameIdx/totalFrames;
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
  const layers2=[
    {colors:['#FF4500','#FF6600','#FF8800'],yBase:0.85,yTip:0.06,wf:0.38,alpha:0.9},
    {colors:['#FF2200','#FF4400','#FF6600'],yBase:0.88,yTip:0.14,wf:0.28,alpha:0.8},
    {colors:['#FFCC00','#FF8800','#FF4400'],yBase:0.90,yTip:0.25,wf:0.20,alpha:0.75},
    {colors:['#FFFFFF','#FFFF99','#FFCC00'],yBase:0.92,yTip:0.40,wf:0.13,alpha:0.85},
  ];
  layers2.forEach((fl,li)=>{
    const wobble=Math.sin(t*Math.PI*2+li*1.1)*18,wobble2=Math.cos(t*Math.PI*2*1.3+li*0.7)*10;
    const tipX=w/2+wobble,tipY=h*fl.yTip+wobble2*0.3,baseW=w*fl.wf;
    const grad=ctx.createLinearGradient(w/2,h*fl.yBase,tipX,tipY);
    grad.addColorStop(0,fl.colors[0]);grad.addColorStop(0.5,fl.colors[1]);grad.addColorStop(1,fl.colors[2]);
    ctx.globalAlpha=fl.alpha;ctx.fillStyle=grad;ctx.beginPath();
    ctx.moveTo(w/2-baseW,h*fl.yBase);
    ctx.bezierCurveTo(w/2-baseW*1.3+wobble*0.3,h*(fl.yBase*0.5+fl.yTip*0.5),tipX-20+wobble*0.5,tipY+h*0.12,tipX,tipY);
    ctx.bezierCurveTo(tipX+20-wobble*0.5,tipY+h*0.12,w/2+baseW*1.3+wobble*0.3,h*(fl.yBase*0.5+fl.yTip*0.5),w/2+baseW,h*fl.yBase);
    ctx.closePath();ctx.fill();
  });
  ctx.globalAlpha=0.92;const coreY=h*0.65;
  const core=ctx.createRadialGradient(w/2,coreY,0,w/2,coreY,w*0.14);
  core.addColorStop(0,'rgba(255,255,255,1)');core.addColorStop(0.25,'rgba(255,255,200,0.9)');core.addColorStop(0.6,'rgba(255,200,50,0.5)');core.addColorStop(1,'rgba(255,100,0,0)');
  ctx.fillStyle=core;ctx.beginPath();ctx.ellipse(w/2,coreY,w*0.12,h*0.15,0,0,Math.PI*2);ctx.fill();
  const seed=frameIdx*137;
  for(let i=0;i<18;i++){const angle=((seed+i*61)%628)/100,radius=((seed+i*43)%100)/100*w*0.18,ex=w/2+Math.cos(angle)*radius,ey=h*0.3+Math.sin(angle)*h*0.25,size=0.8+((seed+i)%30)/30*2.5;ctx.globalAlpha=0.5+((seed+i)%50)/100;ctx.fillStyle=['#FF8800','#FFCC00','#FF4400','#FFAA00'][i%4];ctx.beginPath();ctx.arc(ex,ey,size,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
}

// ============ PROJECTS ============
function loadProjectsList(){try{return JSON.parse(localStorage.getItem('safwan_projects')||'[]');}catch{return[];}}
function saveProject(){
  const name=prompt('اسم المشروع:','مشروع '+new Date().toLocaleDateString('ar'));if(!name)return;
  const projects=loadProjectsList();projects.unshift({id:Date.now(),name,thumb:drawCanvas.toDataURL('image/jpeg',0.25),data:drawCanvas.toDataURL('image/png'),w:canvasW,h:canvasH,mode,date:new Date().toLocaleDateString('ar')});
  if(projects.length>24)projects.pop();localStorage.setItem('safwan_projects',JSON.stringify(projects));toast('✅ تم حفظ: '+name);
}
function openProjects(){
  const projects=loadProjectsList();const grid=document.getElementById('projectsGrid');grid.innerHTML='';
  if(projects.length===0){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:2rem">لا توجد مشاريع بعد</div>';}
  else{projects.forEach(p=>{const el=document.createElement('div');el.className='project-card';el.innerHTML=`<div class="project-thumb"><img src="${p.thumb}" style="width:100%;height:100%;object-fit:cover"></div><div class="project-info"><div class="project-name">${p.name}</div><div class="project-meta">${p.w}×${p.h} • ${p.mode==='animation'?'🎬':'🎨'} • ${p.date}</div></div>`;el.onclick=()=>{const img=new Image();img.onload=()=>{setupCanvasSize(p.w,p.h,null);drawCtx.drawImage(img,0,0);saveHistory();zoomFit();closeProjects();toast('✅ '+p.name);};img.src=p.data;};grid.appendChild(el);});}
  document.getElementById('projectsOverlay').classList.add('open');
}
function closeProjects(){document.getElementById('projectsOverlay').classList.remove('open');}
function openSettings(){document.getElementById('settingsOverlay').classList.add('open');}
function closeSettings(){document.getElementById('settingsOverlay').classList.remove('open');}
function switchTab(tab){['brush','color','layers','props'].forEach(t=>{const btn=document.getElementById('tab-'+t);const cnt=document.getElementById('content-'+t);if(btn)btn.classList.toggle('active',t===tab);if(cnt)cnt.style.display=t===tab?'block':'none';});}
function toggleTheme(){isDark=!isDark;document.body.classList.toggle('light-mode',!isDark);const btn=document.getElementById('themeBtn');if(btn)btn.innerHTML=isDark?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16"><circle cx="12" cy="12" r="5"/></svg>';const dt=document.getElementById('darkToggle');if(dt)dt.classList.toggle('on',isDark);}

document.addEventListener('keydown',e=>{
  const tag=e.target.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target.isContentEditable)return;
  const k=e.key.toLowerCase();
  if(e.ctrlKey||e.metaKey){
    switch(k){case 'z':e.preventDefault();doUndo();break;case 'y':e.preventDefault();doRedo();break;case 's':e.preventDefault();saveProject();break;case 'e':e.preventDefault();exportPNG();break;case 'n':e.preventDefault();showNewCanvas();break;case 'p':e.preventDefault();openProjects();break;case 'c':doCopy();break;case 'v':doPaste();break;case 'a':e.preventDefault();doSelectAll();break;case '=':case '+':e.preventDefault();zoomIn();break;case '-':e.preventDefault();zoomOut();break;case '0':e.preventDefault();zoomFit();break;}
  }else{
    switch(k){case 'b':setTool('brush');break;case 'e':setTool('eraser');break;case 'v':setTool('select');break;case 'h':setTool('pan');break;case 't':setTool('text');break;case 'i':setTool('eyedropper');break;case 'r':setTool('rect');break;case 'o':setTool('ellipse');break;case 'l':setTool('lasso');break;case 'w':setTool('magic-wand');break;case 'p':setTool('pencil');break;case 'f':setTool('fill');break;case 'z':setTool('zoom-tool');break;case 'u':setTool('line');break;case 'g':toggleGrid();break;
    case '[':brushSize=Math.max(1,brushSize-2);const bsEl=document.getElementById('brushSize');if(bsEl)bsEl.value=brushSize;updateBrush();break;
    case ']':brushSize=Math.min(300,brushSize+2);const bsEl2=document.getElementById('brushSize');if(bsEl2)bsEl2.value=brushSize;updateBrush();break;
    case 'arrowleft':if(mode==='animation'&&!isPlaying)framePrev();break;case 'arrowright':if(mode==='animation'&&!isPlaying)frameNext();break;
    case ' ':if(mode==='animation'){e.preventDefault();togglePlay();}break;}
  }
});

function toast(msg,dur=2200){const c=document.getElementById('toastContainer');if(!c)return;const el=document.createElement('div');el.className='toast';el.textContent=msg;c.appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';el.style.transition='all 0.3s';setTimeout(()=>el.remove(),300);},dur);}

// Extra: toggle button visuals for loop/onion
const _origToggleLoop = toggleLoop;
function toggleLoop() {
  loopPlay = !loopPlay;
  const btn = document.getElementById('loopBtn');
  if (btn) btn.style.color = loopPlay ? 'var(--accent2)' : 'var(--text2)';
  toast(loopPlay ? '🔁 تكرار مفعّل' : '▶ تشغيل مرة واحدة');
}
const _origToggleOnion = toggleOnionSkin;
function toggleOnionSkin() {
  onionSkin = !onionSkin;
  const btn = document.getElementById('onionBtn');
  if (btn) btn.style.color = onionSkin ? 'var(--accent3)' : 'var(--text2)';
  toast(onionSkin ? '🧅 بصل مفعّل' : '🧅 بصل مخفي');
  if (onionSkin && currentFrame > 0 && frames[currentFrame - 1]) {
    const prev = frames[currentFrame - 1];
    const tmp = document.createElement('canvas'); tmp.width = canvasW; tmp.height = canvasH;
    tmp.getContext('2d').putImageData(prev, 0, 0);
    drawCtx.save(); drawCtx.globalAlpha = 0.25;
    drawCtx.drawImage(tmp, 0, 0);
    drawCtx.restore();
  }
}
