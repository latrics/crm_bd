import React, { createContext, useReducer, useEffect, useContext } from 'react';
import * as authApi from '../api/authApi.js';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/react';
import axios from 'axios';

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
      return { ...state, user: null, isAuthenticated: false, loading: false, error: null };
    case 'AUTH_ERROR':
      return { ...state, user: null, isAuthenticated: false, loading: false, error: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const { isLoaded: isClerkAuthLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { isLoaded: isClerkUserLoaded, user: clerkUser } = useClerkUser();
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios request interceptor to automatically attach Clerk session token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.error("Error getting Clerk token for Axios interceptor:", err);
        }
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    async function loadUser() {
      if (!isClerkAuthLoaded || !isClerkUserLoaded) return;

      if (isSignedIn && clerkUser) {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          const res = await authApi.getMe();
          dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
        } catch (err) {
          console.error('Failed to load user from backend:', err);
          dispatch({ type: 'AUTH_ERROR', payload: err.message || 'Error sync user' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    }
    loadUser();
  }, [isClerkAuthLoaded, isClerkUserLoaded, isSignedIn, clerkUser]);

  const login = async (email, password) => {
    // Legacy credentials login is replaced by Clerk flow
    throw new Error('Please sign in using Clerk authentication.');
  };

  const logout = async () => {
    if (signOut) {
      await signOut();
    }
    dispatch({ type: 'LOGOUT' });
  };

  const loadingState = !isClerkAuthLoaded || !isClerkUserLoaded || state.loading;

  return (
    <AuthContext.Provider value={{ ...state, loading: loadingState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
