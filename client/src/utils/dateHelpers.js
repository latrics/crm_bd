export function getQuickRange(key) {
  const n=new Date(), y=n.getFullYear(), m=n.getMonth();
  if (key==='this_month') return { start:new Date(y,m,1).toISOString().slice(0,10), end:new Date(y,m+1,0).toISOString().slice(0,10) };
  if (key==='last_month') return { start:new Date(y,m-1,1).toISOString().slice(0,10), end:new Date(y,m,0).toISOString().slice(0,10) };
  if (key==='this_quarter') { const q=Math.floor(m/3); return { start:new Date(y,q*3,1).toISOString().slice(0,10), end:new Date(y,q*3+3,0).toISOString().slice(0,10) }; }
  if (key==='this_year') return { start:y+'-01-01', end:y+'-12-31' };
  if (key==='all_time') return { start:'2020-01-01', end:'2099-12-31' };
  return { start:'2020-01-01', end:'2099-12-31' };
}

export const daysBetween = (s,e) => Math.round((new Date(e)-new Date(s))/86400000);

export function buildTimeline(start, end) {
  const arr = [];
  let curr = new Date(start);
  const endD = new Date(end);
  while(curr <= endD) {
    arr.push(curr.toISOString().slice(0,10));
    curr.setDate(curr.getDate() + 1);
  }
  return arr;
}
