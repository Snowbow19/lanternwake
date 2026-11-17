const W=1040,H=480;
export const MINIMAP={x:855,y:342,w:160,h:74};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createCamera(){
  let x=W/2,y=H/2,zoom=1,overview=false;
  return{
    update(target,active){
      const nextZoom=active&&!overview?1.35:1;zoom+=(nextZoom-zoom)*.16;
      const halfW=W/(2*zoom),halfH=H/(2*zoom),tx=active?target.x:W/2,ty=active?target.y:H/2;
      x=clamp(x+(clamp(tx,halfW,W-halfW)-x)*.12,halfW,W-halfW);y=clamp(y+(clamp(ty,halfH,H-halfH)-y)*.12,halfH,H-halfH);
    },
    apply(ctx){ctx.translate(W/2-x*zoom,H/2-y*zoom);ctx.scale(zoom,zoom);},
    worldPoint(p){return{x:x+(p.x-W/2)/zoom,y:y+(p.y-H/2)/zoom};},
    mapPoint(p){const m=MINIMAP;if(p.x<m.x||p.x>m.x+m.w||p.y<m.y||p.y>m.y+m.h)return null;return{x:(p.x-m.x)/m.w*W,y:(p.y-m.y)/m.h*H};},
    bounds(){return{x:x-W/(2*zoom),y:y-H/(2*zoom),w:W/zoom,h:H/zoom};},
    toggle(){overview=!overview;return overview;},
    isOverview(){return overview;},
  };
}
