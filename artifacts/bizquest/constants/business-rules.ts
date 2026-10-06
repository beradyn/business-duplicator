import { BUSINESS_EVENTS, VENTURES, type VentureId } from './game-content';

export interface EventProgress {
  ventureId: VentureId | null;
  cash: number;
  savings: number;
  inventory: number;
  xp: number;
  points: number;
  sold: number;
  eventCycle: number;
  pendingEventId: string | null;
  nextEventAt: number;
  lastEventId: string | null;
}

export const FIRST_EVENT_AT = 3;

export function scheduleSalesEvent<T extends EventProgress>(state: T, random = Math.random): T {
  if (state.pendingEventId || state.sold < state.nextEventAt) return state;
  const events = BUSINESS_EVENTS.filter((event) => event.id !== state.lastEventId);
  const event = events[Math.min(events.length - 1, Math.floor(random() * events.length))];
  return event ? { ...state, pendingEventId: event.id } : state;
}

export function eventChoiceCost(eventId: string, choice: number, ventureId: VentureId | null) {
  const fromSavings = eventId === 'broken-cooler' && choice === 0;
  const cost = fromSavings ? 12
    : eventId === 'broken-cooler' && choice === 2 ? 5
    : eventId === 'rainy-market' && choice === 0 ? 8
    : eventId === 'supply-shortage' && choice === 0
      ? (VENTURES.find((venture) => venture.id === ventureId)?.unitCost ?? 4) * 4
      : 0;
  return { cost, fromSavings };
}

const outcomes: Record<string, string[]> = {
  'broken-cooler': [
    'Your emergency fund covered the repair. Your shop is ready to serve again!',
    'You protected your stock and made a safe restart plan. Your shop can reopen!',
    'Your mentor helped with the repair. Asking for help kept your shop moving!',
  ],
  'rainy-market': [
    'Your covered spot is open. Customers can shop without getting soaked!',
    'Sharing a space protected your supplies and your cash. Teamwork works!',
    'You protected your stock and planned your next market day. Ready for a fresh start!',
  ],
  'supply-shortage': [
    'A backup batch is ready. Planning ahead kept your shop moving!',
    'The maker trade worked. Your shop is ready to reopen!',
    'You compared your options before buying. Careful choices protect your business!',
  ],
};

export function applyBusinessDecision<T extends EventProgress>(state: T, choice: number, random = Math.random) {
  const id = state.pendingEventId;
  if (!id || !Number.isInteger(choice) || choice < 0 || choice > 2) return null;
  const message = outcomes[id]?.[choice];
  if (!message) return null;
  const { cost, fromSavings } = eventChoiceCost(id, choice, state.ventureId);
  if ((fromSavings ? state.savings : state.cash) < cost) return null;
  const next: T = {
    ...state,
    inventory: state.inventory + (id === 'supply-shortage' && choice === 0 ? 4 : 0),
    cash: state.cash - (fromSavings ? 0 : cost),
    savings: state.savings - (fromSavings ? cost : 0),
    xp: state.xp + (choice === 0 ? 15 : choice === 1 ? 12 : 8),
    points: state.points + 10,
    eventCycle: state.eventCycle + 1,
    pendingEventId: null,
    lastEventId: id,
    nextEventAt: state.sold + 3 + Math.min(2, Math.floor(random() * 3)),
  };
  return { state: next, message, cost };
}