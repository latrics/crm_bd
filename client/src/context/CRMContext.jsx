import React, { createContext, useReducer, useEffect } from 'react';
import { getLeads } from '../api/leadsApi.js';
import { getDeals } from '../api/dealsApi.js';
import { getDocs } from '../api/docsApi.js';
import { getTenders } from '../api/tendersApi.js';
import { getOwners } from '../api/authApi.js';

export const CRMContext = createContext();

const initialState = {
  leads: [], deals: [], docs: [], tenders: [], owners: [],
  loadingLeads: true, loadingDeals: true, loadingDocs: true, loadingTenders: true, loadingOwners: true,
  syncing: false
};

function crmReducer(state, action) {
  switch (action.type) {
    case 'SET_LEADS':     return { ...state, leads: action.payload, loadingLeads: false };
    case 'ADD_LEAD':      return { ...state, leads: [action.payload, ...state.leads] };
    case 'UPDATE_LEAD':   return { ...state, leads: state.leads.map(l => l._id === action.payload._id ? action.payload : l) };
    case 'DELETE_LEAD':   return { ...state, leads: state.leads.filter(l => l._id !== action.payload) };

    case 'SET_DEALS':     return { ...state, deals: action.payload, loadingDeals: false };
    case 'ADD_DEAL':      return { ...state, deals: [action.payload, ...state.deals] };
    case 'UPDATE_DEAL':   return { ...state, deals: state.deals.map(d => d._id === action.payload._id ? action.payload : d) };
    case 'DELETE_DEAL':   return { ...state, deals: state.deals.filter(d => d._id !== action.payload) };

    case 'SET_DOCS':      return { ...state, docs: action.payload, loadingDocs: false };
    case 'ADD_DOC':       return { ...state, docs: [action.payload, ...state.docs] };
    case 'DELETE_DOC':    return { ...state, docs: state.docs.filter(d => d._id !== action.payload) };

    case 'SET_TENDERS':   return { ...state, tenders: action.payload, loadingTenders: false };
    case 'ADD_TENDER':    return { ...state, tenders: [action.payload, ...state.tenders] };
    case 'UPDATE_TENDER': return { ...state, tenders: state.tenders.map(t => t._id === action.payload._id ? action.payload : t) };
    case 'DELETE_TENDER': return { ...state, tenders: state.tenders.filter(t => t._id !== action.payload) };

    case 'SET_OWNERS':    return { ...state, owners: action.payload, loadingOwners: false };
    case 'SET_SYNCING':   return { ...state, syncing: action.payload };
    default:              return state;
  }
}

export function CRMProvider({ children }) {
  const [state, dispatch] = useReducer(crmReducer, initialState);

  useEffect(() => {
    let isMounted = true;

    function loadCollection(fetchFn, actionType) {
      return fetchFn()
        .then(res => {
          if (isMounted) dispatch({ type: actionType, payload: res.data || [] });
        })
        .catch(err => {
          console.error(`Failed to load ${actionType}`, err);
        });
    }

    function loadAll() {
      return Promise.allSettled([
        loadCollection(getLeads, 'SET_LEADS'),
        loadCollection(getDeals, 'SET_DEALS'),
        loadCollection(getDocs, 'SET_DOCS'),
        loadCollection(getTenders, 'SET_TENDERS'),
        loadCollection(getOwners, 'SET_OWNERS'),
      ]);
    }

    dispatch({ type: 'SET_SYNCING', payload: true });
    loadAll().finally(() => {
      if (isMounted) dispatch({ type: 'SET_SYNCING', payload: false });
    });

    const interval = setInterval(loadAll, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return <CRMContext.Provider value={{ state, dispatch }}>{children}</CRMContext.Provider>;
}
