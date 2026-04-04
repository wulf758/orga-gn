"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getEmptyAppData } from "@/lib/data";
import {
  AppData,
  Character,
  Deadline,
  DocumentPage,
  MembershipRole,
  KraftItem,
  Meeting,
  Plot,
  StoryboardCard,
  StoryboardScene,
  Task,
  TimelineDay,
  TimelineEntry,
  TagDefinition,
  TagSection,
  UpdateEntry,
  WorkspaceCategory,
  WorkspaceSummary
} from "@/lib/types";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/date-utils";
import { parseDocumentContent } from "@/lib/document-content";
import {
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured
} from "@/lib/supabase-browser";
import {
  deleteTagAcrossAppData,
  renameTagAcrossAppData
} from "@/lib/tag-mutations";
import {
  createTagSectionList,
  deleteTagSectionAcrossAppData,
  updateTagSectionAcrossAppData
} from "@/lib/tag-section-mutations";
import {
  getMergedTagDefinitions,
  getMergedTagSections,
  isSystemTagLabel,
  isSystemTagSection,
  normalizeTagDefinition,
  normalizeTagLabel,
  normalizeTagSection,
  normalizeTagSectionDefinition
} from "@/lib/tags";

type GameRecord = WorkspaceSummary;

type ActionResult = {
  ok: boolean;
  error?: string;
};

type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

type WorkspaceAccessState = {
  mode: "legacy-password" | "membership";
  role: MembershipRole | null;
};

type CreateGameInput = {
  name: string;
};

type OpenGameInput = {
  id: string;
};

type DeleteGameInput = {
  id: string;
  confirmName: string;
};

type AdminGameInput = {
  id: string;
};

type CreateDocumentInput = {
  kind: "folder" | "note";
  title: string;
  summary: string;
  category: string;
  parentSlug?: string;
};

type UpdateDocumentInput = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  contentText?: string;
  tagsText?: string;
  tags?: string[];
};

type CreateCharacterInput = {
  name: string;
  role: "PJ" | "PNJ";
  tags: string[];
  playerNotes: string;
  background: string;
  objectives: string[];
  secrets: string[];
};

type UpdateCharacterInput = {
  id: string;
  name: string;
  role: "PJ" | "PNJ";
  tags: string[];
  playerNotes: string;
  background: string;
  objectives: string[];
  secrets: string[];
};

type CreatePlotInput = {
  title: string;
  categorySlug: string;
  summary: string;
  stage: Plot["stage"];
};

type UpdatePlotInput = {
  id: string;
  title: string;
  summary: string;
  content: string;
  stage: Plot["stage"];
  tags: string[];
};

type CreateTaskInput = {
  title: string;
  categorySlug: string;
  summary: string;
  owner: string;
  dueDate?: string;
  status: Task["status"];
};

type UpdateTaskInput = {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  owner: string;
  dueDate?: string;
  status: Task["status"];
};

type CreateDeadlineInput = {
  title: string;
  dateISO?: string;
  lane: string;
  status: Deadline["status"];
};

type CreateMeetingInput = {
  categorySlug: string;
  title: string;
  dateISO?: string;
  timeLabel?: string;
  focus: string;
  agendaText: string;
};

type UpdateMeetingInput = {
  id: string;
  title: string;
  dateISO?: string;
  timeLabel?: string;
  focus: string;
  notes: string;
  tags: string[];
  agendaText: string;
};

type CreateTimelineDayInput = {
  label: string;
  dateISO: string;
};

type UpdateTimelineDayInput = {
  id: string;
  label: string;
  dateISO: string;
};

type CreateTimelineEntryInput = {
  dayId: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  summary: string;
  tags: string[];
};

type UpdateTimelineEntryInput = {
  id: string;
  dayId: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  summary: string;
  tags: string[];
};

type CreateStoryboardSceneInput = {
  title: string;
  dayId?: string;
  startTime: string;
  endTime: string;
  location: string;
  summary: string;
  tags: string[];
  cardCount: number;
};

type UpdateStoryboardSceneInput = {
  id: string;
  title: string;
  dayId?: string;
  startTime: string;
  endTime: string;
  location: string;
  status: StoryboardScene["status"];
  summary: string;
  tags: string[];
  cards: StoryboardCard[];
};

type CreateKraftItemInput = {
  title: string;
  summary: string;
  tags: string[];
  owner: string;
  status: KraftItem["status"];
};

type UpdateKraftItemInput = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  owner: string;
  status: KraftItem["status"];
};

type CategorySection = "plots" | "organization" | "meetings";

type CreateCategoryInput = {
  section: CategorySection;
  title: string;
  summary: string;
};

type UpdateCategoryInput = {
  section: CategorySection;
  slug: string;
  title: string;
  summary: string;
};

type CreateTagDefinitionInput = {
  label: string;
  section: string;
  sectionColor: string;
  color: string;
  description?: string;
};

type UpdateTagDefinitionInput = {
  id: string;
  label: string;
  section: string;
  sectionColor: string;
  color: string;
  description?: string;
};

type CreateTagSectionInput = {
  label: string;
  color: string;
};

type UpdateTagSectionInput = {
  id: string;
  label: string;
  color: string;
};

type AppDataContextValue = {
  isReady: boolean;
  isSuperAdmin: boolean;
  isAuthConfigured: boolean;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authUser: AuthUser | null;
  workspaceAccess: WorkspaceAccessState | null;
  isCurrentGameReadOnly: boolean;
  canViewPlayerInfo: boolean;
  games: GameRecord[];
  currentGameId: string | null;
  currentGame: GameRecord | null;
  hasCurrentGame: boolean;
  data: AppData;
  signInWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<ActionResult>;
  signUpWithPassword: (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<ActionResult>;
  signOutUser: () => Promise<void>;
  createGame: (input: CreateGameInput) => Promise<ActionResult>;
  openGame: (input: OpenGameInput) => Promise<ActionResult>;
  archiveGame: (input: DeleteGameInput) => Promise<ActionResult>;
  restoreGame: (input: AdminGameInput) => Promise<ActionResult>;
  deleteGamePermanently: (input: AdminGameInput) => Promise<ActionResult>;
  leaveGame: () => Promise<void>;
  updateGameName: (value: string) => Promise<ActionResult>;
  createDocument: (input: CreateDocumentInput) => void;
  updateDocument: (input: UpdateDocumentInput) => void;
  deleteDocument: (slug: string) => void;
  createCategory: (input: CreateCategoryInput) => void;
  updateCategory: (input: UpdateCategoryInput) => void;
  deleteCategory: (section: CategorySection, slug: string) => void;
  createTagSection: (input: CreateTagSectionInput) => void;
  updateTagSection: (input: UpdateTagSectionInput) => void;
  deleteTagSection: (id: string) => void;
  createTagDefinition: (input: CreateTagDefinitionInput) => void;
  updateTagDefinition: (input: UpdateTagDefinitionInput) => void;
  deleteTagDefinition: (id: string) => void;
  createCharacter: (input: CreateCharacterInput) => void;
  updateCharacter: (input: UpdateCharacterInput) => void;
  deleteCharacter: (id: string) => void;
  createPlot: (input: CreatePlotInput) => void;
  updatePlot: (input: UpdatePlotInput) => void;
  deletePlot: (id: string) => void;
  createTask: (input: CreateTaskInput) => void;
  updateTask: (input: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  createDeadline: (input: CreateDeadlineInput) => void;
  createMeeting: (input: CreateMeetingInput) => void;
  updateMeeting: (input: UpdateMeetingInput) => void;
  deleteMeeting: (id: string) => void;
  createTimelineDay: (input: CreateTimelineDayInput) => void;
  updateTimelineDay: (input: UpdateTimelineDayInput) => void;
  deleteTimelineDay: (id: string) => void;
  createTimelineEntry: (input: CreateTimelineEntryInput) => void;
  updateTimelineEntry: (input: UpdateTimelineEntryInput) => void;
  deleteTimelineEntry: (id: string) => void;
  createStoryboardScene: (input: CreateStoryboardSceneInput) => void;
  updateStoryboardScene: (input: UpdateStoryboardSceneInput) => void;
  deleteStoryboardScene: (id: string) => void;
  createKraftItem: (input: CreateKraftItemInput) => void;
  updateKraftItem: (input: UpdateKraftItemInput) => void;
  deleteKraftItem: (id: string) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeUpdate(area: string, title: string, detail: string): UpdateEntry {
  return {
    id: `update-${crypto.randomUUID()}`,
    area,
    title,
    detail,
    when: "A l'instant"
  };
}

function makeCategory(section: CategorySection, title: string, summary: string): WorkspaceCategory {
  return {
    slug: `${slugify(title) || "categorie"}-${Date.now().toString().slice(-5)}`,
    title,
    summary,
    updatedAt: "A l'instant",
    tags: [section]
  };
}

function upsertTagSection(
  sections: TagSection[],
  label: string,
  color: string
) {
  const normalizedLabel = normalizeTagSection(label);
  const normalized = normalizeTagSectionDefinition({
    id: `section-${slugify(normalizedLabel) || Date.now().toString()}`,
    label: normalizedLabel,
    color
  });

  const existing = sections.find(
    (section) => normalizeTagSection(section.label) === normalizedLabel
  );

  if (!existing) {
    return [...sections, normalized].sort((left, right) => {
      if (isSystemTagSection(left.label)) return -1;
      if (isSystemTagSection(right.label)) return 1;
      return left.label.localeCompare(right.label);
    });
  }

  return sections
    .map((section) =>
      normalizeTagSection(section.label) === normalizedLabel
        ? { ...section, label: normalized.label, color: normalized.color }
        : section
    )
    .sort((left, right) => {
      if (isSystemTagSection(left.label)) return -1;
      if (isSystemTagSection(right.label)) return 1;
      return left.label.localeCompare(right.label);
    });
}

function makeStoryboardCards(count: number, existingCards: StoryboardCard[] = []) {
  return Array.from({ length: count }, (_, index) => ({
    id: existingCards[index]?.id ?? `story-card-${crypto.randomUUID()}`,
    title: existingCards[index]?.title ?? `Case ${index + 1}`,
    content: existingCards[index]?.content ?? ""
  }));
}

function normalizeStoryboardScene(scene: Partial<StoryboardScene> & Record<string, unknown>) {
  const legacyCards = [
    {
      title: "Deroule",
      content:
        typeof scene.sceneText === "string" && scene.sceneText.trim()
          ? scene.sceneText
          : typeof scene.summary === "string"
          ? scene.summary
          : ""
    },
    {
      title: "Actions PNJ",
      content: Array.isArray(scene.pnjActions) ? scene.pnjActions.join("\n") : ""
    },
    {
      title: "Vigilance orga",
      content: Array.isArray(scene.orgaActions) ? scene.orgaActions.join("\n") : ""
    },
    {
      title: "Besoins materiels",
      content: Array.isArray(scene.materialNeeds) ? scene.materialNeeds.join("\n") : ""
    },
    {
      title: "Informations cles",
      content: Array.isArray(scene.keyInfo) ? scene.keyInfo.join("\n") : ""
    }
  ].filter((card) => card.content.trim());

  const cards =
    Array.isArray(scene.cards) && scene.cards.length
      ? scene.cards.map((card, index) => ({
          id: card.id ?? `story-card-${crypto.randomUUID()}`,
          title: card.title?.trim() || `Case ${index + 1}`,
          content: card.content ?? ""
        }))
      : legacyCards.length
      ? legacyCards.map((card, index) => ({
          id: `story-card-${crypto.randomUUID()}`,
          title: card.title || `Case ${index + 1}`,
          content: card.content
        }))
      : makeStoryboardCards(3);

  return {
    id: scene.id as string,
    title: (scene.title as string) ?? "Scene",
    dayId: scene.dayId as string | undefined,
    timelineEntryId: scene.timelineEntryId as string | undefined,
    startTime: (scene.startTime as string) ?? "10:00",
    endTime: (scene.endTime as string) ?? "10:30",
    location: (scene.location as string) ?? "Lieu a preciser",
    status: (scene.status as StoryboardScene["status"]) ?? "A cadrer",
    summary: (scene.summary as string) ?? "Scene storyboard a completer.",
    tags: (scene.tags as string[] | undefined) ?? [],
    cards
  } satisfies StoryboardScene;
}

function normalizeAppData(parsed?: Partial<AppData> | null, fallbackName?: string): AppData {
  const initialData = getEmptyAppData(fallbackName);
  const tagSections = getMergedTagSections(parsed?.tagSections, parsed?.tagsRegistry);
  const sectionColorMap = new Map(
    tagSections.map((section) => [normalizeTagSection(section.label), section.color] as const)
  );

  return {
    ...initialData,
    ...parsed,
    gameName:
      typeof parsed?.gameName === "string" && parsed.gameName.trim()
        ? parsed.gameName
        : fallbackName || initialData.gameName,
    tagSections,
    tagsRegistry: getMergedTagDefinitions(parsed?.tagsRegistry).map((definition) => ({
      ...definition,
      sectionColor:
        sectionColorMap.get(normalizeTagSection(definition.section)) ?? definition.sectionColor
    })),
    documents: (parsed?.documents ?? initialData.documents).map((document) => ({
      ...document,
      tags: document.tags ?? []
    })),
    characters: (parsed?.characters ?? initialData.characters).map((character) => ({
      ...character,
      tags: character.tags ?? [],
      playerNotes: character.playerNotes ?? "",
      background: character.background ?? character.pitch ?? "",
      objectives: character.objectives ?? character.goals ?? [],
      secrets: character.secrets ?? [],
      relatedPlots: character.relatedPlots ?? [],
      linkedPages: character.linkedPages ?? []
    })),
    plots: (parsed?.plots ?? initialData.plots).map((plot) => ({
      ...plot,
      content: plot.content ?? plot.summary ?? "",
      tags: plot.tags ?? ["brouillon"]
    })),
    tasks: (parsed?.tasks ?? initialData.tasks).map((task) => ({
      ...task,
      summary: task.summary ?? task.title,
      content: task.content ?? task.summary ?? task.title,
      tags: task.tags ?? ["brouillon"],
      dueDate: task.dueDate,
      dueLabel: task.dueDate
        ? formatDateLabel(task.dueDate)
        : task.dueLabel ?? "Sans echeance"
    })),
    deadlines: (parsed?.deadlines ?? initialData.deadlines).map((deadline) => ({
      ...deadline,
      dateISO: deadline.dateISO,
      dateLabel: deadline.dateISO
        ? formatDateLabel(deadline.dateISO, "Date a fixer")
        : deadline.dateLabel ?? "Date a fixer"
    })),
    meetings: (parsed?.meetings ?? initialData.meetings).map((meeting) => ({
      ...meeting,
      categorySlug: meeting.categorySlug ?? "scenario",
      dateISO: meeting.dateISO,
      timeLabel: meeting.timeLabel,
      dateLabel:
        meeting.dateISO || meeting.timeLabel
          ? formatDateTimeLabel(meeting.dateISO, meeting.timeLabel, "Date a fixer")
          : meeting.dateLabel ?? "Date a fixer",
      notes: meeting.notes ?? meeting.focus ?? "",
      tags: meeting.tags ?? ["brouillon"]
    })),
    plotCategories: (parsed?.plotCategories ?? initialData.plotCategories).map((category) => ({
      ...category,
      tags: category.tags ?? []
    })),
    organizationCategories:
      (parsed?.organizationCategories ?? initialData.organizationCategories).map((category) => ({
        ...category,
        tags: category.tags ?? []
      })),
    meetingCategories: (parsed?.meetingCategories ?? initialData.meetingCategories).map(
      (category) => ({
        ...category,
        tags: category.tags ?? []
      })
    ),
    timelineDays: (parsed?.timelineDays ?? initialData.timelineDays)
      .slice()
      .sort((left, right) => left.order - right.order),
    timelineEntries: (parsed?.timelineEntries ?? initialData.timelineEntries).map((entry) => ({
      ...entry,
      tags: entry.tags ?? [],
      storyboardSceneId: entry.storyboardSceneId
    })),
    storyboardScenes: (parsed?.storyboardScenes ?? initialData.storyboardScenes).map((scene) =>
      normalizeStoryboardScene(scene)
    ),
    kraftItems: (parsed?.kraftItems ?? initialData.kraftItems).map((item) => ({
      ...item,
      tags: item.tags ?? []
    }))
  };
}

function replaceGameRecord(current: GameRecord[], nextGame: GameRecord) {
  const otherGames = current.filter((game) => game.id !== nextGame.id);
  return [nextGame, ...otherGames].sort((left, right) =>
    left.updatedAt < right.updatedAt ? 1 : -1
  );
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function readActionError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

const WORKSPACE_SAVE_DEBOUNCE_MS = 450;

function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) {
    return null;
  }

  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : null;
  const displayName =
    (typeof metadata?.display_name === "string" && metadata.display_name) ||
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    user.email?.split("@")[0] ||
    null;

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: displayName?.trim() || null
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseAuthConfigured());
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [workspaceAccess, setWorkspaceAccess] = useState<WorkspaceAccessState | null>(null);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [currentGame, setCurrentGame] = useState<GameRecord | null>(null);
  const [data, setData] = useState<AppData>(getEmptyAppData);
  const skipNextSaveRef = useRef(true);
  const currentGameRef = useRef<GameRecord | null>(null);
  const latestDataRef = useRef<AppData>(getEmptyAppData());
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPersistingRef = useRef(false);
  const queuedPersistRef = useRef(false);
  const isMountedRef = useRef(true);
  const isAuthConfigured = isSupabaseAuthConfigured();

  function clearScheduledSave() {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }

  function resetWorkspaceState() {
    clearScheduledSave();
    const emptyData = getEmptyAppData();
    currentGameRef.current = null;
    latestDataRef.current = emptyData;
    skipNextSaveRef.current = true;
    queuedPersistRef.current = false;
    setWorkspaceAccess(null);
    setCurrentGame(null);
    setData(emptyData);
  }

  function commitWorkspace(game: GameRecord, nextData: AppData, seedGames?: GameRecord[]) {
    const normalized = normalizeAppData(nextData, game.name);
    clearScheduledSave();
    currentGameRef.current = game;
    latestDataRef.current = normalized;
    skipNextSaveRef.current = true;
    queuedPersistRef.current = false;
    setCurrentGame(game);
    setGames((current) => replaceGameRecord(current.length ? current : seedGames ?? current, game));
    setData(normalized);
  }

  function getAuthHeaders(extraHeaders?: HeadersInit) {
    const headers = new Headers(extraHeaders);

    if (authSession?.access_token) {
      headers.set("Authorization", `Bearer ${authSession.access_token}`);
    }

    return headers;
  }

  async function loadWorkspaceOverview() {
    const gamesResponse = await fetch("/api/games", {
      cache: "no-store",
      headers: getAuthHeaders()
    });

    if (!gamesResponse.ok) {
      throw new Error("Unable to load games");
    }

    return readJson<{
      games?: GameRecord[];
      currentGame?: GameRecord | null;
    }>(gamesResponse);
  }

  async function persistWorkspaceSnapshot(snapshot: AppData) {
    if (!currentGameRef.current) return;

    if (isPersistingRef.current) {
      queuedPersistRef.current = true;
      return;
    }

    isPersistingRef.current = true;

    try {
      const response = await fetch("/api/workspace", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: snapshot })
      });

      if (!response.ok) {
        if (response.status === 401 && isMountedRef.current) {
          resetWorkspaceState();
        }
        return;
      }

      const payload = await readJson<{ game: GameRecord }>(response);

      if (!isMountedRef.current) return;

      currentGameRef.current = payload.game;
      setCurrentGame(payload.game);
      setGames((current) => replaceGameRecord(current, payload.game));
    } catch {
      // L'interface reste editable localement ; un echec reseau n'efface pas l'etat.
    } finally {
      isPersistingRef.current = false;
      if (queuedPersistRef.current && currentGameRef.current) {
        queuedPersistRef.current = false;
        void persistWorkspaceSnapshot(latestDataRef.current);
      }
    }
  }

  useEffect(() => {
    currentGameRef.current = currentGame;
  }, [currentGame]);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearScheduledSave();
    };
  }, []);

  useEffect(() => {
    if (!isAuthConfigured) {
      setIsAuthLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data: sessionData }) => {
        if (!active) return;
        setAuthSession(sessionData.session ?? null);
        setAuthUser(toAuthUser(sessionData.session?.user));
      })
      .finally(() => {
        if (active) {
          setIsAuthLoading(false);
        }
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthSession(session);
      setAuthUser(toAuthUser(session?.user));
      setIsAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isAuthConfigured]);

  useEffect(() => {
    if (!authSession?.access_token || !authUser) {
      return;
    }

    void fetch("/api/profile", {
      method: "POST",
      headers: getAuthHeaders()
    }).catch(() => {
      // La synchro du profil ne doit pas bloquer l'interface.
    });
  }, [authSession?.access_token, authUser]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const overview = await loadWorkspaceOverview();

        if (!active) return;

        const nextGames = Array.isArray(overview.games) ? overview.games : [];
        const nextCurrentGame = overview.currentGame ?? null;

        const adminResponse = await fetch("/api/admin/session", {
          cache: "no-store",
          headers: getAuthHeaders()
        });
        const adminPayload = adminResponse.ok
          ? await readJson<{ isSuperAdmin?: boolean }>(adminResponse)
          : { isSuperAdmin: false };

        setGames(nextGames);
        setIsSuperAdmin(Boolean(adminPayload.isSuperAdmin));

        if (!nextCurrentGame) {
          resetWorkspaceState();
          return;
        }

        const workspaceResponse = await fetch("/api/workspace", {
          cache: "no-store"
        });

        if (!workspaceResponse.ok) {
          resetWorkspaceState();
          return;
        }

        const workspace = await readJson<{
          game: GameRecord;
          data: AppData;
          access?: WorkspaceAccessState;
        }>(workspaceResponse);

        if (!active) return;

        commitWorkspace(workspace.game, workspace.data, nextGames);
        setWorkspaceAccess(workspace.access ?? null);
      } catch {
        if (!active) return;
        setGames([]);
        setIsSuperAdmin(false);
        resetWorkspaceState();
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [authSession?.access_token]);

  useEffect(() => {
    if (!isReady || !currentGame) return;

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    clearScheduledSave();
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      void persistWorkspaceSnapshot(latestDataRef.current);
    }, WORKSPACE_SAVE_DEBOUNCE_MS);

    return () => {
      clearScheduledSave();
    };
  }, [currentGame, data, isReady]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      isReady,
      isSuperAdmin,
      isAuthConfigured,
      isAuthenticated: Boolean(authUser),
      isAuthLoading,
      authUser,
      workspaceAccess,
      isCurrentGameReadOnly: workspaceAccess?.role === "lecture",
      canViewPlayerInfo: workspaceAccess?.role !== "lecture",
      games,
      currentGameId: currentGame?.id ?? null,
      currentGame,
      hasCurrentGame: Boolean(currentGame),
      data,
      async signInWithPassword(input) {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          return { ok: false, error: "Authentification Supabase indisponible." };
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: input.email.trim(),
          password: input.password
        });

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      },
      async signUpWithPassword(input) {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          return { ok: false, error: "Authentification Supabase indisponible." };
        }

        const { error } = await supabase.auth.signUp({
          email: input.email.trim(),
          password: input.password,
          options: {
            data: {
              display_name: input.displayName?.trim() || undefined
            }
          }
        });

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      },
      async signOutUser() {
        const supabase = getSupabaseBrowserClient();

        try {
          if (supabase) {
            await supabase.auth.signOut();
          }
        } finally {
          resetWorkspaceState();
        }
      },
      async createGame(input) {
        try {
          const response = await fetch("/api/games", {
              method: "POST",
              headers: getAuthHeaders({
                "Content-Type": "application/json"
              }),
              body: JSON.stringify(input)
            });

          if (!response.ok) {
            return {
              ok: false,
              error: await readActionError(response, "Creation impossible.")
            };
          }

            const payload = await readJson<{
              game: GameRecord;
              data: AppData;
              access?: WorkspaceAccessState;
            }>(response);
            commitWorkspace(payload.game, payload.data);
            setWorkspaceAccess(payload.access ?? null);

            return { ok: true };
        } catch {
          return { ok: false, error: "Creation impossible." };
        }
      },
      async openGame(input) {
          try {
            const response = await fetch("/api/games/open", {
              method: "POST",
              headers: getAuthHeaders({
                "Content-Type": "application/json"
              }),
              body: JSON.stringify(input)
            });

          if (!response.ok) {
            return {
              ok: false,
              error: await readActionError(response, "Acces refuse.")
            };
          }

            const payload = await readJson<{
              game: GameRecord;
              data: AppData;
              access?: WorkspaceAccessState;
            }>(response);
            commitWorkspace(payload.game, payload.data);
            setWorkspaceAccess(payload.access ?? null);

            return { ok: true };
        } catch {
          return { ok: false, error: "Acces refuse." };
        }
      },
      async archiveGame(input) {
        try {
            const response = await fetch(`/api/games/${input.id}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                confirmName: input.confirmName
              })
            });

          if (!response.ok) {
            return {
              ok: false,
              error: await readActionError(response, "Archivage impossible.")
            };
          }

          const payload = await readJson<{ game?: GameRecord }>(response);
          const isArchivingCurrentGame = currentGameRef.current?.id === input.id;
          clearScheduledSave();
          queuedPersistRef.current = false;
          if (payload.game) {
            setGames((current) => replaceGameRecord(current, payload.game!));
          }

          if (isArchivingCurrentGame) {
            resetWorkspaceState();
          }

          return { ok: true };
        } catch {
          return { ok: false, error: "Archivage impossible." };
        }
      },
      async restoreGame(input) {
        try {
          const response = await fetch(`/api/admin/games/${input.id}`, {
            method: "PATCH",
            headers: getAuthHeaders()
          });

          if (!response.ok) {
            return {
              ok: false,
              error: await readActionError(response, "Restauration impossible.")
            };
          }

          const payload = await readJson<{ game: GameRecord }>(response);
          setGames((current) => replaceGameRecord(current, payload.game));
          return { ok: true };
        } catch {
          return { ok: false, error: "Restauration impossible." };
        }
      },
      async deleteGamePermanently(input) {
        try {
          const response = await fetch(`/api/admin/games/${input.id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
          });

          if (!response.ok) {
            return {
              ok: false,
              error: await readActionError(response, "Suppression definitive impossible.")
            };
          }

          const isDeletingCurrentGame = currentGameRef.current?.id === input.id;
          clearScheduledSave();
          queuedPersistRef.current = false;
          setGames((current) => current.filter((game) => game.id !== input.id));

          if (isDeletingCurrentGame) {
            resetWorkspaceState();
          }

          return { ok: true };
        } catch {
          return { ok: false, error: "Suppression definitive impossible." };
        }
      },
      async leaveGame() {
        try {
          await fetch("/api/session", {
            method: "DELETE"
          });
        } finally {
          resetWorkspaceState();
        }
      },
      async updateGameName(value) {
        const nextName = value.trim();
        if (!nextName) {
          return { ok: false, error: "Le nom du GN est requis." };
        }

        try {
          const response = await fetch("/api/workspace/name", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: nextName })
          });

          if (!response.ok) {
            return {
              ok: false,
              error: await readActionError(response, "Renommage impossible.")
            };
          }

          const payload = await readJson<{ game: GameRecord; data: AppData }>(response);
          commitWorkspace(payload.game, payload.data);

          return { ok: true };
        } catch {
          return { ok: false, error: "Renommage impossible." };
        }
      },
      createDocument(input) {
        const slugBase =
          slugify(input.title) || (input.kind === "folder" ? "nouveau-dossier" : "nouvelle-note");
        const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;

        const document: DocumentPage = {
          slug,
          kind: input.kind,
          title: input.title,
          icon: input.title.charAt(0).toUpperCase() || "N",
          summary: input.summary,
          category: input.category,
          parentSlug: input.parentSlug || undefined,
          updatedAt: "A l'instant",
          tags: ["brouillon"],
          content: [
            {
              heading: input.title,
              paragraphs: [
                input.summary ||
                  (input.kind === "folder"
                    ? "Ce dossier vient d'etre cree et peut maintenant accueillir des sous-elements."
                    : "Cette note vient d'etre creee et reste a completer.")
              ]
            }
          ]
        };

        setData((current) => ({
          ...current,
          documents: [document, ...current.documents],
          updates: [
            makeUpdate(
              "Documents",
              input.kind === "folder"
                ? `Nouveau dossier : ${input.title}`
                : `Nouvelle note : ${input.title}`,
              input.parentSlug
                ? "L'element a ete place dans un dossier existant."
                : "Une nouvelle entree documentaire a ete ajoutee."
            ),
            ...current.updates
          ]
        }));
      },
      updateDocument(input) {
        setData((current) => ({
          ...current,
          documents: current.documents.map((document) =>
            document.slug === input.slug
              ? {
                  ...document,
                  title: input.title,
                  summary: input.summary,
                  category: input.category,
                  tags:
                    Array.isArray(input.tags)
                      ? input.tags
                      : typeof input.tagsText === "string"
                      ? input.tagsText
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                      : document.tags,
                    content:
                      typeof input.contentText === "string" && document.kind === "note"
                        ? parseDocumentContent(input.contentText, input.title)
                        : document.content,
                  updatedAt: "A l'instant"
                }
              : document
          ),
          updates: [
            makeUpdate(
              "Documents",
              `Modification : ${input.title}`,
              "Le dossier ou la note a ete mis a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deleteDocument(slug) {
        setData((current) => {
          const documentsToRemove = new Set<string>([slug]);
          let changed = true;

          while (changed) {
            changed = false;

            current.documents.forEach((document) => {
              if (
                document.parentSlug &&
                documentsToRemove.has(document.parentSlug) &&
                !documentsToRemove.has(document.slug)
              ) {
                documentsToRemove.add(document.slug);
                changed = true;
              }
            });
          }

          const target = current.documents.find((document) => document.slug === slug);

          return {
            ...current,
            documents: current.documents.filter(
              (document) => !documentsToRemove.has(document.slug)
            ),
            updates: target
              ? [
                  makeUpdate(
                    "Documents",
                    `Suppression : ${target.title}`,
                    target.kind === "folder"
                      ? "Le dossier et ses sous-elements ont ete supprimes."
                      : "La note a ete supprimee."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      },
      createCategory(input) {
        const category = makeCategory(input.section, input.title, input.summary);

        setData((current) => ({
          ...current,
          plotCategories:
            input.section === "plots"
              ? [category, ...current.plotCategories]
              : current.plotCategories,
          organizationCategories:
            input.section === "organization"
              ? [category, ...current.organizationCategories]
              : current.organizationCategories,
          meetingCategories:
            input.section === "meetings"
              ? [category, ...current.meetingCategories]
              : current.meetingCategories,
          updates: [
            makeUpdate(
              input.section === "plots"
                ? "Intrigues"
                : input.section === "organization"
                ? "Organisation"
                : "Reunion orga",
              `Nouvelle categorie : ${input.title}`,
              "Une nouvelle categorie a ete ajoutee."
            ),
            ...current.updates
          ]
        }));
      },
      updateCategory(input) {
        setData((current) => ({
          ...current,
          plotCategories:
            input.section === "plots"
              ? current.plotCategories.map((category) =>
                  category.slug === input.slug
                    ? {
                        ...category,
                        title: input.title,
                        summary: input.summary,
                        updatedAt: "A l'instant"
                      }
                    : category
                )
              : current.plotCategories,
          organizationCategories:
            input.section === "organization"
              ? current.organizationCategories.map((category) =>
                  category.slug === input.slug
                    ? {
                        ...category,
                        title: input.title,
                        summary: input.summary,
                        updatedAt: "A l'instant"
                      }
                    : category
                )
              : current.organizationCategories,
          meetingCategories:
            input.section === "meetings"
              ? current.meetingCategories.map((category) =>
                  category.slug === input.slug
                    ? {
                        ...category,
                        title: input.title,
                        summary: input.summary,
                        updatedAt: "A l'instant"
                      }
                    : category
                )
              : current.meetingCategories,
          updates: [
            makeUpdate(
              input.section === "plots"
                ? "Intrigues"
                : input.section === "organization"
                ? "Organisation"
                : "Reunion orga",
              `Categorie modifiee : ${input.title}`,
              "La categorie a ete mise a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deleteCategory(section, slug) {
        setData((current) => ({
          ...current,
          plotCategories:
            section === "plots"
              ? current.plotCategories.filter((category) => category.slug !== slug)
              : current.plotCategories,
          plots:
            section === "plots"
              ? current.plots.filter((plot) => plot.categorySlug !== slug)
              : current.plots,
          organizationCategories:
            section === "organization"
              ? current.organizationCategories.filter((category) => category.slug !== slug)
              : current.organizationCategories,
          tasks:
            section === "organization"
              ? current.tasks.filter((task) => task.categorySlug !== slug)
              : current.tasks,
          meetingCategories:
            section === "meetings"
              ? current.meetingCategories.filter((category) => category.slug !== slug)
              : current.meetingCategories,
          meetings:
            section === "meetings"
              ? current.meetings.filter((meeting) => meeting.categorySlug !== slug)
              : current.meetings,
          updates: [
            makeUpdate(
              section === "plots"
                ? "Intrigues"
                : section === "organization"
                ? "Organisation"
                : "Reunion orga",
              "Categorie supprimee",
              "La categorie et son contenu associe ont ete supprimes."
            ),
            ...current.updates
          ]
        }));
      },
      createTagSection(input) {
        const nextLabel = normalizeTagSection(input.label);
        if (!nextLabel || isSystemTagSection(nextLabel)) return;

        setData((current) => {
          const existing = current.tagSections.find(
            (section) => normalizeTagSection(section.label) === nextLabel
          );
          if (existing) {
            return current;
          }

          const nextSections = createTagSectionList(current.tagSections, input);
          const nextSection = nextSections.find(
            (section) => normalizeTagSection(section.label) === nextLabel
          );

          if (!nextSection) {
            return current;
          }

          return {
            ...current,
            tagSections: nextSections,
            updates: [
              makeUpdate(
                "Tags",
                `Section ajoutee : ${nextSection.label}`,
                "Une nouvelle section de tags a ete creee."
              ),
              ...current.updates
            ]
          };
        });
      },
      updateTagSection(input) {
        const nextLabel = normalizeTagSection(input.label);
        if (!nextLabel) return;

        setData((current) => {
          const target = current.tagSections.find((section) => section.id === input.id);
          if (!target) {
            return current;
          }
          if (isSystemTagSection(target.label) || isSystemTagSection(nextLabel)) {
            return current;
          }

          const duplicate = current.tagSections.find(
            (section) =>
              section.id !== input.id &&
              normalizeTagSection(section.label) === nextLabel
          );
          if (duplicate) {
            return current;
          }

          const nextData = updateTagSectionAcrossAppData(current, input);

          return {
            ...nextData,
            updates: [
              makeUpdate(
                "Tags",
                `Section modifiee : ${target.label}`,
                "Le nom ou la couleur de la section a ete mis a jour."
              ),
              ...current.updates
            ]
          };
        });
      },
      deleteTagSection(id) {
        setData((current) => {
          const target = current.tagSections.find((section) => section.id === id);
          if (!target) {
            return current;
          }
          if (isSystemTagSection(target.label)) {
            return current;
          }

          const isUsed = current.tagsRegistry.some(
            (definition) =>
              normalizeTagSection(definition.section) === normalizeTagSection(target.label)
          );

          if (isUsed) {
            return {
              ...current,
              updates: [
                makeUpdate(
                  "Tags",
                  `Suppression impossible : ${target.label}`,
                  "La section contient encore des tags. Vide-la avant suppression."
                ),
                ...current.updates
              ]
            };
          }

          const result = deleteTagSectionAcrossAppData(current, id);

          return {
            ...result.data,
            updates: [
              makeUpdate(
                "Tags",
                `Section supprimee : ${target.label}`,
                "La section vide a ete retiree."
              ),
              ...current.updates
            ]
          };
        });
      },
      createTagDefinition(input) {
        const nextLabel = normalizeTagLabel(input.label);
        if (!nextLabel || isSystemTagLabel(nextLabel) || isSystemTagSection(input.section)) return;

        setData((current) => {
          const existing = current.tagsRegistry.find(
            (definition) => normalizeTagLabel(definition.label) === nextLabel
          );

          if (existing) {
            return current;
          }

          const definition = normalizeTagDefinition({
            id: `tag-${slugify(nextLabel) || Date.now().toString()}`,
            label: nextLabel,
            section: input.section,
            sectionColor: input.sectionColor,
            color: input.color,
            description: input.description
          });

          return {
            ...current,
            tagSections: upsertTagSection(current.tagSections, input.section, input.sectionColor),
            tagsRegistry: [...current.tagsRegistry, definition].sort((left, right) =>
              left.label.localeCompare(right.label)
            ),
            updates: [
              makeUpdate(
                "Tags",
                `Tag ajoute : ${definition.label}`,
                "Le lexique commun des tags a ete enrichi."
              ),
              ...current.updates
            ]
          };
        });
      },
      updateTagDefinition(input) {
        const nextLabel = normalizeTagLabel(input.label);
        if (!nextLabel) return;

        setData((current) => {
          const target = current.tagsRegistry.find((definition) => definition.id === input.id);
          if (!target) {
            return current;
          }
          if (
            isSystemTagLabel(target.label) ||
            isSystemTagLabel(nextLabel) ||
            isSystemTagSection(input.section)
          ) {
            return current;
          }

          const duplicate = current.tagsRegistry.find(
            (definition) =>
              definition.id !== input.id &&
              normalizeTagLabel(definition.label) === nextLabel
          );

          if (duplicate) {
            return current;
          }

          const sameSection =
            normalizeTagSection(target.section) === normalizeTagSection(input.section);

          const nextData = renameTagAcrossAppData(current, target.label, nextLabel);

          return {
            ...nextData,
            tagSections: upsertTagSection(current.tagSections, input.section, input.sectionColor),
            tagsRegistry: current.tagsRegistry
              .map((definition) =>
                definition.id === input.id ||
                (sameSection &&
                  normalizeTagSection(definition.section) === normalizeTagSection(input.section))
                  ? normalizeTagDefinition({
                      ...definition,
                      label: definition.id === input.id ? nextLabel : definition.label,
                      section: definition.id === input.id ? input.section : definition.section,
                      sectionColor: input.sectionColor,
                      color: input.sectionColor,
                      description:
                        definition.id === input.id ? input.description : definition.description
                    })
                  : definition
              )
              .sort((left, right) => left.label.localeCompare(right.label)),
            updates: [
              makeUpdate(
                "Tags",
                `Tag modifie : ${target.label} -> ${nextLabel}`,
                "Le nom du tag a ete mis a jour dans tout le GN."
              ),
              ...current.updates
            ]
          };
        });
      },
      deleteTagDefinition(id) {
        setData((current) => {
          const target = current.tagsRegistry.find((definition) => definition.id === id);
          if (!target) {
            return current;
          }
          if (isSystemTagLabel(target.label)) {
            return current;
          }

          const nextData = deleteTagAcrossAppData(current, target.label);

          return {
            ...nextData,
            tagsRegistry: current.tagsRegistry.filter((definition) => definition.id !== id),
            updates: [
              makeUpdate(
                "Tags",
                `Tag supprime : ${target.label}`,
                "Le tag a ete retire du registre et des fiches qui l'utilisaient."
              ),
              ...current.updates
            ]
          };
        });
      },
      createCharacter(input) {
        const id = `${slugify(input.name) || "personnage"}-${Date.now()
          .toString()
          .slice(-5)}`;

        setData((current) => ({
          ...current,
          characters: [
            {
              id,
              name: input.name,
              role: input.role,
              tags: input.tags,
              playerNotes: input.playerNotes,
              background: input.background,
              objectives: input.objectives,
              secrets: input.secrets
            },
            ...current.characters
          ],
          updates: [
            makeUpdate(
              "Personnages",
              `${input.role} ajoute : ${input.name}`,
              "La fiche personnage a ete creee et peut maintenant etre enrichie."
            ),
            ...current.updates
          ]
        }));
      },
      updateCharacter(input) {
        setData((current) => ({
          ...current,
          characters: current.characters.map((character) =>
            character.id === input.id
                  ? {
                      ...character,
                      name: input.name,
                      role: input.role,
                      tags: input.tags,
                      playerNotes: input.playerNotes,
                      background: input.background,
                      objectives: input.objectives,
                    secrets: input.secrets
                }
              : character
          ),
          updates: [
            makeUpdate(
              "Personnages",
              `Modification : ${input.name}`,
              "La fiche personnage a ete mise a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deleteCharacter(id) {
        setData((current) => {
          const target = current.characters.find((character) => character.id === id);

          return {
            ...current,
            characters: current.characters.filter((character) => character.id !== id),
            updates: target
              ? [
                  makeUpdate(
                    "Personnages",
                    `Suppression : ${target.name}`,
                    "La fiche personnage a ete supprimee."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      },
      createPlot(input) {
        const id = `${slugify(input.title) || "intrigue"}-${Date.now()
          .toString()
          .slice(-5)}`;

        const plot: Plot = {
          id,
          title: input.title,
          categorySlug: input.categorySlug,
          stage: input.stage,
          summary: input.summary,
          content: input.summary,
          tags: ["brouillon"],
          beats: [],
          characters: [],
          linkedPages: []
        };

        setData((current) => ({
          ...current,
          plots: [plot, ...current.plots],
          updates: [
            makeUpdate(
              "Intrigues",
              `Nouvelle intrigue : ${input.title}`,
              "Une nouvelle intrigue a ete ajoutee dans sa categorie."
            ),
            ...current.updates
          ]
        }));
      },
      updatePlot(input) {
        setData((current) => ({
          ...current,
          plots: current.plots.map((plot) =>
            plot.id === input.id
              ? {
                  ...plot,
                  title: input.title,
                  summary: input.summary,
                  content: input.content,
                  stage: input.stage,
                  tags: input.tags
                }
              : plot
          ),
          updates: [
            makeUpdate(
              "Intrigues",
              `Modification : ${input.title}`,
              "La fiche intrigue a ete mise a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deletePlot(id) {
        setData((current) => {
          const target = current.plots.find((plot) => plot.id === id);

          return {
            ...current,
            plots: current.plots.filter((plot) => plot.id !== id),
            updates: target
              ? [
                  makeUpdate(
                    "Intrigues",
                    `Suppression : ${target.title}`,
                    "L'intrigue a ete supprimee."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      },
      createTask(input) {
        const task: Task = {
          id: `task-${crypto.randomUUID()}`,
          title: input.title,
          categorySlug: input.categorySlug,
          summary: input.summary,
          content: input.summary,
          tags: ["brouillon"],
          owner: input.owner,
          dueDate: input.dueDate,
          dueLabel: formatDateLabel(input.dueDate),
          status: input.status
        };

        setData((current) => ({
          ...current,
          tasks: [task, ...current.tasks],
          updates: [
            makeUpdate(
              "Organisation",
              `Nouvelle tache : ${input.title}`,
              "La tache a ete ajoutee dans sa categorie."
            ),
            ...current.updates
          ]
        }));
      },
      updateTask(input) {
        setData((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === input.id
              ? {
                  ...task,
                  title: input.title,
                  summary: input.summary,
                  content: input.content,
                  tags: input.tags,
                  owner: input.owner,
                  dueDate: input.dueDate,
                  dueLabel: formatDateLabel(input.dueDate),
                  status: input.status
                }
              : task
          ),
          updates: [
            makeUpdate(
              "Organisation",
              `Modification : ${input.title}`,
              "La fiche organisation a ete mise a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deleteTask(id) {
        setData((current) => {
          const target = current.tasks.find((task) => task.id === id);

          return {
            ...current,
            tasks: current.tasks.filter((task) => task.id !== id),
            updates: target
              ? [
                  makeUpdate(
                    "Organisation",
                    `Suppression : ${target.title}`,
                    "La fiche organisation a ete supprimee."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      },
      createDeadline(input) {
        const deadline: Deadline = {
          id: `deadline-${crypto.randomUUID()}`,
          title: input.title,
          dateISO: input.dateISO,
          dateLabel: formatDateLabel(input.dateISO, "Date a fixer"),
          lane: input.lane,
          status: input.status
        };

        setData((current) => ({
          ...current,
          deadlines: [deadline, ...current.deadlines],
          updates: [
            makeUpdate(
              "Planning",
              `Nouvelle deadline : ${input.title}`,
              `L'echeance a ete posee dans ${input.lane}.`
            ),
            ...current.updates
          ]
        }));
      },
      createMeeting(input) {
        const meeting: Meeting = {
          id: `meeting-${crypto.randomUUID()}`,
          categorySlug: input.categorySlug,
          title: input.title,
          dateISO: input.dateISO,
          timeLabel: input.timeLabel,
          dateLabel: formatDateTimeLabel(input.dateISO, input.timeLabel, "Date a fixer"),
          focus: input.focus,
          notes: input.focus,
          tags: ["brouillon"],
          agenda: input.agendaText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
        };

        setData((current) => ({
          ...current,
          meetings: [meeting, ...current.meetings],
          updates: [
            makeUpdate(
              "Reunion orga",
              `Nouvelle reunion : ${input.title}`,
              "Une nouvelle seance a ete programmee avec son ordre du jour."
            ),
            ...current.updates
          ]
        }));
      },
      updateMeeting(input) {
        setData((current) => ({
          ...current,
          meetings: current.meetings.map((meeting) =>
            meeting.id === input.id
              ? {
                  ...meeting,
                  title: input.title,
                  dateISO: input.dateISO,
                  timeLabel: input.timeLabel,
                  dateLabel: formatDateTimeLabel(input.dateISO, input.timeLabel, "Date a fixer"),
                  focus: input.focus,
                  notes: input.notes,
                  tags: input.tags,
                  agenda: input.agendaText
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                }
              : meeting
          ),
          updates: [
            makeUpdate(
              "Reunion orga",
              `Modification : ${input.title}`,
              "La fiche reunion a ete mise a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deleteMeeting(id) {
        setData((current) => {
          const target = current.meetings.find((meeting) => meeting.id === id);

          return {
            ...current,
            meetings: current.meetings.filter((meeting) => meeting.id !== id),
            updates: target
              ? [
                  makeUpdate(
                    "Reunion orga",
                    `Suppression : ${target.title}`,
                    "La fiche reunion a ete supprimee."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      },
      createTimelineDay(input) {
        setData((current) => {
          const nextOrder =
            current.timelineDays.length > 0
              ? Math.max(...current.timelineDays.map((day) => day.order)) + 1
              : 1;
          const day: TimelineDay = {
            id: `timeline-day-${crypto.randomUUID()}`,
            label: input.label,
            dateISO: input.dateISO,
            order: nextOrder
          };

          return {
            ...current,
            timelineDays: [...current.timelineDays, day].sort((left, right) => left.order - right.order),
            updates: [
              makeUpdate(
                "Timeline",
                `Nouveau jour : ${input.label}`,
                "Une nouvelle journee de timeline a ete ajoutee."
              ),
              ...current.updates
            ]
          };
        });
      },
      updateTimelineDay(input) {
        setData((current) => ({
          ...current,
          timelineDays: current.timelineDays
            .map((day) =>
              day.id === input.id
                ? {
                    ...day,
                    label: input.label,
                    dateISO: input.dateISO
                  }
                : day
            )
            .sort((left, right) => left.order - right.order),
          updates: [
            makeUpdate(
              "Timeline",
              `Modification : ${input.label}`,
              "La journee de timeline a ete mise a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deleteTimelineDay(id) {
        setData((current) => {
          const target = current.timelineDays.find((day) => day.id === id);
          const removedEntryIds = current.timelineEntries
            .filter((entry) => entry.dayId === id)
            .map((entry) => entry.id);

          return {
            ...current,
            timelineDays: current.timelineDays.filter((day) => day.id !== id),
            timelineEntries: current.timelineEntries.filter((entry) => entry.dayId !== id),
            storyboardScenes: current.storyboardScenes.map((scene) =>
              scene.dayId === id || (scene.timelineEntryId && removedEntryIds.includes(scene.timelineEntryId))
                ? {
                    ...scene,
                    dayId: undefined,
                    timelineEntryId: undefined
                  }
                : scene
            ),
            updates: target
              ? [
                  makeUpdate(
                    "Timeline",
                    `Suppression : ${target.label}`,
                    "La journee de timeline et ses evenements ont ete supprimes."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      },
      createTimelineEntry(input) {
        const entry: TimelineEntry = {
          id: `timeline-entry-${crypto.randomUUID()}`,
          dayId: input.dayId,
          title: input.title,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          summary: input.summary,
          tags: input.tags
        };

        setData((current) => ({
          ...current,
          timelineEntries: [...current.timelineEntries, entry],
          updates: [
            makeUpdate(
              "Timeline",
              `Nouvel evenement : ${input.title}`,
              "Un nouveau bloc horaire a ete ajoute dans la timeline."
            ),
            ...current.updates
          ]
        }));
      },
      updateTimelineEntry(input) {
        setData((current) => ({
          ...current,
          timelineEntries: current.timelineEntries.map((entry) =>
            entry.id === input.id
              ? {
                  ...entry,
                  dayId: input.dayId,
                  title: input.title,
                  startTime: input.startTime,
                  endTime: input.endTime,
                  location: input.location,
                  summary: input.summary,
                  tags: input.tags
                }
              : entry
          ),
          updates: [
            makeUpdate(
              "Timeline",
              `Modification : ${input.title}`,
              "L'evenement de timeline a ete mis a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deleteTimelineEntry(id) {
        setData((current) => {
          const target = current.timelineEntries.find((entry) => entry.id === id);

          return {
            ...current,
            timelineEntries: current.timelineEntries.filter((entry) => entry.id !== id),
            storyboardScenes: current.storyboardScenes.map((scene) =>
              scene.timelineEntryId === id
                ? {
                    ...scene,
                    timelineEntryId: undefined,
                    dayId: undefined
                  }
                : scene
            ),
            updates: target
              ? [
                  makeUpdate(
                    "Timeline",
                    `Suppression : ${target.title}`,
                    "L'evenement de timeline a ete supprime."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      },
      createStoryboardScene(input) {
        const sceneId = `story-scene-${crypto.randomUUID()}`;
        const timelineEntryId = input.dayId ? `timeline-entry-${crypto.randomUUID()}` : undefined;
        const timelineTags = Array.from(new Set(["storyboard", ...input.tags]));
        const scene: StoryboardScene = {
          id: sceneId,
          title: input.title,
          dayId: input.dayId,
          timelineEntryId,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          status: "A cadrer",
          summary: input.summary,
          tags: input.tags,
          cards: makeStoryboardCards(input.cardCount)
        };

        setData((current) => ({
          ...current,
          storyboardScenes: [scene, ...current.storyboardScenes],
          timelineEntries: timelineEntryId
            ? [
                {
                  id: timelineEntryId,
                  dayId: input.dayId!,
                  title: input.title,
                  startTime: input.startTime,
                  endTime: input.endTime,
                  location: input.location,
                  summary: input.summary,
                  tags: timelineTags,
                  storyboardSceneId: sceneId
                },
                ...current.timelineEntries
              ]
            : current.timelineEntries,
          updates: [
            makeUpdate(
              "Storyboard",
              `Nouvelle scene : ${input.title}`,
              timelineEntryId
                ? "La scene a ete ajoutee et posee dans la timeline."
                : "La scene de pilotage a ete ajoutee."
            ),
            ...current.updates
          ]
        }));
      },
      updateStoryboardScene(input) {
        setData((current) => {
          const existingScene = current.storyboardScenes.find((scene) => scene.id === input.id);
          const existingEntry = current.timelineEntries.find(
            (entry) =>
              entry.id === existingScene?.timelineEntryId || entry.storyboardSceneId === input.id
          );
          const timelineTags = Array.from(new Set(["storyboard", ...input.tags]));

          let timelineEntryId = existingScene?.timelineEntryId ?? existingEntry?.id;
          let nextTimelineEntries = current.timelineEntries;

          if (input.dayId) {
            if (existingEntry) {
              nextTimelineEntries = current.timelineEntries.map((entry) =>
                entry.id === existingEntry.id
                  ? {
                      ...entry,
                      dayId: input.dayId!,
                      title: input.title,
                      startTime: input.startTime,
                      endTime: input.endTime,
                      location: input.location,
                      summary: input.summary,
                      tags: timelineTags,
                      storyboardSceneId: input.id
                    }
                  : entry
              );
              timelineEntryId = existingEntry.id;
            } else {
              timelineEntryId = `timeline-entry-${crypto.randomUUID()}`;
              nextTimelineEntries = [
                {
                  id: timelineEntryId,
                  dayId: input.dayId,
                  title: input.title,
                  startTime: input.startTime,
                  endTime: input.endTime,
                  location: input.location,
                  summary: input.summary,
                  tags: timelineTags,
                  storyboardSceneId: input.id
                },
                ...current.timelineEntries
              ];
            }
          } else if (existingEntry) {
            nextTimelineEntries = current.timelineEntries.filter(
              (entry) => entry.id !== existingEntry.id
            );
            timelineEntryId = undefined;
          }

          return {
            ...current,
            timelineEntries: nextTimelineEntries,
            storyboardScenes: current.storyboardScenes.map((scene) =>
              scene.id === input.id
                ? {
                    ...scene,
                    title: input.title,
                    dayId: input.dayId,
                    timelineEntryId,
                    startTime: input.startTime,
                    endTime: input.endTime,
                    location: input.location,
                    status: input.status,
                    summary: input.summary,
                    tags: input.tags,
                    cards: input.cards
                  }
                : scene
            ),
            updates: [
              makeUpdate(
                "Storyboard",
                `Modification : ${input.title}`,
                timelineEntryId
                  ? "La scene storyboard et son bloc timeline ont ete mis a jour."
                  : "La scene storyboard a ete mise a jour."
              ),
              ...current.updates
            ]
          };
        });
      },
      deleteStoryboardScene(id) {
        setData((current) => {
          const target = current.storyboardScenes.find((scene) => scene.id === id);
          const linkedEntryId =
            target?.timelineEntryId ??
            current.timelineEntries.find((entry) => entry.storyboardSceneId === id)?.id;

          return {
            ...current,
            storyboardScenes: current.storyboardScenes.filter((scene) => scene.id !== id),
            timelineEntries: linkedEntryId
              ? current.timelineEntries.filter((entry) => entry.id !== linkedEntryId)
              : current.timelineEntries,
            updates: target
              ? [
                  makeUpdate(
                    "Storyboard",
                    `Suppression : ${target.title}`,
                    linkedEntryId
                      ? "La scene storyboard et son bloc timeline ont ete supprimes."
                      : "La scene storyboard a ete supprimee."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      },
      createKraftItem(input) {
        const item: KraftItem = {
          id: `kraft-${crypto.randomUUID()}`,
          title: input.title,
          summary: input.summary,
          tags: input.tags,
          owner: input.owner,
          status: input.status
        };

        setData((current) => ({
          ...current,
          kraftItems: [item, ...current.kraftItems],
          updates: [
            makeUpdate(
              "Kraft",
              `Nouveau kraft : ${input.title}`,
              "Un nouvel element de fabrication a ete ajoute au suivi."
            ),
            ...current.updates
          ]
        }));
      },
      updateKraftItem(input) {
        setData((current) => ({
          ...current,
          kraftItems: current.kraftItems.map((item) =>
            item.id === input.id
              ? {
                  ...item,
                  title: input.title,
                  summary: input.summary,
                  tags: input.tags,
                  owner: input.owner,
                  status: input.status
                }
              : item
          ),
          updates: [
            makeUpdate(
              "Kraft",
              `Modification : ${input.title}`,
              "Le suivi du kraft a ete mis a jour."
            ),
            ...current.updates
          ]
        }));
      },
      deleteKraftItem(id) {
        setData((current) => {
          const target = current.kraftItems.find((item) => item.id === id);

          return {
            ...current,
            kraftItems: current.kraftItems.filter((item) => item.id !== id),
            updates: target
              ? [
                  makeUpdate(
                    "Kraft",
                    `Suppression : ${target.title}`,
                    "Le kraft a ete retire du suivi."
                  ),
                  ...current.updates
                ]
              : current.updates
          };
        });
      }
    }),
    [
      authSession,
      authUser,
      currentGame,
      data,
      games,
      isSuperAdmin,
      isAuthConfigured,
      isAuthLoading,
      isReady
      ,
      workspaceAccess
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
}
