

import { agentsRouter } from '@/modules/agents/server/procedure';
import { meetingsRouter } from '@/modules/meetings/server/procedure';
import { roadmapsRouter } from '@/modules/roadmaps/server/procedure';

import {  createTRPCRouter } from '../init';



export const appRouter = createTRPCRouter({
    agents: agentsRouter,
    meetings: meetingsRouter,
    roadmaps: roadmapsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
