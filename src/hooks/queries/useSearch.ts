import { trpc } from '@/trpc';

interface UseSearchOptions {
  query: string;
  year?: number;
  limit?: number;
  enabled?: boolean;
}

export function useSearch({
  query,
  year,
  limit = 50,
  enabled = true,
}: UseSearchOptions) {
  return trpc.search.search.useQuery(
    {
      query,
      year,
      limit,
    },
    {
      enabled: enabled && (query.trim().length > 0 || year !== undefined),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}
