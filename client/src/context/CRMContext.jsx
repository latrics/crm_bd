import React, { createContext, useReducer, useEffect } from 'react';
import { getLeads } from '../api/leadsApi.js';
import { getDeals } from '../api/dealsApi.js';
import { getDocs } from '../api/docsApi.js';
import { getTenders } from '../api/tendersApi.js';

export const CRMContext = createContext();

const initialState = { leads: [], deals: [], docs: [], tenders: [], loading: true, syncing: false };

function crmReducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':       return { ...state, ...action.payload, loading: false };
    case 'SET_LEADS':     return { ...state, leads: action.payload };
    case 'ADD_LEAD':      return { ...state, leads: [action.payload, ...state.leads] };
    case 'UPDATE_LEAD':   return { ...state, leads: state.leads.map(l => l._id === action.payload._id ? action.payload : l) };
    case 'DELETE_LEAD':   return { ...state, leads: state.leads.filter(l => l._id !== action.payload) };
    
    case 'SET_DEALS':     return { ...state, deals: action.payload };
    case 'ADD_DEAL':      return { ...state, deals: [action.payload, ...state.deals] };
    case 'UPDATE_DEAL':   return { ...state, deals: state.deals.map(d => d._id === action.payload._id ? action.payload : d) };
    case 'DELETE_DEAL':   return { ...state, deals: state.deals.filter(d => d._id !== action.payload) };
    
    case 'SET_DOCS':      return { ...state, docs: action.payload };
    case 'ADD_DOC':       return { ...state, docs: [action.payload, ...state.docs] };
    case 'DELETE_DOC':    return { ...state, docs: state.docs.filter(d => d._id !== action.payload) };
    
    case 'SET_TENDERS':   return { ...state, tenders: action.payload };
    case 'ADD_TENDER':    return { ...state, tenders: [action.payload, ...state.tenders] };
    case 'UPDATE_TENDER': return { ...state, tenders: state.tenders.map(t => t._id === action.payload._id ? action.payload : t) };
    case 'DELETE_TENDER': return { ...state, tenders: state.tenders.filter(t => t._id !== action.payload) };
    
    case 'SET_SYNCING':   return { ...state, syncing: action.payload };
    default:              return state;
  }
}

export function CRMProvider({ children }) {
  const [state, dispatch] = useReducer(crmReducer, initialState);

  useEffect(() => {
    let isMounted = true;

    async function loadAll(silent = false) {
      if (!silent) {
        dispatch({ type: 'SET_SYNCING', payload: true });
      }
      try {
        const results = await Promise.allSettled([
          getLeads(), getDeals(), getDocs(), getTenders()
        ]);
        
        if (!isMounted) return;

        const leadsData = results[0].status === 'fulfilled' ? results[0].value.data : [];
        const dealsData = results[1].status === 'fulfilled' ? results[1].value.data : [];
        const docsData = results[2].status === 'fulfilled' ? results[2].value.data : [];
        const tendersData = results[3].status === 'fulfilled' ? results[3].value.data : [];

        dispatch({ type: 'SET_ALL', payload: {
          leads: leadsData || [],
          deals: dealsData || [],
          docs: docsData || [],
          tenders: tendersData || []
        }});
      } catch (err) {
        console.error("Failed to load initial data", err);
        if (!silent) {
          dispatch({ type: 'SET_ALL', payload: { leads: [], deals: [], docs: [], tenders: [] } });
        }
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_SYNCING', payload: false });
        }
      }
    }
    
    loadAll();

    const interval = setInterval(() => {
      loadAll(true);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return <CRMContext.Provider value={{ state, dispatch }}>{children}</CRMContext.Provider>;
}
