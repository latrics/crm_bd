import { useState } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { fmt, today } from '../../utils/formatters.js';
import { daysBetween } from '../../utils/dateHelpers.js';
import Badge from '../common/Badge.jsx';
import { T_COLORS } from '../../constants/index.js';

export default function TenderView({ onTenderClick, search = '', selectedLocation = 'all', activeStatusFilter = 'all' }) {
  const { state } = useCRM();

  let filteredTenders = state.tenders || [];

  if (activeStatusFilter && activeStatusFilter !== 'all') {
    filteredTenders = filteredTenders.filter(t => t && t.status === activeStatusFilter);
  }

  if (selectedLocation && selectedLocation !== 'all' && selectedLocation !== 'statewise') {
    filteredTenders = filteredTenders.filter(t => t && (t.location || '').toLowerCase() === selectedLocation.toLowerCase());
  }

  if (search && search.trim()) {
    const match = search.match(/^(location|authority|portal|status|tender_id|latrics_id):\s*(.*)$/i);
    if (match) {
      const field = match[1].toLowerCase();
      const val = match[2].toLowerCase();
      const keyMap = {
        location: 'location',
        authority: 'authority',
        portal: 'portal',
        status: 'status',
        tender_id: 'tender_id',
        latrics_id: 'latrics_tender_id'
      };
      const key = keyMap[field] || field;
      filteredTenders = filteredTenders.filter(t => t && (t[key] || '').toLowerCase().includes(val));
    } else {
      const query = search.trim().toLowerCase();
      filteredTenders = filteredTenders.filter(t => 
        t && (
          (t.latrics_tender_id || '').toLowerCase().includes(query) ||
          (t.tender_id || '').toLowerCase().includes(query) ||
          (t.tender_no || '').toLowerCase().includes(query) ||
          (t.authority || '').toLowerCase().includes(query) ||
          (t.portal || '').toLowerCase().includes(query) ||
          (t.location || '').toLowerCase().includes(query) ||
          (t.description || '').toLowerCase().includes(query)
        )
      );
    }
  }

  const renderTable = (tendersList) => (
    <div className="rounded-xl overflow-hidden border border-brand-border bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1400px]">
        <thead className="bg-brand-surfaceAlt text-[10px] font-bold uppercase tracking-wide text-brand-silver border-b border-brand-border">
          <tr>
            <th className="p-4 font-bold whitespace-nowrap">LATRICS ID -</th>
            <th className="p-4 font-bold whitespace-nowrap">TENDER ID -</th>
            <th className="p-4 font-bold whitespace-nowrap">PORTAL -</th>
            <th className="p-4 font-bold whitespace-nowrap">DOCS -</th>
            <th className="p-4 font-bold whitespace-nowrap">AUTHORITY -</th>
            <th className="p-4 font-bold whitespace-nowrap">DESCRIPTION -</th>
            <th className="p-4 font-bold whitespace-nowrap">LOCATION -</th>
            <th className="p-4 font-bold whitespace-nowrap">OPENING -</th>
            <th className="p-4 font-bold whitespace-nowrap">CLOSING -</th>
            <th className="p-4 font-bold whitespace-nowrap">AMOUNT -</th>
            <th className="p-4 font-bold whitespace-nowrap">EMD -</th>
            <th className="p-4 font-bold whitespace-nowrap">JV -</th>
            <th className="p-4 font-bold whitespace-nowrap">STATUS -</th>
            <th className="p-4 font-bold whitespace-nowrap text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="text-sm text-brand-text">
          {tendersList.map(t => {
            const daysLeft = daysBetween(today(), t.closing_date);
            const isExpiring = daysLeft >= 0 && daysLeft <= 7;
            
            return (
              <tr 
                key={t._id} 
                onClick={() => onTenderClick && onTenderClick(t)}
                className="border-b border-brand-border last:border-0 hover:bg-brand-red/5 cursor-pointer transition-colors"
              >
                <td className="p-4">
                  <span className="text-xs font-mono font-bold text-brand-red bg-brand-red/[0.05] border border-brand-red/10 px-2 py-1 rounded-md">
                    {t.latrics_tender_id || 'N/A'}
                  </span>
                </td>
                <td className="p-4 font-bold text-xs">{t.tender_id || t.tender_no || '--'}</td>
                <td className="p-4 text-xs font-bold text-brand-text">
                  {t.portal ? (
                    <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-[10px] uppercase font-bold text-gray-700">
                      {t.portal}
                    </span>
                  ) : '--'}
                </td>
                <td className="p-4">
                  {t.doc_link ? (
                    <a
                      href={t.doc_link.startsWith('http') ? t.doc_link : `https://${t.doc_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-red hover:text-red-700 hover:underline bg-brand-redLight/40 px-2.5 py-1 rounded-lg border border-brand-red/20 transition-all shadow-xs"
                    >
                      Docs ↗
                    </a>
                  ) : (
                    <span className="text-xs text-brand-silver">--</span>
                  )}
                </td>
                <td className="p-4 max-w-[150px] truncate">{t.authority}</td>
                <td className="p-4 max-w-[200px] truncate text-xs text-brand-silver">{t.description || '--'}</td>
                <td className="p-4 text-xs">{t.location || '--'}</td>
                <td className="p-4 text-xs">{t.opening_date || '--'}</td>
                <td className="p-4">
                  <span className={`text-xs ${isExpiring ? 'text-amber-600 font-bold' : ''}`}>
                    {t.closing_date || '--'}
                    {isExpiring && <span className="ml-2 font-black">!</span>}
                  </span>
                </td>
                <td className="p-4 font-bold">{fmt(t.amount)}</td>
                <td className="p-4 text-xs text-brand-silver">
                  <div>{t.emd}</div>
                  {t.emd_amount > 0 && <div className="font-bold text-brand-text">{fmt(t.emd_amount)}</div>}
                </td>
                <td className="p-4 text-xs text-brand-silver">
                  <div>{t.jv}</div>
                  {t.jv_partner && <div className="font-bold text-brand-text">{t.jv_partner}</div>}
                </td>
                <td className="p-4">
                  <Badge label={t.status} color={T_COLORS[t.status] || '#8A8D8F'} />
                </td>
                <td className="p-4 text-right">
                  <button className="text-brand-silver hover:text-brand-text font-bold text-xs bg-brand-surfaceAlt px-3 py-1.5 rounded-lg border border-brand-border">Edit</button>
                </td>
              </tr>
            );
          })}
          {tendersList.length === 0 && (
            <tr>
              <td colSpan="14" className="p-16 text-center text-brand-silver text-sm font-bold opacity-70">
                {state.tenders.length === 0 ? 'No tenders yet. Click Add Tender or Import.' : 'No matching tenders found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (selectedLocation === 'statewise') {
    const grouped = filteredTenders.reduce((acc, t) => {
      const loc = (t.location && t.location.trim()) ? t.location.trim() : 'Unspecified Location';
      if (!acc[loc]) acc[loc] = [];
      acc[loc].push(t);
      return acc;
    }, {});

    const stateKeys = Object.keys(grouped).sort();

    if (stateKeys.length === 0) {
      return (
        <div className="bg-white p-12 text-center rounded-xl border border-brand-border text-brand-silver font-bold">
          No matching tenders found for state-wise grouping.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-8">
        {stateKeys.map(stateName => {
          const stateTenders = grouped[stateName];
          const totalValue = stateTenders.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

          return (
            <div key={stateName} className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-white px-5 py-3 border border-brand-border rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-brand-red"></span>
                  <h3 className="text-base font-serif font-bold text-brand-text">{stateName}</h3>
                  <span className="px-2.5 py-0.5 bg-brand-surfaceAlt border border-brand-border text-brand-silver text-xs font-bold rounded-full">
                    {stateTenders.length} {stateTenders.length === 1 ? 'Tender' : 'Tenders'}
                  </span>
                </div>
                <div className="text-xs font-bold text-brand-silver">
                  Total Amount: <span className="text-brand-text font-serif font-black text-sm ml-1">{fmt(totalValue)}</span>
                </div>
              </div>
              {renderTable(stateTenders)}
            </div>
          );
        })}
      </div>
    );
  }

  return renderTable(filteredTenders);
}
