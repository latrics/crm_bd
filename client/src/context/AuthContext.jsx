import React, { createContext, useReducer, useEffect, useContext } from 'react';
import * as authApi from '../api/authApi.js';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
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
    async function loadUser() {
      try {
        const res = await authApi.getMe();
        dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
      } catch (err) {
        // Not authenticated
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await authApi.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.user });
      return res;
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message;
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
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
