import { useState } from 'react';

export default function AdminMasterData() {
  const [activeTab, setActiveTab] = useState('Pipeline Stages');
  const tabs = ['Pipeline Stages', 'Deal Stages', 'Tender Statuses', 'Sectors'];

  const [data, setData] = useState({
    'Pipeline Stages': ['New', 'Qualified', 'Proposal', 'Negotiation', 'Closure'],
    'Deal Stages': ['Prospect', 'Meeting', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    'Tender Statuses': ['New', 'Under Preparation', 'Submitted', 'Evaluation', 'Awarded', 'Lost'],
    'Sectors': ['Government', 'Defense', 'Private Enterprise', 'Agriculture', 'Mining']
  });

  const activeItems = data[activeTab];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">Master Data Configuration</h1>
        <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Manage stages • statuses • sectors</p>
      </div>

      <div className="flex border-b border-gray-200 mb-8">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-brand-silver hover:text-brand-charcoal'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6">
        <div className="space-y-3 mb-6">
          {activeItems.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-3.5 border border-gray-100 rounded-lg bg-gray-50/50 hover:bg-gray-50 hover:shadow-sm hover:border-gray-200 group transition-all duration-200">
              <div className="text-brand-silver/50 cursor-grab active:cursor-grabbing group-hover:text-brand-silver transition-colors">
                ☰
              </div>
              <div className="flex-1 font-semibold text-brand-charcoal text-sm">
                {item}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-brand-charcoal hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all bg-transparent">
                  Edit
                </button>
                <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-brand-red hover:bg-red-50 transition-all bg-transparent">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <button className="flex items-center gap-2.5 text-brand-red font-semibold text-sm hover:text-brand-red/80 transition-colors group">
          <div className="w-6 h-6 rounded-full bg-brand-red/[0.08] text-brand-red flex items-center justify-center font-bold pb-0.5 transition-all group-hover:bg-brand-red group-hover:text-white">
            +
          </div>
          Add New {activeTab.replace(/s$/, '')}
        </button>
      </div>
    </div>
  );
}

