import { supabase } from '@/lib/supabase';

export async function getUsageCount(userId: string, feature: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('feature_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('feature', feature)
      .single();
    return data?.count || 0;
  } catch {
    return parseInt(localStorage.getItem(`usage_${feature}`) || '0');
  }
}

export async function incrementUsage(userId: string, feature: string): Promise<number> {
  const current = await getUsageCount(userId, feature);
  const newCount = current + 1;

  try {
    await supabase.from('feature_usage').upsert({
      user_id: userId,
      feature,
      count: newCount,
      last_used: new Date().toISOString(),
    }, { onConflict: 'user_id,feature' });
  } catch {
    localStorage.setItem(`usage_${feature}`, String(newCount));
  }
  return newCount;
}
