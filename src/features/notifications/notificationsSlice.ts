import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<Notification, 'id' | 'read' | 'createdAt'>>) {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      state.items.unshift(notification);
      state.unreadCount += 1;
    },
    markAllRead(state) {
      state.items.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    },
    clearAllNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
    },
    markRead(state, action: PayloadAction<string>) {
      const notif = state.items.find((n) => n.id === action.payload);
      if (notif && !notif.read) {
        notif.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
});

export const { addNotification, markAllRead, clearAllNotifications, markRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
