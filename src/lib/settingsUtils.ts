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

  return data;
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
  return data;
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