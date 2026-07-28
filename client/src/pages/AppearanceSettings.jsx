import { useTheme } from '../context/ThemeContext.jsx';
import { Palette, Layout, Type, Sparkles, CheckCircle2, RotateCcw, Sliders, Moon, Sun } from 'lucide-react';

export default function AppearanceSettings() {
  const { settings, updateSetting, resetTheme, COLOR_THEMES } = useTheme();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-xl font-serif font-black text-brand-text">Appearance & Theme Settings</h1>
          <p className="text-xs text-brand-silver font-medium mt-0.5">
            Regulate global page padding, brand colors, fonts, and layout density for the entire CRM.
          </p>
        </div>
        <button
          onClick={resetTheme}
          className="flex items-center gap-2 bg-white border border-brand-border text-brand-silver hover:text-brand-text hover:bg-brand-surfaceAlt px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white border border-brand-border/60 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-8">
        
        {/* Section 1: Page Side Padding Regulation */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layout className="w-4 h-4 text-brand-red" />
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">Page Side Padding</h3>
          </div>
          <p className="text-[10px] text-brand-silver font-medium mb-4">
            Adjust the standard horizontal spacing applied across all CRM screens. (Default: 32px)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '24px (Compact)', value: '24px', desc: 'Compact margin' },
              { label: '32px (Standard)', value: '32px', desc: 'Default 32px padding' },
              { label: '48px (Relaxed)', value: '48px', desc: 'Extra breathable' },
              { label: '64px (Spacious)', value: '64px', desc: 'Wide widescreen margin' },
            ].map(p => {
              const isSelected = settings.paddingX === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateSetting('paddingX', p.value)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-brand-red bg-brand-red/[0.04] text-brand-red shadow-xs font-bold' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{p.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-red shrink-0" />}
                  </div>
                  <span className="text-[9px] text-brand-silver mt-2 block">{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-brand-border/60" />

        {/* Section 2: Brand Color Scheme */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-brand-red" />
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">Brand Color Theme</h3>
          </div>
          <p className="text-[10px] text-brand-silver font-medium mb-4">
            Select the primary brand accent color used for navigation, active indicators, and buttons.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(COLOR_THEMES).map(([key, themeObj]) => {
              const isSelected = settings.themeColor === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateSetting('themeColor', key)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-3 ${
                    isSelected 
                      ? 'border-brand-red bg-brand-red/[0.04] shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-6 h-6 rounded-full border border-black/10 shadow-xs" 
                      style={{ backgroundColor: themeObj.hex }} 
                    />
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-red shrink-0" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{themeObj.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-brand-border/60" />

        {/* Section 3: Typography & Fonts */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-4 h-4 text-brand-red" />
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">Font Family</h3>
          </div>
          <p className="text-[10px] text-brand-silver font-medium mb-4">
            Choose your preferred font typeface for titles, headings, and application body text.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Inter (Default)', value: 'Inter', sample: 'Clean modern sans-serif' },
              { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans', sample: 'Sleek premium typography' },
              { label: 'Outfit', value: 'Outfit', sample: 'Geometric geometric font' },
              { label: 'Roboto', value: 'Roboto', sample: 'Classic Google font' },
            ].map(f => {
              const isSelected = settings.fontFamily === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => updateSetting('fontFamily', f.value)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-brand-red bg-brand-red/[0.04] shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{f.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-red shrink-0" />}
                  </div>
                  <span className="text-[10px] text-brand-silver mt-2 block italic">{f.sample}</span>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-brand-border/60" />

        {/* Section 4: Display Mode & Corner Radius */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Mode Selection */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-brand-red" />
              <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">Appearance Mode</h3>
            </div>
            <p className="text-[10px] text-brand-silver font-medium mb-4">
              Toggle between standard Light Mode and Dark Mode.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateSetting('mode', 'light')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  settings.mode === 'light' 
                    ? 'border-brand-red bg-brand-red/[0.04] text-brand-red font-bold shadow-xs' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="w-4 h-4" />
                  <span className="text-xs font-bold">Light Mode</span>
                </div>
                {settings.mode === 'light' && <CheckCircle2 className="w-4 h-4 text-brand-red" />}
              </button>

              <button
                type="button"
                onClick={() => updateSetting('mode', 'dark')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  settings.mode === 'dark' 
                    ? 'border-brand-red bg-brand-red/[0.04] text-brand-red font-bold shadow-xs' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4" />
                  <span className="text-xs font-bold">Dark Mode</span>
                </div>
                {settings.mode === 'dark' && <CheckCircle2 className="w-4 h-4 text-brand-red" />}
              </button>
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-brand-red" />
              <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest">Corner Radius</h3>
            </div>
            <p className="text-[10px] text-brand-silver font-medium mb-4">
              Control the roundness of cards, inputs, and modal borders.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Rounded 3xl (24px)', value: 'rounded-3xl' },
                { label: 'Rounded XL (16px)', value: 'rounded-xl' },
              ].map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => updateSetting('borderRadius', r.value)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    settings.borderRadius === r.value 
                      ? 'border-brand-red bg-brand-red/[0.04] text-brand-red font-bold shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{r.label}</span>
                  {settings.borderRadius === r.value && <CheckCircle2 className="w-4 h-4 text-brand-red" />}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
