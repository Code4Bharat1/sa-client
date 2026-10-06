'use client';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../features/notifications/notificationsSlice';
import { apiSlice } from '../store/apiSlice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const useSSE = (accessToken: string | null) => {
  const dispatch = useDispatch();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const url = `${BASE_URL}/api/sse/notifications?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.addEventListener('notification', (e) => {
      try {
        const data = JSON.parse(e.data);
        dispatch(addNotification({ message: data.message, ticketId: data.ticketId }));
      } catch {}
    });

    es.addEventListener('ticket:status', () => {
      dispatch(apiSlice.util.invalidateTags(['Ticket', 'KPI']));
    });

    es.addEventListener('ticket:new', () => {
      dispatch(apiSlice.util.invalidateTags(['Ticket', 'KPI']));
    });

    es.addEventListener('sla:overdue', (e) => {
      try {
        const data = JSON.parse(e.data);
        dispatch(addNotification({ message: `${data.count} ticket(s) are now overdue!` }));
      } catch {}
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [accessToken, dispatch]);
};
