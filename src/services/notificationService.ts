import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Notification = Tables<'notifications'>;
export type NotificationInsert = TablesInsert<'notifications'>;
export type NotificationUpdate = TablesUpdate<'notifications'>;

export class NotificationService {
  // Get all notifications for a user
  static async getUserNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  }

  // Get unread notification count
  static async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }

    return count || 0;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Create a new notification
  static async createNotification(notification: NotificationInsert) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    return data;
  }

  // Delete a notification
  static async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all read notifications for a user
  static async deleteReadNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true);

    if (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  }

  // Clear all notifications for a user (useful for clearing test data)
  static async clearAllNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  // Clear dummy/test notifications by checking for common test patterns
  static async clearTestNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .or('message.ilike.%John Doe%,message.ilike.%Sarah Johnson%,message.ilike.%test%,message.ilike.%sample%,title.ilike.%test%');

    if (error) {
      console.error('Error clearing test notifications:', error);
      throw error;
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  // Unsubscribe from real-time notifications
  static unsubscribeFromNotifications(channel: any) {
    return supabase.removeChannel(channel);
  }
} 