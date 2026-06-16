'use client';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const useAuth = () => {
  const { user, accessToken, isAuthenticated } = useSelector((state: RootState) => state.auth);
  return { user, accessToken, isAuthenticated };
};
