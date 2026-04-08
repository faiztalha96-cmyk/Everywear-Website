import { supabase } from '../lib/supabaseClient';
import { AppSettings } from '../types';

// getSession() reads from local storage — instant vs getUser()'s network call
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getSettingsData(): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('data')
    .eq('id', 'default')
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  const rawData = data.data || {};
  const defaultOnline = { enabled: false, storeId: '', storePassword: '', sandbox: true };
  const defaultCod = { enabled: true, instructions: 'Pay with cash upon delivery' };
  const defaultContact = { email: 'support@everywear.com', phone: '+880 1XXX XXXXXX', address: 'Dhaka, Bangladesh' };

  const settings: AppSettings = {
    ...rawData,
    contact: { ...defaultContact, ...(rawData.contact || {}) },
    paymentMethods: {
      cod: { ...defaultCod, ...(rawData.paymentMethods?.cod || {}) },
      online: { ...defaultOnline, ...(rawData.paymentMethods?.online || {}) }
    },
    storeCurrency: rawData.storeCurrency || 'BDT',
    taxRate: rawData.taxRate || 0
  } as AppSettings;

  // Sanitize payment secrets for non-admins without an extra DB call
  // (The profile.is_admin check happens inline via session)
  const user = await getCurrentUser();
  if (!user) {
    if (settings.paymentMethods?.online) {
      settings.paymentMethods.online.storePassword = '***';
    }
    return settings;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && settings.paymentMethods?.online) {
    settings.paymentMethods.online.storePassword = '***';
  }

  return settings;
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const user = await getCurrentUser();
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
