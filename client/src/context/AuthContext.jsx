import React, { createContext, useReducer, useEffect, useContext, useRef } from 'react';
import * as authApi from '../api/authApi.js';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/react';
import axios from 'axios';
import api from '../api/axiosInstance.js';

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
  const isSigningOut = useRef(false);

  // Set up axios request interceptor to automatically attach Clerk session token
  useEffect(() => {
    const attachToken = async (config) => {
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
    };

    const interceptorGlobal = axios.interceptors.request.use(attachToken);
    const interceptorApi = api.interceptors.request.use(attachToken);

    return () => {
      axios.interceptors.request.eject(interceptorGlobal);
      api.interceptors.request.eject(interceptorApi);
    };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    async function loadUser() {
      console.log('loadUser triggered:', { isClerkAuthLoaded, isClerkUserLoaded, isSignedIn, hasClerkUser: !!clerkUser, isSigningOut: isSigningOut.current });
      if (!isClerkAuthLoaded || !isClerkUserLoaded) return;

      // Prevent re-entry during sign-out
      if (isSigningOut.current) {
        console.log('Skipping loadUser because sign out is in progress');
        return;
      }

      if (isSignedIn && clerkUser) {
        console.log('User is signed in to Clerk, syncing with backend');
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          const email = clerkUser.primaryEmailAddress?.emailAddress;
          const name = clerkUser.fullName || clerkUser.firstName || '';
          
          const res = await authApi.syncUser(clerkUser.id, email, name);
          console.log('Backend user sync success:', res.user);
          dispatch({ type: 'LOGIN_SUCCESS', payload: res.user });
        } catch (err) {
          console.error('Failed to load user from backend:', err);
          const errorMessage = err?.message || 'Your email is not authorized to access this system.';
          
          // Sign out of Clerk since the backend rejected this user.
          // This ensures the <SignIn> component will re-render properly
          // instead of showing a blank screen.
          isSigningOut.current = true;
          try {
            console.log('Attempting to sign out of Clerk...');
            await signOut();
            console.log('Clerk sign out complete');
          } catch (signOutErr) {
            console.error('Error signing out of Clerk:', signOutErr);
          } finally {
            isSigningOut.current = false;
            // Now that sign out is complete, we can show the error and redirect.
            dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
          }
        }
      } else {
        console.log('No Clerk session found, dispatching LOGOUT');
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
  console.log('AuthContext render state:', { loadingState, stateLoading: state.loading, isClerkAuthLoaded, isClerkUserLoaded, isAuthenticated: state.isAuthenticated, error: state.error });

  return (
    <AuthContext.Provider value={{ ...state, loading: loadingState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

