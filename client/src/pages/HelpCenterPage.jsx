import { useState, useMemo } from 'react';
import { Search, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { helpCenterCategories, helpCenterArticles } from '../data/helpCenterData.js';
import { useTheme } from '../context/ThemeContext.jsx';

export default function HelpCenterPage() {
  const { settings } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');

  // Helper to format basic markdown to HTML safely
  const formatContent = (text) => {
    let html = text
      .trim()
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p className="mt-4">')
      .replace(/\n- (.*)/g, '<br/><span className="mr-2">&bull;</span>$1')
      .replace(/\n\d+\. (.*)/g, '<br/><span className="mr-2 opacity-50">&bull;</span>$1');
    return `<p className="leading-relaxed text-sm">${html}</p>`;
  };

  const filteredArticles = useMemo(() => {
    let filtered = helpCenterArticles;
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(lowerQuery) || 
        a.content.toLowerCase().includes(lowerQuery) ||
        a.tags.some(t => t.toLowerCase().includes(lowerQuery))
      );
    } else {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    return filtered;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="animate-in fade-in duration-200">
      
      {/* Header & Search */}
      <div className="bg-brand-surfaceAlt border-b border-brand-border/60 p-6 md:p-8 lg:p-10 mb-6 flex flex-col gap-6 rounded-b-3xl -mt-6 mx-[-16px] sm:mx-[-32px] lg:mx-[-64px] px-6 sm:px-12 lg:px-20">

        
        <div className="relative max-w-xl w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-brand-silver/60" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-brand-border/80 rounded-2xl text-sm placeholder-brand-silver focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all shadow-sm"
            placeholder="Search for articles, guides, or keywords (e.g. 'account profile security')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 flex flex-col gap-1.5">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-widest mb-3 px-2">Categories</h3>
          
          {helpCenterCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id && !searchQuery;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left group border ${
                  isActive 
                    ? 'bg-brand-red/[0.04] text-brand-red border-brand-red/20 shadow-xs' 
                    : 'text-brand-charcoal hover:bg-white border-transparent hover:border-brand-border/60 hover:shadow-xs'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-brand-red' : 'text-brand-silver group-hover:text-brand-charcoal transition-colors'}`} />
                <span className="flex-1">{cat.label}</span>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'translate-x-0.5 text-brand-red/60' : 'opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0'}`} />
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-6 pb-20">
          
          {searchQuery && (
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-brand-text">
                Search Results for "{searchQuery}"
              </h2>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-brand-red hover:text-brand-redDark"
              >
                Clear Search
              </button>
            </div>
          )}

          {!searchQuery && (
            <div className="flex items-center gap-3 mb-2 border-b border-brand-border/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = helpCenterCategories.find(c => c.id === selectedCategory)?.icon;
                  return Icon ? <Icon className="w-5 h-5 text-brand-text" /> : null;
                })()}
              </div>
              <h2 className="text-xl font-serif font-black text-brand-text">
                {helpCenterCategories.find(c => c.id === selectedCategory)?.label}
              </h2>
            </div>
          )}

          {filteredArticles.length === 0 ? (
            <div className="bg-white border border-brand-border/60 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-brand-text mb-2">No articles found</h3>
              <p className="text-sm text-brand-silver max-w-md">
                We couldn't find any articles matching your search query. Try using different keywords or selecting a category from the sidebar.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filteredArticles.map(article => (
                <div key={article.id} className="bg-white border border-brand-border/60 rounded-2xl p-6 md:p-8 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/[0.03] border border-brand-red/10 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-5 h-5 text-brand-red/70" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-serif font-bold text-brand-text mb-1">
                        {article.title}
                      </h3>
                      {searchQuery && (
                        <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-brand-silver bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {helpCenterCategories.find(c => c.id === article.category)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className="text-slate-600 prose prose-sm prose-slate max-w-none mt-4"
                    dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
                  />
                  
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-brand-border/30">
                      {article.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/50">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
