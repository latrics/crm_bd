import useCRM from '../../hooks/useCRM.js';

export default function SyncBadge() {
  const { state } = useCRM();
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-brand-surfaceAlt border border-brand-border rounded-full text-xs font-bold text-brand-silver">
      {state.syncing ? (
        <>
          <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></div>
          Saving...
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-brand-green"></div>
          Auto-Saved
        </>
      )}
    </div>
  );
}
