import { create } from 'zustand';
import { Message, SseMessage, UserRole } from '@/types';
import {
  getMessages,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  batchMarkAsRead,
} from '@/api/messages';

interface MessageStore {
  messages: Message[];
  total: number;
  unreadCount: number;
  loading: boolean;
  notificationPermission: NotificationPermission | 'unknown';
  sseConnected: boolean;
  usePolling: boolean;
  pollingTimer: number | null;

  fetchMessages: (params?: any) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  batchMarkAsRead: (ids: string[]) => Promise<void>;
  addMessage: (message: Message) => void;

  initNotificationPermission: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  showBrowserNotification: (message: Message) => void;

  connectSse: () => void;
  disconnectSse: () => void;
  startPolling: () => void;
  stopPolling: () => void;
}

let eventSource: EventSource | null = null;

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  total: 0,
  unreadCount: 0,
  loading: false,
  notificationPermission: 'unknown',
  sseConnected: false,
  usePolling: false,
  pollingTimer: null,

  fetchMessages: async (params) => {
    set({ loading: true });
    try {
      const result = await getMessages(params);
      set({
        messages: result.data,
        total: result.total,
        unreadCount: result.unreadCount,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const result = await getUnreadCount();
      set({ unreadCount: result.count });
    } catch (error) {
      // ignore
    }
  },

  markAsRead: async (id: string) => {
    await markAsRead(id);
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, read: true, readAt: new Date().toISOString() } : m,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await markAllAsRead();
    set((state) => ({
      messages: state.messages.map((m) => ({ ...m, read: true, readAt: new Date().toISOString() })),
      unreadCount: 0,
    }));
  },

  batchMarkAsRead: async (ids: string[]) => {
    await batchMarkAsRead(ids);
    set((state) => ({
      messages: state.messages.map((m) =>
        ids.includes(m.id) ? { ...m, read: true, readAt: new Date().toISOString() } : m,
      ),
      unreadCount: Math.max(0, state.unreadCount - ids.length),
    }));
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [message, ...state.messages],
      unreadCount: state.unreadCount + 1,
      total: state.total + 1,
    }));

    if (!message.read) {
      get().showBrowserNotification(message);
    }
  },

  initNotificationPermission: async () => {
    if (!('Notification' in window)) {
      set({ notificationPermission: 'denied' });
      return;
    }
    set({ notificationPermission: Notification.permission });
  },

  requestNotificationPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      set({ notificationPermission: 'granted' });
      return true;
    }
    if (Notification.permission === 'denied') {
      set({ notificationPermission: 'denied' });
      return false;
    }
    const permission = await Notification.requestPermission();
    set({ notificationPermission: permission });
    return permission === 'granted';
  },

  showBrowserNotification: (message: Message) => {
    const { notificationPermission } = get();
    if (notificationPermission !== 'granted') return;
    if (!('Notification' in window)) return;

    try {
      const notification = new Notification(message.title, {
        body: message.content,
        tag: message.id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        if (message.transferId) {
          window.location.href = `/transfers/${message.transferId}`;
        }
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  },

  connectSse: () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      eventSource = new EventSource('/api/messages/stream', {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        console.log('SSE connected');
        set({ sseConnected: true, usePolling: false });
      };

      eventSource.onmessage = (event) => {
        try {
          const sseMessage: SseMessage = JSON.parse(event.data);
          if (sseMessage.type === 'message' && sseMessage.data.message) {
            get().addMessage(sseMessage.data.message);
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error, falling back to polling:', error);
        set({ sseConnected: false, usePolling: true });
        get().disconnectSse();
        get().startPolling();
      };
    } catch (error) {
      console.error('Failed to connect SSE, falling back to polling:', error);
      set({ sseConnected: false, usePolling: true });
      get().startPolling();
    }
  },

  disconnectSse: () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    set({ sseConnected: false });
  },

  startPolling: () => {
    get().stopPolling();
    const timer = window.setInterval(() => {
      get().fetchUnreadCount();
    }, 30000);
    set({ pollingTimer: timer });
  },

  stopPolling: () => {
    const { pollingTimer } = get();
    if (pollingTimer) {
      clearInterval(pollingTimer);
      set({ pollingTimer: null });
    }
  },
}));
