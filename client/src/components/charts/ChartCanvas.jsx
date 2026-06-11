import { Line, Bar, Doughnut } from 'react-chartjs-2';

export default function ChartCanvas({ type, data, options }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
    },
    ...options
  };

  if (type === 'line') return <Line data={data} options={defaultOptions} />;
  if (type === 'doughnut') return <Doughnut data={data} options={defaultOptions} />;
  return <Bar data={data} options={defaultOptions} />;
}
