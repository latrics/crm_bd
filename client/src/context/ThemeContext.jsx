import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const DEFAULT_SETTINGS = {
  paddingX: '64px', // Standard 64px padding default for clear visible side margins
  themeColor: 'red', // Latrics Red (#DA291C)
  fontFamily: 'Inter', // Default CRM Font
  fontSize: 'medium', // Medium font scale
  borderRadius: 'rounded-3xl', // Rounded 3xl default
  mode: 'light' // Light mode default
};

export const COLOR_THEMES = {
  red: { name: 'Latrics Red', hex: '#DA291C', bgLight: '#FEF2F2', borderLight: '#FECACA', text: '#DA291C' },
  indigo: { name: 'Royal Indigo', hex: '#4F46E5', bgLight: '#EEF2FF', borderLight: '#C7D2FE', text: '#4F46E5' },
  emerald: { name: 'Emerald Green', hex: '#059669', bgLight: '#ECFDF5', borderLight: '#A7F3D0', text: '#059669' },
  slate: { name: 'Slate Charcoal', hex: '#334155', bgLight: '#F8FAFC', borderLight: '#E2E8F0', text: '#334155' },
  rose: { name: 'Crimson Rose', hex: '#E11D48', bgLight: '#FFF1F2', borderLight: '#FECDD3', text: '#E11D48' },
};

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('latrics_crm_theme_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically upgrade old 16px/24px/32px values to the new visible 64px standard
        if (parsed.paddingX === '16px' || parsed.paddingX === '24px' || parsed.paddingX === '32px') {
          parsed.paddingX = '64px';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('latrics_crm_theme_settings', JSON.stringify(settings));
    
    // Apply CSS Variables to Document Root
    const root = document.documentElement;
    const selectedColor = COLOR_THEMES[settings.themeColor] || COLOR_THEMES.red;

    root.style.setProperty('--app-padding-x', settings.paddingX);
    root.style.setProperty('--brand-red', selectedColor.hex);
    root.style.setProperty('--brand-red-light', selectedColor.bgLight);
    root.style.setProperty('--brand-red-border', selectedColor.borderLight);

    // Font Scale
    const scale = settings.fontSize === 'small' ? '0.92' : settings.fontSize === 'large' ? '1.08' : '1';
    root.style.setProperty('--app-font-scale', scale);
    root.style.fontSize = `calc(100% * ${scale})`;

    // Font Family
    if (settings.fontFamily === 'Roboto') {
      root.style.fontFamily = "'Roboto', sans-serif";
    } else if (settings.fontFamily === 'Outfit') {
      root.style.fontFamily = "'Outfit', sans-serif";
    } else if (settings.fontFamily === 'Plus Jakarta Sans') {
      root.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    } else {
      root.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
    }

    // Border Radius Variable
    const radius = settings.borderRadius === 'rounded-xl' ? '0.75rem' : settings.borderRadius === 'rounded-lg' ? '0.5rem' : '1.5rem';
    root.style.setProperty('--app-radius', radius);

    // Dark Mode Toggle
    if (settings.mode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetTheme = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSetting, resetTheme, COLOR_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
