import { trpc } from '@/trpc';
import type { Settings } from '@/app/api/trpc/settings';

/**
 * Modern hook for settings using tRPC directly
 * This replaces the Zustand store for server state
 */
import { DEFAULT_SETTINGS } from '@/app/api/trpc/settings/types';

export function useSettings() {
  const {
    data: settings,
    isLoading,
    error,
  } = trpc.mapSettings.get.useQuery(undefined, {
    retry: false, // Don't retry if database is not available
  });

  const updateSettings = trpc.mapSettings.update.useMutation({
    onSuccess: () => {
      // Invalidate and refetch settings
      utils.mapSettings.get.invalidate();
    },
  });

  const utils = trpc.useUtils();

  // Fallback to default settings if database is not available
  const fallbackSettings = settings || DEFAULT_SETTINGS;

  return {
    settings: fallbackSettings as Settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}

/**
 * Hook for individual setting values with type safety
 */
export function useSetting<K extends keyof Settings>(
  key: K
): Settings[K] | undefined {
  const { settings } = useSettings();
  return settings?.[key];
}

/**
 * Hook for updating individual settings
 */
export function useUpdateSetting() {
  const { updateSettings } = useSettings();

  return {
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => {
      updateSettings({ [key]: value } as Partial<Settings>);
    },
  };
}
