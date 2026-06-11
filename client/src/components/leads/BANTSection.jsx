import { BANT_DEFS } from '../../constants/index.js';
import Field from '../common/Field.jsx';

export default function BANTSection({ lead, onChange }) {
  return (
    <div className="bg-brand-surfaceAlt border border-brand-border rounded-crm p-4 mt-4">
      <h4 className="text-sm font-bold text-brand-text mb-4">Lead Scoring (BANT)</h4>
      <div className="grid grid-cols-2 gap-4">
        {BANT_DEFS.map(def => (
          <Field 
            key={def.key}
            type="select"
            label={def.label}
            placeholder="-- Not scored --"
            options={def.opts.map(o => ({ value: o.v, label: o.l }))}
            value={lead[def.key] || ''}
            onChange={(e) => onChange(def.key, e.target.value === '' ? 0 : Number(e.target.value))}
          />
        ))}
      </div>
    </div>
  );
}
