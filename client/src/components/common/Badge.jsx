export default function Badge({ label, color }) {
  return (
    <span style={{
      background: `${color}18`,
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: 6,
      padding: '2px 10px',
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
