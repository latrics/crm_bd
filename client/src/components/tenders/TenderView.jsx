import { useState } from 'react';
import useCRM from '../../hooks/useCRM.js';
import { fmt, today } from '../../utils/formatters.js';
import { daysBetween } from '../../utils/dateHelpers.js';
import Badge from '../common/Badge.jsx';
import { T_COLORS } from '../../constants/index.js';

export default function TenderView({ onTenderClick }) {
  const { state } = useCRM();
  
  return (
    <div className="rounded-xl overflow-hidden border border-brand-border bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead className="bg-brand-surfaceAlt text-[10px] font-bold uppercase tracking-wide text-brand-silver border-b border-brand-border">
          <tr>
            <th className="p-4 font-bold whitespace-nowrap">TENDER NO. -</th>
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
          {state.tenders.map(t => {
            const daysLeft = daysBetween(today(), t.closing_date);
            const isExpiring = daysLeft >= 0 && daysLeft <= 7;
            
            return (
              <tr 
                key={t._id} 
                onClick={() => onTenderClick && onTenderClick(t)}
                className="border-b border-brand-border last:border-0 hover:bg-brand-red/5 cursor-pointer transition-colors"
              >
                <td className="p-4 font-bold">{t.tender_no}</td>
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
          {state.tenders.length === 0 && (
            <tr>
              <td colSpan="11" className="p-16 text-center text-brand-silver text-sm">No tenders yet. Click Add Tender.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
