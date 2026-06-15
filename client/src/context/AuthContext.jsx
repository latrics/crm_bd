import React, { createContext, useReducer, useEffect, useContext } from 'react';
import * as authApi from '../api/authApi.js';

const AuthContext = createContext();

const initialState = {
  // ---- AUTHENTICATION PAUSED FOR PRESENTATION ----
  // user: null,
  // isAuthenticated: false,
  // loading: true,
  user: { _id: "662a6e60b1341a001c900000", name: "Balaji Nagarajan", email: "balaji.nagarajan@latrics.com", role: "super_admin" },
  isAuthenticated: true,
  loading: false,
  // ------------------------------------------------
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, isAuthenticated: true, loading: false, error: null };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, loading: false };
    case 'AUTH_ERROR':
      return { ...state, user: null, isAuthenticated: false, loading: false, error: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // ---- AUTHENTICATION PAUSED FOR PRESENTATION ----
    /*
    async function loadUser() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const res = await authApi.getMe();
        dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
      } catch (err) {
        // Try refresh
        try {
          const refreshRes = await authApi.refresh();
          const userRes = await authApi.getMe();
          dispatch({ type: 'LOGIN_SUCCESS', payload: userRes.data });
        } catch (refreshErr) {
          localStorage.removeItem('accessToken');
          dispatch({ type: 'AUTH_ERROR', payload: null });
        }
      }
    }
    loadUser();
    */
    // ------------------------------------------------
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await authApi.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.user });
      return res;
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR', payload: err.message });
      throw err;
    }
  };

  const logout = async () => {
    await authApi.logout();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
