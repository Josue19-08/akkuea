import type { GameEvent } from "./game";
import type { PaginatedResponse } from "./pagination";

/**
 * Discriminant string union of all on-chain game event types.
 * Derived from the `type` field of the `GameEvent` union so it stays
 * in sync automatically when new event variants are added to game.ts.
 */
export type GameEventType = GameEvent["type"];

/**
 * Paginated list of game events, e.g. as returned by the event-stream API.
 */
export type PaginatedGameEvents = PaginatedResponse<GameEvent>;
