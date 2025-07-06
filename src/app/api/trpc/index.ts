import { router } from './trpc';
import { settingsRouter } from './settings';
import { locationsRouter } from './locations';
import { regionsRouter } from './regions';
import { timelineRouter } from './timeline';
import { searchRouter } from './search';

// Root router that combines all feature routers
export const appRouter = router({
  mapSettings: settingsRouter,
  locations: locationsRouter,
  regions: regionsRouter,
  timeline: timelineRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter; 