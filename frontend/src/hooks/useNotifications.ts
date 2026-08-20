import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services';
import { NotificationItem } from '../types';

export function useNotifications(pollingInterval = 15000) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  // Request permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setIsPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setIsPermissionGranted(permission === 'granted');
        });
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll();
      const newItems: NotificationItem[] = res.data.data.items;
      const newUnreadCount = res.data.data.unreadCount;
      
      setNotifications(newItems);
      setUnreadCount(newUnreadCount);

      // Check for push notification logic
      if (isPermissionGranted && newItems.length > 0) {
        const lastNotifiedId = parseInt(localStorage.getItem('lastNotifiedId') || '0');
        
        // Find unread items that are newer than the last notified ID
        const unnotifiedItems = newItems.filter(
          item => !item.isRead && item.id > lastNotifiedId
        );

        if (unnotifiedItems.length > 0) {
          // Trigger browser notification for the latest one
          const latestItem = unnotifiedItems[0];
          new Notification(latestItem.title, {
            body: latestItem.message,
            icon: '/favicon.ico', // fallback icon
          });

          // Update lastNotifiedId
          localStorage.setItem('lastNotifiedId', latestItem.id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [isPermissionGranted]);

  // Polling mechanism
  useEffect(() => {
    fetchNotifications(); // Initial fetch
    
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [fetchNotifications, pollingInterval]);

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
      fetchNotifications(); // re-sync if failed
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
      fetchNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    isPermissionGranted,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
