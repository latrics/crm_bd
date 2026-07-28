import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function NotificationsPage() {
  useEffect(() => {
    // Open the global notifications view in full screen mode
    window.dispatchEvent(new CustomEvent('open-notifications-fullscreen'));
  }, []);

  return <Navigate to="/dashboard" replace />;
}
