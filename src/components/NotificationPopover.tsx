"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Notification = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  read: boolean;
};

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({
  notification,
  index,
  onMarkAsRead,
}: NotificationItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    key={notification.id}
    className="p-4 hover:bg-accent dark:hover:bg-accent cursor-pointer transition-colors"
    onClick={() => onMarkAsRead(notification.id)}
  >
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        {!notification.read && (
          <span className="h-1 w-1 rounded-full bg-primary" />
        )}
        <h4 className="text-sm font-medium text-card-foreground dark:text-card-foreground">
          {notification.title}
        </h4>
      </div>
      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
        {new Date(notification.created_at).toLocaleDateString()}
      </span>
    </div>
    <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
      {notification.description}
    </p>
  </motion.div>
);

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

const NotificationList = ({
  notifications,
  onMarkAsRead,
}: NotificationListProps) => (
  <div className="divide-y divide-border dark:divide-border">
    {notifications.map((notification, index) => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        index={index}
        onMarkAsRead={onMarkAsRead}
      />
    ))}
  </div>
);

interface NotificationPopoverProps {
  notifications?: Notification[];
  onNotificationsChange?: (notifications: Notification[]) => void;
}

export const NotificationPopover = ({
  notifications: initialNotifications = [],
  onNotificationsChange,
}: NotificationPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch notifications from database
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notifications:', error);
          toast({
            title: "Error",
            description: "Failed to load notifications",
            variant: "destructive",
          });
        } else {
          setNotifications(data || []);
          onNotificationsChange?.(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNotificationsChange, toast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = () => setIsOpen(!isOpen);

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking notifications as read:', error);
        toast({
          title: "Error",
          description: "Failed to mark notifications as read",
          variant: "destructive",
        });
      } else {
        const updatedNotifications = notifications.map((n) => ({
          ...n,
          read: true,
        }));
        setNotifications(updatedNotifications);
        onNotificationsChange?.(updatedNotifications);
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        });
      } else {
        const updatedNotifications = notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        setNotifications(updatedNotifications);
        onNotificationsChange?.(updatedNotifications);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={toggleOpen}
        variant="ghost"
        size="sm"
        className="relative p-2"
        data-testid="notifications-button"
      >
        <Bell className="text-card-foreground dark:text-card-foreground w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-xs text-destructive-foreground">
            {unreadCount}
          </div>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto rounded-xl shadow-lg bg-card dark:bg-card border border-border dark:border-border z-50"
          >
            <div className="p-4 border-b border-border dark:border-border flex justify-between items-center">
              <h3 className="text-sm font-medium text-card-foreground dark:text-card-foreground">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs hover:bg-accent dark:hover:bg-accent"
                  data-testid="mark-all-read"
                >
                  Mark all as read
                </Button>
              )}
            </div>

            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                <p className="text-xs text-muted-foreground mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <NotificationList
                notifications={notifications}
                onMarkAsRead={markAsRead}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};