import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  id?: string;
  user_id?: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    alerts: boolean;
  };
  security_settings: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
  display_preferences: {
    theme: string;
    language: string;
  };
  api_preferences: {
    defaultRateLimit: number;
    webhooksEnabled: boolean;
  };
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  
  // Return default settings if none exist
  if (!data) {
    return {
      notification_preferences: { email: true, push: false, alerts: true },
      security_settings: { twoFactorEnabled: false, sessionTimeout: 30 },
      display_preferences: { theme: 'system', language: 'en' },
      api_preferences: { defaultRateLimit: 60, webhooksEnabled: false }
    };
  }

  return {
    id: data.id,
    user_id: data.user_id,
    notification_preferences: (data.notification_preferences as any) || { email: true, push: false, alerts: true },
    security_settings: (data.security_settings as any) || { twoFactorEnabled: false, sessionTimeout: 30 },
    display_preferences: (data.display_preferences as any) || { theme: 'system', language: 'en' },
    api_preferences: (data.api_preferences as any) || { defaultRateLimit: 60, webhooksEnabled: false }
  };
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    user_id: data.user_id,
    notification_preferences: (data.notification_preferences as any) || { email: true, push: false, alerts: true },
    security_settings: (data.security_settings as any) || { twoFactorEnabled: false, sessionTimeout: 30 },
    display_preferences: (data.display_preferences as any) || { theme: 'system', language: 'en' },
    api_preferences: (data.api_preferences as any) || { defaultRateLimit: 60, webhooksEnabled: false }
  };
}

export async function getNotificationSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  
  // Return defaults if none exist
  if (!data) {
    return {
      alert_types: ['high_risk', 'sanctions', 'api_limit'],
      email_notifications: true,
      push_notifications: false,
      webhook_url: null
    };
  }

  return data;
}

export async function updateNotificationSettings(settings: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}