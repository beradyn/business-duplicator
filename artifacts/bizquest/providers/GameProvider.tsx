import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AvatarAccessory,
  HAIR_COLORS,
  PLAYER_NAMES,
  SKIN_TONES,
  SHIRT_COLORS,
  VentureId,
  VENTURES,
} from '@/constants/game-content';
import { useAuth } from '@/providers/AuthProvider';
import { FIRST_EVENT_AT, applyBusinessDecision, scheduleSalesEvent } from '@/constants/business-rules';
import { QUESTS } from '@/constants/game-content';

const STORAGE_KEY = 'bizquest-progress-v2:';
const STARTING_GRANT = 120;
const RESTOCK_UNITS = 4;

export interface AvatarConfig {
  skin: string;
  hair: string;
  shirt: string;
  accessory: AvatarAccessory;
  hairStyle: 'short' | 'curls' | 'long';
}

export interface LedgerEntry {
  id: string;
  label: string;
  amount: number;
}

export interface GameState {
  playerName: string;
  avatar: AvatarConfig;
  ventureId: VentureId | null;
  cash: number;
  savings: number;
  inventory: number;
  sold: number;
  salePrice: number;
  xp: number;
  points: number;
  badges: string[];
  completedQuests: string[];
  ledger: LedgerEntry[];
  helperHired: boolean;
  weekSales: number;
  weeksCompleted: number;
  eventCycle: number;
  pendingEventId: string | null;
  nextEventAt: number;
  lastEventId: string | null;
  lastEventMessage: string;
}

const DEFAULT_STATE: GameState = {
  playerName: 'Alex',
  avatar: {
    skin: SKIN_TONES[1].value,
    hair: HAIR_COLORS[0].value,
    shirt: SHIRT_COLORS[1].value,
    accessory: 'none',
    hairStyle: 'curls',
  },
  ventureId: null,
  cash: 0,
  savings: 0,
  inventory: 0,
  sold: 0,
  salePrice: 0,
  xp: 0,
  points: 0,
  badges: [],
  completedQuests: [],
  ledger: [],
  helperHired: false,
  weekSales: 0,
  weeksCompleted: 0,
  eventCycle: 0,
  pendingEventId: null,
  nextEventAt: FIRST_EVENT_AT,
  lastEventId: null,
  lastEventMessage: '',
};

interface GameContextValue {
  state: GameState;
  hydrated: boolean;
  storageIssue: boolean;
  level: number;
  xpIntoLevel: number;
  chooseName: (name: string) => void;
  updateAvatar: (changes: Partial<AvatarConfig>) => void;
  startVenture: (id: VentureId) => void;
  restock: () => boolean;
  sellProduct: () => boolean;
  changePrice: (amount: number) => void;
  saveMoney: () => boolean;
  withdrawSavings: () => boolean;
  completeQuest: (id: string, correct: boolean) => boolean;
  hireHelper: () => boolean;
  resolveBusinessEvent: (choice: number) => string | null;
}

const GameContext = createContext<GameContextValue | null>(null);

function makeEntry(label: string, amount: number): LedgerEntry {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label, amount };
}

function restoredState(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      pendingEventId: typeof parsed.pendingEventId === 'string' ? parsed.pendingEventId : null,
      nextEventAt: typeof parsed.nextEventAt === 'number' ? parsed.nextEventAt : (parsed.sold ?? 0) + FIRST_EVENT_AT,
      avatar: { ...DEFAULT_STATE.avatar, ...(parsed.avatar ?? {}) },
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      completedQuests: Array.isArray(parsed.completedQuests) ? parsed.completedQuests : [],
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
    };
  } catch {
    return null;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [storageIssue, setStorageIssue] = useState(false);
  const [loadedAccountId, setLoadedAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setState(DEFAULT_STATE);
      setLoadedAccountId(null);
      setHydrated(true);
      return;
    }
    const accountId = user.id;
    const freshAccountState: GameState = {
      ...DEFAULT_STATE,
      playerName: user.username,
      avatar: {
        ...DEFAULT_STATE.avatar,
        hairStyle: user.gender === 'girl' ? 'long' : user.gender === 'boy' ? 'short' : 'curls',
      },
    };
    let active = true;
    setHydrated(false);
    setState(freshAccountState);
    AsyncStorage.getItem(`${STORAGE_KEY}${accountId}`)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          const saved = restoredState(raw);
          if (saved) setState({ ...saved, playerName: saved.playerName === 'Alex' ? user.username : saved.playerName });
          else setStorageIssue(true);
        }
      })
      .catch(() => {
        if (active) setStorageIssue(true);
      })
      .finally(() => {
        if (active) {
          setLoadedAccountId(accountId);
          setHydrated(true);
        }
      });
    return () => {
      active = false;
    };
  }, [authReady, user?.id]);

  useEffect(() => {
    if (!hydrated || !user || loadedAccountId !== user.id) return;
    AsyncStorage.setItem(`${STORAGE_KEY}${user.id}`, JSON.stringify(state)).catch(() => setStorageIssue(true));
  }, [hydrated, state, user, loadedAccountId]);

  const chooseName = useCallback((name: string) => {
    if (!PLAYER_NAMES.includes(name)) return;
    setState((current) => ({ ...current, playerName: name }));
  }, []);

  const updateAvatar = useCallback((changes: Partial<AvatarConfig>) => {
    setState((current) => ({ ...current, avatar: { ...current.avatar, ...changes } }));
  }, []);

  const startVenture = useCallback((id: VentureId) => {
    const venture = VENTURES.find((item) => item.id === id);
    if (!venture) return;
    setState((current) => {
      if (current.ventureId) return current;
      return {
        ...current,
        ventureId: id,
        cash: STARTING_GRANT,
        salePrice: venture.salePrice,
        badges: current.badges.includes('first-idea')
          ? current.badges
          : [...current.badges, 'first-idea'],
        ledger: [makeEntry('Mentor starter grant', STARTING_GRANT), ...current.ledger].slice(0, 8),
      };
    });
  }, []);

  const restock = useCallback(() => {
    const venture = VENTURES.find((item) => item.id === state.ventureId);
    if (state.pendingEventId || !venture || state.cash < venture.unitCost * RESTOCK_UNITS) return false;
    const cost = venture.unitCost * RESTOCK_UNITS;
    setState((current) => {
      const currentVenture = VENTURES.find((item) => item.id === current.ventureId);
      if (current.pendingEventId || !currentVenture || current.cash < cost) return current;
      return {
        ...current,
        cash: current.cash - cost,
        inventory: current.inventory + RESTOCK_UNITS,
        ledger: [makeEntry(`Stocked ${RESTOCK_UNITS} ${currentVenture.product.toLowerCase()}s`, -cost), ...current.ledger].slice(0, 8),
      };
    });
    return true;
  }, [state.cash, state.ventureId, state.pendingEventId]);

  const sellProduct = useCallback(() => {
    const currentVenture = VENTURES.find((item) => item.id === state.ventureId);
    if (state.pendingEventId || !currentVenture || state.inventory <= 0 || state.salePrice > currentVenture.salePrice + 2) return false;
    setState((current) => {
      const venture = VENTURES.find((item) => item.id === current.ventureId);
      if (current.pendingEventId || !venture || current.inventory <= 0) return current;
      if (current.salePrice > venture.salePrice + 2) return current;
      const weekSales = current.weekSales + 1;
      const finishedWeek = weekSales >= 5;
      const badges =
        finishedWeek && !current.badges.includes('sales-star')
          ? [...current.badges, 'sales-star']
          : current.badges;
      const nextBadges =
        current.sold === 0 && !current.badges.includes('first-sale')
          ? [...badges, 'first-sale']
          : badges;
      const helperBonus = current.helperHired ? 2 : 0;
      return scheduleSalesEvent({
        ...current,
        inventory: current.inventory - 1,
        sold: current.sold + 1,
        cash: current.cash + current.salePrice + helperBonus,
        xp: current.xp + 10 + (finishedWeek ? 25 : 0),
        points: current.points + 5 + (finishedWeek ? 25 : 0),
        weekSales: finishedWeek ? 0 : weekSales,
        weeksCompleted: current.weeksCompleted + (finishedWeek ? 1 : 0),
        badges: nextBadges,
        ledger: [
          makeEntry(`Sold 1 ${venture.product.toLowerCase()}`, current.salePrice + helperBonus),
          ...current.ledger,
        ].slice(0, 8),
      });
    });
    return true;
  }, [state.inventory, state.salePrice, state.ventureId, state.pendingEventId]);

  const changePrice = useCallback((amount: number) => {
    setState((current) => {
      const venture = VENTURES.find((item) => item.id === current.ventureId);
      if (current.pendingEventId || !venture) return current;
      const nextPrice = Math.max(venture.unitCost + 1, Math.min(venture.salePrice + 20, current.salePrice + amount));
      return { ...current, salePrice: nextPrice };
    });
  }, []);

  const saveMoney = useCallback(() => {
    if (state.pendingEventId || state.cash < 10) return false;
    setState((current) => {
      if (current.pendingEventId || current.cash < 10) return current;
      const getsBadge = current.savings < 10 && !current.badges.includes('smart-saver');
      return {
        ...current,
        cash: current.cash - 10,
        savings: current.savings + 10,
        badges: getsBadge ? [...current.badges, 'smart-saver'] : current.badges,
        ledger: [makeEntry('Moved 10 to savings', -10), ...current.ledger].slice(0, 8),
      };
    });
    return true;
  }, [state.cash, state.pendingEventId]);

  const withdrawSavings = useCallback(() => {
    if (state.pendingEventId || state.savings < 10) return false;
    setState((current) => {
      if (current.pendingEventId || current.savings < 10) return current;
      return {
        ...current,
        cash: current.cash + 10,
        savings: current.savings - 10,
        ledger: [makeEntry('Moved 10 from savings', 10), ...current.ledger].slice(0, 8),
      };
    });
    return true;
  }, [state.savings, state.pendingEventId]);

  const completeQuest = useCallback(
    (id: string, correct: boolean) => {
      if (state.completedQuests.includes(id)) return false;
      const completedCount = state.completedQuests.length + 1;
      setState((current) => {
        if (current.completedQuests.includes(id)) return current;
        const completedQuests = [...current.completedQuests, id];
        const badges = [...current.badges];
        if (completedCount === 1 && !badges.includes('first-quest')) badges.push('first-quest');
        if (QUESTS.every((quest) => completedQuests.includes(quest.id)) && !badges.includes('decision-maker')) badges.push('decision-maker');
        return {
          ...current,
          completedQuests,
          xp: current.xp + 25,
          points: current.points + (correct ? 15 : 5),
          badges,
        };
      });
      return true;
    },
    [state.completedQuests],
  );

  const hireHelper = useCallback(() => {
    if (state.pendingEventId || state.helperHired || state.cash < 35) return false;
    setState((current) => {
      if (current.pendingEventId || current.helperHired || current.cash < 35) return current;
      return {
        ...current,
        cash: current.cash - 35,
        helperHired: true,
        xp: current.xp + 15,
        points: current.points + 10,
        badges: current.badges.includes('team-player')
          ? current.badges
          : [...current.badges, 'team-player'],
        ledger: [makeEntry('Hired a shop helper', -35), ...current.ledger].slice(0, 8),
      };
    });
    return true;
  }, [state.cash, state.helperHired, state.pendingEventId]);

  const resolveBusinessEvent = useCallback((choice: number) => {
    const decision = applyBusinessDecision(state, choice);
    if (!decision) return null;
    setState((current) => {
      if (current.pendingEventId !== state.pendingEventId || current.eventCycle !== state.eventCycle) return current;
      const result = applyBusinessDecision(current, choice);
      if (!result) return current;
      return {
        ...result.state,
        lastEventMessage: result.message,
        ledger: result.cost > 0
          ? [makeEntry('Handled a business surprise', -result.cost), ...current.ledger].slice(0, 8)
          : current.ledger,
      };
    });
    return decision.message;
  }, [state]);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      storageIssue,
      level: Math.floor(state.xp / 100) + 1,
      xpIntoLevel: state.xp % 100,
      chooseName,
      updateAvatar,
      startVenture,
      restock,
      sellProduct,
      changePrice,
      saveMoney,
      withdrawSavings,
      completeQuest,
      hireHelper,
      resolveBusinessEvent,
    }),
    [
      state,
      hydrated,
      storageIssue,
      chooseName,
      updateAvatar,
      startVenture,
      restock,
      sellProduct,
      changePrice,
      saveMoney,
      withdrawSavings,
      completeQuest,
      hireHelper,
      resolveBusinessEvent,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used inside GameProvider');
  return context;
}
