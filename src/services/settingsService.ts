import { supabase } from '../lib/supabaseClient';
import { AppSettings } from '../types';

export async function getSettingsData(): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  const rawData = data.data || {};
  
  // Guarantee core shape exists even if database row is older
  const defaultOnline = { enabled: false, storeId: '', storePassword: '', sandbox: true };
  const defaultCod = { enabled: true, instructions: 'Pay with cash upon delivery' };
  
  const settings: AppSettings = {
    ...rawData,
    paymentMethods: {
      cod: { ...defaultCod, ...(rawData.paymentMethods?.cod || {}) },
      online: { ...defaultOnline, ...(rawData.paymentMethods?.online || {}) }
    },
    storeCurrency: rawData.storeCurrency || 'BDT',
    taxRate: rawData.taxRate || 0
  } as AppSettings;

  // Only check admin status if user session exists
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Sanitize payment secrets for unauthenticated visitors
    if (settings.paymentMethods?.online) {
      return {
        ...settings,
        paymentMethods: {
          ...settings.paymentMethods,
          online: { ...settings.paymentMethods.online, storePassword: '***' }
        }
      };
    }
    return settings;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && settings.paymentMethods?.online) {
    return {
      ...settings,
      paymentMethods: {
        ...settings.paymentMethods,
        online: { ...settings.paymentMethods.online, storePassword: '***' }
      }
    };
  }

  return settings;
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Unauthorized: Admin access required.');

  const { error } = await supabase
    .from('settings')
    .upsert({ id: 'default', data: settings });

  if (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}
