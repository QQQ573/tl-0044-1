import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useMessageStore } from '@/store/messageStore';
import { UserRole } from '@/types';

const NotificationManager: React.FC = () => {
  const { user, isAuthenticated } = useUserStore();
  const {
    connectSse,
    disconnectSse,
    startPolling,
    stopPolling,
    fetchUnreadCount,
    initNotificationPermission,
    requestNotificationPermission,
    notificationPermission,
  } = useMessageStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSse();
      stopPolling();
      return;
    }

    initNotificationPermission();

    if (
      (user.role === UserRole.WAREHOUSE_KEEPER || user.role === UserRole.FINANCE) &&
      notificationPermission === 'unknown'
    ) {
      const timer = setTimeout(() => {
        if (notificationPermission === 'unknown') {
          requestNotificationPermission().catch(() => {});
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    fetchUnreadCount();
    connectSse();

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
      disconnectSse();
      stopPolling();
    };
  }, [isAuthenticated, user]);

  return null;
};

export default NotificationManager;
