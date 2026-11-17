export function bindInput(canvas,callbacks) {
  const held=new Set();
  const snapshot=()=>({left:held.has('a')||held.has('arrowleft'),right:held.has('d')||held.has('arrowright'),up:held.has('w')||held.has('arrowup'),down:held.has('s')||held.has('arrowdown'),boost:held.has('shift')});
  window.addEventListener('keydown',e=>{
    if(e.target instanceof HTMLButtonElement&&(e.key===' '||e.key==='Enter'))return;
    const key=e.key.toLowerCase();
    if([' ','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key))e.preventDefault();
    if(!e.repeat){if(key===' ')callbacks.tow();if(key==='e')callbacks.flare();if(key==='p'||key==='escape')callbacks.pause();if(key==='r')callbacks.retry();}
    held.add(key);
  });
  window.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{held.clear();callbacks.blur();});
  canvas.addEventListener('pointerdown',e=>{
    const rect=canvas.getBoundingClientRect();callbacks.waypoint({x:(e.clientX-rect.left)/rect.width*1040,y:(e.clientY-rect.top)/rect.height*480});canvas.focus({preventScroll:true});
  });
  return {snapshot,clear:()=>held.clear(),focus:()=>canvas.focus({preventScroll:true})};
}
