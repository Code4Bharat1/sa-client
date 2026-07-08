'use client';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const useAuth = () => {
  const { user, accessToken, isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  return { user, accessToken, isAuthenticated, isInitialized };
};
