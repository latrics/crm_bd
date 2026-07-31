import { useState } from 'react';
import useCRM from '../hooks/useCRM.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import DateFilter from '../components/dashboard/DateFilter.jsx';
import TargetAchievement from '../components/dashboard/TargetAchievement.jsx';
import PipelineBySector from '../components/dashboard/PipelineBySector.jsx';
import ChartCard from '../components/charts/ChartCard.jsx';
import ChartCanvas from '../components/charts/ChartCanvas.jsx';
import { getQuickRange, daysBetween } from '../utils/dateHelpers.js';
import { fmt } from '../utils/formatters.js';
import { LEAD_STAGES, OWNERS } from '../constants/index.js';
import { Users, Target, Percent, Trophy } from 'lucide-react';

export default function DashboardPage() {
  const { state } = useCRM();
  const [dateRange, setDateRange] = useState({ key: 'all_time', ...getQuickRange('all_time') });

  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  end.setHours(23, 59, 59, 999);

  const leads = (state.leads || []).filter(l => {
    if (!l || !l.createdAt) return false;
    const d = new Date(l.createdAt);
    return d >= start && d <= end;
  });

  const deals = (state.deals || []).filter(d => {
    if (!d) return false;
    const dDate = new Date(d.close_date || d.createdAt);
    if (isNaN(dDate)) return false;
    return dDate >= start && dDate <= end;
  });

  const totalLeadsValue = leads.reduce((acc, curr) => acc + (curr?.value || 0), 0);
  const wonDeals = deals.filter(d => d && d.stage === 'Won');
  const wonValue = wonDeals.reduce((acc, curr) => acc + (curr?.value || 0), 0);
  const lostDeals = deals.filter(d => d && d.stage === 'Lost');
  const lostValue = lostDeals.reduce((acc, curr) => acc + (curr?.value || 0), 0);
  const pipelineValue = totalLeadsValue - wonValue - lostValue;
  const convertedLeads = leads.filter(l => l && l.status === 'Converted').length;
  const activeLeads = leads.filter(l => l && l.status !== 'Converted').length;

  const topKpis = [
    { label: 'Leads Added', value: leads.length, icon: Users, color: 'bg-brand-surfaceAlt text-brand-silver' },
    { label: 'Won Deals', value: wonDeals.length, icon: Target, color: 'bg-brand-redLight text-brand-red', highlight: true },
    { label: 'Conversion Rate', value: `${leads.length ? Math.round((convertedLeads / leads.length) * 100) : 0}%`, icon: Percent, color: 'bg-brand-surfaceAlt text-brand-silver' },
    { label: 'Tenders Won', value: (state.tenders || []).filter(t => t && t.status === 'Won').length, icon: Trophy, color: 'bg-brand-surfaceAlt text-brand-silver' },
  ];

  const bottomKpis = [
    { label: 'Leads Added', value: leads.length, sub: 'total in range', icon: 'bg-brand-silver' },
    { label: 'Pipeline Value', value: fmt(pipelineValue), sub: 'unwon potential', icon: 'bg-brand-silver' },
    { label: 'Won Revenue', value: fmt(wonValue), sub: `${wonDeals.length} deals won`, icon: 'bg-brand-red', highlight: true },
    { label: 'Lost Revenue', value: fmt(lostValue), sub: `${lostDeals.length} deals lost`, icon: 'bg-brand-silver' },
    { label: 'Total Documents', value: (state.docs || []).length, sub: 'all time', icon: 'bg-brand-silver' },
  ];

  const dealPipeline = [
    { label: 'Negotiation', count: deals.filter(d=>d && d.stage==='Negotiation').length },
    { label: 'Won', count: wonDeals.length, highlight: true },
    { label: 'Lost', count: deals.filter(d=>d && d.stage==='Lost').length },
  ];

  const totalDealsForPipeline = dealPipeline.reduce((acc, curr) => acc + curr.count, 0) || 1;

  // Dynamic Chart Data Calculations with Uniform Time Buckets
  let effectiveStart = new Date(dateRange.start);
  let effectiveEnd = new Date(dateRange.end);
  effectiveEnd.setHours(23, 59, 59, 999);

  if (dateRange.key === 'all_time') {
    const allDates = [];
    (state.leads || []).forEach(l => {
      if (l?.createdAt) allDates.push(new Date(l.createdAt));
    });
    (state.deals || []).forEach(d => {
      if (d) {
        const dDate = new Date(d.close_date || d.createdAt);
        if (!isNaN(dDate)) allDates.push(dDate);
      }
    });

    if (allDates.length > 0) {
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      effectiveStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      effectiveEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      effectiveStart = new Date(now.getFullYear(), 0, 1);
      effectiveEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
  }

  let scale = 'day';
  if (dateRange.key === 'this_month' || dateRange.key === 'last_month' || dateRange.key === 'this_quarter') {
    scale = 'week';
  } else if (dateRange.key === 'this_year' || dateRange.key === 'all_time') {
    scale = 'month';
  } else if (dateRange.key === 'custom') {
    const diffDays = daysBetween(dateRange.start, dateRange.end);
    if (diffDays <= 15) {
      scale = 'day';
    } else if (diffDays <= 180) {
      scale = 'week';
    } else {
      scale = 'month';
    }
  }

  const buckets = [];
  if (scale === 'day') {
    let curr = new Date(effectiveStart);
    while (curr <= effectiveEnd) {
      const wStart = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate());
      const wEnd = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 23, 59, 59, 999);
      const label = curr.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      buckets.push({ label, startD: wStart, endD: wEnd });
      curr.setDate(curr.getDate() + 1);
    }
  } else if (scale === 'week') {
    let currentMonth = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), 1);
    const endMonth = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 1);
    
    while (currentMonth <= endMonth) {
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();
      const mLabel = currentMonth.toLocaleDateString('default', { month: 'short' });
      
      const monthWeeks = [
        { startDay: 1, endDay: 7 },
        { startDay: 8, endDay: 14 },
        { startDay: 15, endDay: 21 },
        { startDay: 22, endDay: 28 },
        { startDay: 29, endDay: lastDay }
      ].filter(w => w.startDay <= lastDay);
      
      monthWeeks.forEach((w, index) => {
        const wStart = new Date(y, m, w.startDay);
        const wEnd = new Date(y, m, w.endDay, 23, 59, 59, 999);
        if (wEnd >= effectiveStart && wStart <= effectiveEnd) {
          const label = w.startDay === w.endDay
            ? `W${index + 1} (${mLabel} ${w.startDay})`
            : `W${index + 1} (${mLabel} ${w.startDay}-${w.endDay})`;
          buckets.push({ label, startD: wStart, endD: wEnd });
        }
      });
      
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
  } else { // 'month'
    let currentMonth = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), 1);
    const endMonth = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 1);
    
    while (currentMonth <= endMonth) {
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();
      const wStart = new Date(y, m, 1);
      const wEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
      
      const mLabel = currentMonth.toLocaleDateString('default', { month: 'short' });
      const yr = currentMonth.getFullYear();
      const label = `${mLabel} ${yr}`;
      
      buckets.push({ label, startD: wStart, endD: wEnd });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
  }

  if (buckets.length === 0) {
    buckets.push({ label: 'No Data', startD: effectiveStart, endD: effectiveEnd });
  }

  const leadTrendLabels = buckets.map(b => b.label);
  const leadTrendDataArr = buckets.map(b => {
    let count = 0;
    leads.forEach(l => {
      if (l.createdAt) {
        const lDate = new Date(l.createdAt);
        if (lDate >= b.startD && lDate <= b.endD) {
          count++;
        }
      }
    });
    return count;
  });

  const revTrendLabels = buckets.map(b => b.label);
  const revTrendDataWon = buckets.map(b => {
    let sum = 0;
    deals.forEach(d => {
      const dDate = new Date(d.close_date || d.createdAt);
      if (!isNaN(dDate) && d.stage === 'Won' && dDate >= b.startD && dDate <= b.endD) {
        sum += d.value || 0;
      }
    });
    return sum;
  });

  const revTrendDataLost = buckets.map(b => {
    let sum = 0;
    deals.forEach(d => {
      const dDate = new Date(d.close_date || d.createdAt);
      if (!isNaN(dDate) && d.stage === 'Lost' && dDate >= b.startD && dDate <= b.endD) {
        sum += d.value || 0;
      }
    });
    return sum;
  });

  const revTrendDataPipeline = buckets.map((b, i) => {
    let leadSum = 0;
    leads.forEach(l => {
      if (l.createdAt) {
        const lDate = new Date(l.createdAt);
        if (lDate >= b.startD && lDate <= b.endD) {
          leadSum += l.value || 0;
        }
      }
    });
    return leadSum - revTrendDataWon[i] - revTrendDataLost[i];
  });


  const pipelineDistData = LEAD_STAGES.map(stage => leads.filter(l => l.status === stage).length);

  const allUniqueOwners = Array.from(new Set([
    ...OWNERS.filter(o => o !== 'Others'),
    ...leads.map(l => l.owner).filter(Boolean)
  ]));

  const leadsByOwner = allUniqueOwners.map(owner => ({
    owner,
    count: leads.filter(l => l.owner === owner).length
  })).sort((a,b) => b.count - a.count);

  const maxOwnerCount = Math.max(...leadsByOwner.map(o => o.count), 1);

  return (
    <div className="w-full pb-12">
      <PageHeader 
        title="Overview" 
        subtitle="Live analytics • all data auto-saved"
      />
      
      <DateFilter range={dateRange} setRange={setDateRange} />
      
      <div className="mb-8">
        <TargetAchievement 
          actuals={{ 
            partners: leads.filter(l => l && l.status === 'Closure').length + wonDeals.length, 
            droneSales: wonDeals.length 
          }} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topKpis.map((kpi, i) => (
            <div key={i} className={`bg-white border rounded-crm p-5 shadow-sm flex items-center gap-4 ${kpi.highlight ? 'border-brand-red/20' : 'border-brand-border'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${kpi.color}`}>
                <kpi.icon className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <div className={`font-serif text-2xl font-black ${kpi.highlight ? 'text-brand-red' : 'text-brand-text'}`}>
                  {kpi.value}
                </div>
                <div className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ChartCard title="Leads Trend">
          <div className="h-64">
            <ChartCanvas 
              type="line" 
              data={{
                labels: leadTrendLabels,
                datasets: [{
                  label: 'Leads',
                  data: leadTrendDataArr,
                  borderColor: '#DA291C',
                  backgroundColor: 'rgba(218, 41, 28, 0.05)',
                  borderWidth: 3,
                  tension: 0.4,
                  pointRadius: (ctx) => (ctx.raw > 0 ? 5 : 0),
                  pointHoverRadius: 7,
                  pointBackgroundColor: '#DA291C',
                  pointBorderColor: '#FFFFFF',
                  pointBorderWidth: 2,
                  fill: true
                }]
              }}
              options={{
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                scales: {
                  y: {
                    min: 0,
                    ticks: {
                      precision: 0,
                      stepSize: 1
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </ChartCard>
        <ChartCard title="Pipeline Distribution">
          <div className="h-64">
            <ChartCanvas 
              type="bar" 
              data={{
                labels: LEAD_STAGES.map((stage, idx) => `${stage} (${pipelineDistData[idx] || 0})`),
                datasets: [{
                  label: 'Leads',
                  data: pipelineDistData,
                  backgroundColor: [
                    '#FCDEDE',
                    '#F9B3B3',
                    '#F27B7B',
                    '#E94D4D',
                    '#DA291C',
                    '#9A160F'
                  ],
                  barThickness: 40
                }]
              }}
              options={{
                scales: {
                  y: {
                    min: 0,
                    ticks: {
                      precision: 0,
                      stepSize: 1
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      title: (items) => items[0].label.split(' (')[0],
                      label: (item) => `Leads: ${item.raw}`
                    }
                  }
                }
              }}
            />
          </div>
        </ChartCard>
        <ChartCard title="Conversion Rate">
          <div className="h-64 flex flex-col items-center justify-center relative">
             <div className="w-48">
              <ChartCanvas type="doughnut" data={{
                labels: ['Converted', 'Active'],
                datasets: [{ data: [convertedLeads, activeLeads], backgroundColor: ['#DA291C', '#D1D5DB'] }]
              }} options={{ plugins: { legend: { display: false } } }} />
            </div>
            <div className="flex gap-4 mt-6 text-[10px] font-bold text-brand-silver">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brand-red"></div> Converted: {convertedLeads}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-brand-silver"></div> Active: {activeLeads}</div>
            </div>
          </div>
        </ChartCard>
        <ChartCard title="Revenue Trend">
          <div className="h-64">
            <ChartCanvas 
              type="line" 
              data={{
                labels: revTrendLabels,
                datasets: [
                  { 
                    label: 'Pipeline', 
                    data: revTrendDataPipeline, 
                    borderColor: '#54585A', 
                    backgroundColor: 'rgba(84, 88, 90, 0.03)', 
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: (ctx) => (ctx.raw > 0 ? 5 : 0),
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#54585A',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    fill: true
                  },
                  { 
                    label: 'Won', 
                    data: revTrendDataWon, 
                    borderColor: '#DA291C', 
                    backgroundColor: 'rgba(218, 41, 28, 0.03)', 
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: (ctx) => (ctx.raw > 0 ? 5 : 0),
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#DA291C',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    fill: true
                  },
                  { 
                    label: 'Lost', 
                    data: revTrendDataLost, 
                    borderColor: '#F9B3B3', 
                    backgroundColor: 'rgba(249, 179, 179, 0.03)', 
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: (ctx) => (ctx.raw > 0 ? 5 : 0),
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#F9B3B3',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    fill: true
                  }
                ]
              }} 
              options={{ 
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                scales: {
                  y: {
                    min: 0,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                plugins: { 
                  legend: { 
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      boxWidth: 8
                    }
                  } 
                } 
              }} 
            />
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ChartCard title="DEAL PIPELINE">
          <div className="flex flex-col gap-6 py-4">
            {dealPipeline.map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-brand-text">{item.label}</span>
                  <span className="text-xs font-bold text-brand-text">{item.count}</span>
                </div>
                <div className="h-2 bg-brand-surfaceAlt rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.highlight ? 'bg-brand-red' : 'bg-brand-silver'}`} style={{ width: `${(item.count / totalDealsForPipeline) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="LEADS BY OWNER">
          <div className="flex flex-col gap-6 py-4">
            {leadsByOwner.map(item => (
              <div key={item.owner}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-brand-text">{item.owner}</span>
                  <span className="text-xs font-bold text-brand-text">{item.count}</span>
                </div>
                <div className="h-2 bg-brand-surfaceAlt rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-brand-charcoal" style={{ width: `${(item.count / maxOwnerCount) * 100}%` }} />
                </div>
              </div>
            ))}
            {leadsByOwner.length === 0 && (
              <div className="text-center text-brand-silver text-sm font-bold py-8">No data</div>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {bottomKpis.map((kpi, i) => (
            <div key={i} className={`bg-white border rounded-crm p-5 shadow-sm flex flex-col justify-center min-h-[110px] ${kpi.highlight ? 'border-brand-red/20' : 'border-brand-border'}`}>
              <div>
                <div className={`font-serif text-xl font-black mb-1 ${kpi.highlight ? 'text-brand-red' : 'text-brand-text'}`}>
                  {kpi.value || '0'}
                </div>
                <div className="text-[10px] font-bold text-brand-text uppercase tracking-wider">{kpi.label}</div>
                <div className="text-[9px] text-brand-silver mt-0.5">{kpi.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <PipelineBySector leads={leads} deals={deals} />
      </div>

    </div>
  );
}
