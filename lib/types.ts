export type NavItem = {
  href: string;
  label: string;
  description: string;
};

export type TagDefinition = {
  id: string;
  label: string;
  section: string;
  sectionColor: string;
  color: string;
  description?: string;
};

export type TagSection = {
  id: string;
  label: string;
  color: string;
};

export type DocumentPage = {
  slug: string;
  kind: "folder" | "note";
  title: string;
  icon: string;
  summary: string;
  category: string;
  parentSlug?: string;
  updatedAt: string;
  tags: string[];
  content: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
};

export type Character = {
  id: string;
  name: string;
  role: "PJ" | "PNJ";
  tags: string[];
  playerNotes?: string;
  background: string;
  objectives: string[];
  secrets: string[];
  status?: "Pret" | "En ecriture" | "A valider";
  pitch?: string;
  goals?: string[];
  relatedPlots?: string[];
  linkedPages?: string[];
};

export type WorkspaceCategory = {
  slug: string;
  title: string;
  summary: string;
  updatedAt: string;
  tags: string[];
};

export type Plot = {
  id: string;
  title: string;
  categorySlug: string;
  stage: "Solide" | "A consolider" | "A lancer";
  summary: string;
  content: string;
  tags: string[];
  beats: string[];
  characters: string[];
  linkedPages: string[];
};

export type Task = {
  id: string;
  title: string;
  categorySlug: string;
  summary: string;
  content: string;
  tags: string[];
  owner: string;
  dueDate?: string;
  dueLabel: string;
  status: "En cours" | "Bloque" | "Planifie";
};

export type UpdateEntry = {
  id: string;
  area: string;
  title: string;
  detail: string;
  when: string;
};

export type Deadline = {
  id: string;
  title: string;
  dateISO?: string;
  dateLabel: string;
  lane: string;
  status: "A venir" | "Cette semaine" | "Urgent";
};

export type Meeting = {
  id: string;
  categorySlug: string;
  title: string;
  dateISO?: string;
  timeLabel?: string;
  dateLabel: string;
  focus: string;
  notes: string;
  tags: string[];
  agenda: string[];
};

export type TimelineDay = {
  id: string;
  label: string;
  dateISO: string;
  order: number;
};

export type TimelineEntry = {
  id: string;
  dayId: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  summary: string;
  tags: string[];
  storyboardSceneId?: string;
};

export type StoryboardCard = {
  id: string;
  title: string;
  content: string;
};

export type StoryboardScene = {
  id: string;
  title: string;
  dayId?: string;
  timelineEntryId?: string;
  startTime: string;
  endTime: string;
  location: string;
  status: "A cadrer" | "En cours" | "Pret";
  summary: string;
  tags: string[];
  cards: StoryboardCard[];
};

export type KraftItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  owner: string;
  status: "A commencer" | "A finir" | "Fini";
};

export type AppData = {
  gameName: string;
  tagSections: TagSection[];
  tagsRegistry: TagDefinition[];
  documents: DocumentPage[];
  characters: Character[];
  plotCategories: WorkspaceCategory[];
  plots: Plot[];
  organizationCategories: WorkspaceCategory[];
  tasks: Task[];
  updates: UpdateEntry[];
  deadlines: Deadline[];
  meetingCategories: WorkspaceCategory[];
  meetings: Meeting[];
  timelineDays: TimelineDay[];
  timelineEntries: TimelineEntry[];
  storyboardScenes: StoryboardScene[];
  kraftItems: KraftItem[];
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
  characterCount: number;
  plotCount: number;
  kraftCount: number;
  archived: boolean;
  archivedAt?: string | null;
};

export type MembershipRole = "admin" | "orga" | "lecture";

export type UserProfile = {
  id: string;
  displayName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GameMembership = {
  id: string;
  gameId: string;
  userId: string;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceAccessMode = "legacy-password" | "membership";
