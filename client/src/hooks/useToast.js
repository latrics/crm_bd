import { useState, useEffect } from 'react';

let toastListeners = [];
let toasts = [];

export const addToast = (toast) => {
  const id = Date.now().toString();
  const newToast = { ...toast, id };
  toasts = [...toasts, newToast];
  toastListeners.forEach(l => l([...toasts]));
  setTimeout(() => {
    removeToast(id);
  }, 3200);
};

export const removeToast = (id) => {
  toasts = toasts.filter(t => t.id !== id);
  toastListeners.forEach(l => l([...toasts]));
};

export default function useToast() {
  const [currentToasts, setCurrentToasts] = useState(toasts);

  useEffect(() => {
    const listener = (newToasts) => setCurrentToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  return { toasts: currentToasts, addToast, removeToast };
}
