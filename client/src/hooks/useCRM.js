import { useContext } from 'react';
import { CRMContext } from '../context/CRMContext.jsx';

export default function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
