import { useState } from 'react';
import useCRM from '../hooks/useCRM.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import DateFilter from '../components/dashboard/DateFilter.jsx';
import TargetAchievement from '../components/dashboard/TargetAchievement.jsx';
import PipelineBySector from '../components/dashboard/PipelineBySector.jsx';
import ChartCard from '../components/charts/ChartCard.jsx';
import ChartCanvas from '../components/charts/ChartCanvas.jsx';
import { getQuickRange } from '../utils/dateHelpers.js';
import { fmt } from '../utils/formatters.js';
import { LEAD_STAGES, OWNERS } from '../constants/index.js';

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

  const wonDeals = deals.filter(d => d && d.stage === 'Won');
  const pipelineValue = deals.reduce((acc, curr) => acc + (curr?.value || 0), 0);
  const wonValue = wonDeals.reduce((acc, curr) => acc + (curr?.value || 0), 0);
  const weightedValue = deals.reduce((acc, curr) => acc + ((curr?.value || 0) * (curr?.probability || 0) / 100), 0);
  const convertedLeads = leads.filter(l => l && l.status === 'Converted').length;
  const activeLeads = leads.filter(l => l && l.status !== 'Converted').length;

  const topKpis = [
    { label: 'Leads Added', value: leads.length, icon: '👤', color: 'bg-brand-surfaceAlt text-brand-silver' },
    { label: 'Won Deals', value: wonDeals.length, icon: '🎯', color: 'bg-brand-redLight text-brand-red', highlight: true },
    { label: 'Conversion Rate', value: `${leads.length ? Math.round((convertedLeads / leads.length) * 100) : 0}%`, icon: '%', color: 'bg-brand-surfaceAlt text-brand-silver' },
    { label: 'Tenders Won', value: (state.tenders || []).filter(t => t && t.status === 'Won').length, icon: '🏆', color: 'bg-brand-surfaceAlt text-brand-silver' },
  ];

  const bottomKpis = [
    { label: 'Leads Added', value: leads.length, sub: 'total in range', icon: 'bg-brand-silver' },
    { label: 'Pipeline Value', value: fmt(pipelineValue), sub: `${deals.length} active deals`, icon: 'bg-brand-silver' },
    { label: 'Weighted Forecast', value: fmt(weightedValue), sub: 'probability-adjusted', icon: 'bg-brand-silver' },
    { label: 'Won Revenue', value: fmt(wonValue), sub: `${wonDeals.length} deals closed`, icon: 'bg-brand-red', highlight: true },
    { label: 'Converted Leads', value: convertedLeads, sub: 'leads → deals', icon: 'bg-brand-red' },
    { label: 'Total Documents', value: (state.docs || []).length, sub: 'all time', icon: 'bg-brand-silver' },
  ];

  const dealPipeline = [
    { label: 'Negotiation', count: deals.filter(d=>d && d.stage==='Negotiation').length },
    { label: 'Won', count: wonDeals.length, highlight: true },
    { label: 'Lost', count: deals.filter(d=>d && d.stage==='Lost').length },
  ];

  const totalDealsForPipeline = dealPipeline.reduce((acc, curr) => acc + curr.count, 0) || 1;

  // Chart Data Calculations
  const leadTrendMap = {};
  leads.forEach(l => {
    if (!l.createdAt) return;
    const dStr = new Date(l.createdAt).toISOString().split('T')[0];
    leadTrendMap[dStr] = (leadTrendMap[dStr] || 0) + 1;
  });
  const leadTrendKeys = Object.keys(leadTrendMap).sort();
  const leadTrendLabels = leadTrendKeys.length ? leadTrendKeys.map(k => new Date(k).toLocaleDateString('default', { month: 'short', day: 'numeric' })) : ['No Data'];
  const leadTrendDataArr = leadTrendKeys.length ? leadTrendKeys.map(k => leadTrendMap[k]) : [0];

  const revTrendMap = {};
  const weightTrendMap = {};
  deals.forEach(d => {
    const dObj = new Date(d.close_date || d.createdAt);
    if (isNaN(dObj)) return;
    const dStr = dObj.toISOString().split('T')[0];
    if (d.stage === 'Won') {
      revTrendMap[dStr] = (revTrendMap[dStr] || 0) + (d.value || 0);
    }
    weightTrendMap[dStr] = (weightTrendMap[dStr] || 0) + ((d.value || 0) * (d.probability || 0) / 100);
  });
  const revKeys = Array.from(new Set([...Object.keys(revTrendMap), ...Object.keys(weightTrendMap)])).sort();
  const revTrendLabels = revKeys.length ? revKeys.map(k => new Date(k).toLocaleDateString('default', { month: 'short', day: 'numeric' })) : ['No Data'];
  const revTrendDataWon = revKeys.length ? revKeys.map(k => revTrendMap[k] || 0) : [0];
  const revTrendDataWeighted = revKeys.length ? revKeys.map(k => weightTrendMap[k] || 0) : [0];

  const pipelineDistData = LEAD_STAGES.map(stage => leads.filter(l => l.stage === stage).length);

  const leadsByOwner = OWNERS.map(owner => ({
    owner,
    count: leads.filter(l => l.owner === owner).length
  })).sort((a,b) => b.count - a.count);

  const maxOwnerCount = Math.max(...leadsByOwner.map(o => o.count), 1);

  return (
    <div className="max-w-[1200px] mx-auto pb-12 px-6">
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
                {kpi.icon}
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
            <ChartCanvas type="line" data={{
              labels: leadTrendLabels,
              datasets: [{ label: 'Leads', data: leadTrendDataArr, borderColor: '#DA291C', backgroundColor: '#DA291C', borderWidth: 4, pointRadius: 2 }]
            }} />
          </div>
        </ChartCard>
        <ChartCard title="Pipeline Distribution">
          <div className="h-64">
            <ChartCanvas type="bar" data={{
              labels: LEAD_STAGES,
              datasets: [{ label: 'Leads', data: pipelineDistData, backgroundColor: '#E5E7EB', barThickness: 40 }]
            }} />
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
            <ChartCanvas type="line" data={{
              labels: revTrendLabels,
              datasets: [{ label: 'Won', data: revTrendDataWon, borderColor: '#DA291C', backgroundColor: '#DA291C' },
                         { label: 'Weighted', data: revTrendDataWeighted, borderColor: '#54585A', backgroundColor: '#54585A' }]
            }} options={{ plugins: { legend: { position: 'bottom' } } }} />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {bottomKpis.map((kpi, i) => (
            <div key={i} className={`bg-white border rounded-crm p-5 shadow-sm flex flex-col justify-between min-h-[120px] ${kpi.highlight ? 'border-brand-red/20' : 'border-brand-border'}`}>
              <div className="flex mb-4">
                <div className={`w-3 h-1 rounded-full ${kpi.icon}`}></div>
              </div>
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
