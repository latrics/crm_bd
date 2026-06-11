export const bantScore = l => (Number(l.bant_b)||0)+(Number(l.bant_a)||0)+(Number(l.bant_n)||0)+(Number(l.bant_t)||0);
export const bantCat = s => {
  if (s>=16) return { label:'Hot',     color:'#DC2626', bg:'#FEF2F2' };
  if (s>=11) return { label:'Warm',    color:'#D97706', bg:'#FFFBEB' };
  if (s>=6)  return { label:'Cold',    color:'#2563EB', bg:'#EFF6FF' };
  if (s>=1)  return { label:'Nurture', color:'#16a34a', bg:'#F0FDF4' };
  return { label:'Unscored', color:'#8A8D8F', bg:'#F0F0F0' };
};
