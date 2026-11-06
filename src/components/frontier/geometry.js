export function project(point, segment) {
  const [[ax,ay],[bx,by]]=segment, dx=bx-ax, dy=by-ay;
  const length=dx*dx+dy*dy;
  const t=length ? Math.max(0,Math.min(1,((point.x-ax)*dx+(point.y-ay)*dy)/length)) : 0;
  return {x:ax+t*dx,y:ay+t*dy};
}
export function nearestBoundary(grid, biome, point) {
  let best=null;
  for (const boundary of grid.boundaries) {
    if (boundary.biome!==biome) continue;
    for (const segment of boundary.segments) {
      const p=project(point,segment),distance=Math.hypot(p.x-point.x,p.y-point.y);
      if (!best || distance<best.distance) best={...p,distance,boundary_id:boundary.id,sectors:boundary.sectors};
    }
  }
  return best;
}
