import {
  AppData,
  Character,
  Deadline,
  DocumentPage,
  KraftItem,
  Meeting,
  NavItem,
  Plot,
  StoryboardScene,
  Task,
  TimelineDay,
  TimelineEntry,
  UpdateEntry,
  WorkspaceCategory
} from "@/lib/types";
import { DEFAULT_TAG_DEFINITIONS, DEFAULT_TAG_SECTIONS } from "@/lib/tags";

export const gameName = "Le Songe du Lion";

export const navigation: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    description: "Vision generale du GN, taches et points chauds"
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Wiki, notes et pages de travail reliees"
  },
  {
    href: "/characters",
    label: "Personnages",
    description: "PJ, PNJ, factions, objectifs et secrets"
  },
  {
    href: "/plots",
    label: "Intrigues",
    description: "Arcs, scenes, dependances et liens"
  },
  {
    href: "/organization",
    label: "Organisation",
    description: "Checklist, pilotage et logistique de base"
  },
  {
    href: "/meetings",
    label: "Reunion orga",
    description: "Ordres du jour, points a trancher et suivi des reunions"
  },
  {
    href: "/timeline",
    label: "Timeline",
    description: "Deroule du GN au quart d'heure et coordination terrain"
  },
  {
    href: "/storyboard",
    label: "Storyboard",
    description: "Scenes, actions PNJ et besoins concrets pour faire avancer le jeu"
  },
  {
    href: "/kraft",
    label: "Kraft",
    description: "Suivi des fabrications, pieces en cours et elements termines"
  },
  {
    href: "/tags",
    label: "Tags",
    description: "Lexique commun, couleurs et priorites transversales"
  },
    {
      href: "/export",
      label: "Export",
      description: "Selection PDF des sections du GN et impression"
    },
    {
      href: "/members",
      label: "Membres",
      description: "Acces, roles et repartition de l'equipe orga"
    }
  ];

export const documents: DocumentPage[] = [
  {
    slug: "cadrage",
    kind: "folder",
    title: "Cadrage",
    icon: "C",
    summary: "Dossier des intentions, des principes de jeu et des choix fondateurs.",
    category: "Racine",
    updatedAt: "Aujourd'hui, 09:30",
    tags: ["socle", "dossier"],
    content: []
  },
  {
    slug: "univers",
    kind: "folder",
    title: "Univers",
    icon: "U",
    summary: "Dossier du lore, des lieux, des factions et de l'histoire du monde.",
    category: "Racine",
    updatedAt: "Aujourd'hui, 11:10",
    tags: ["univers", "dossier"],
    content: []
  },
  {
    slug: "chronologie",
    kind: "folder",
    title: "Chronologie",
    icon: "T",
    summary: "Dossier des reperes historiques et du calendrier fiction.",
    category: "Racine",
    updatedAt: "Lundi, 18:45",
    tags: ["chronologie", "dossier"],
    content: []
  },
  {
    slug: "vision-du-gn",
    kind: "note",
    title: "Vision du GN",
    icon: "S",
    summary: "Note cadre pour garder la ligne directrice, le ton et les partis pris du jeu.",
    category: "Cadrage",
    parentSlug: "cadrage",
    updatedAt: "Aujourd'hui, 09:30",
    tags: ["socle", "direction"],
    content: [
      {
        heading: "Intentions",
        paragraphs: [
          "Le Songe du Lion est pense comme un GN de tension feutree, ou le politique, le rituel et la memoire ont autant de poids que l'action.",
          "Cette page sert de reference haute pour arbitrer toutes les futures decisions d'ecriture et de logistique."
        ],
        bullets: [
          "Jeu de cour, dettes anciennes et alliances fragiles",
          "Peu de factions, mais des liens denses",
          "Les revelations doivent naitre des relations, pas de la simple exposition"
        ]
      },
      {
        heading: "Promesse orga",
        paragraphs: [
          "Chaque module de l'application doit aider les orgas a conserver cette coherence : les fiches, intrigues et taches doivent toujours pouvoir se rattacher a l'intention initiale."
        ]
      }
    ]
  },
  {
    slug: "alimar",
    kind: "folder",
    title: "Alimar",
    icon: "A",
    summary: "Dossier principal de la cite d'Alimar et de ses ramifications.",
    category: "Univers",
    parentSlug: "univers",
    updatedAt: "Aujourd'hui, 11:10",
    tags: ["lieu", "dossier"],
    content: []
  },
  {
    slug: "alimar-geographie",
    kind: "note",
    title: "Geographie d'Alimar",
    icon: "G",
    summary: "Quartiers, frontieres, zones de pouvoir et ambiance de la ville.",
    category: "Univers",
    parentSlug: "alimar",
    updatedAt: "Aujourd'hui, 11:25",
    tags: ["lieu", "geographie"],
    content: [
      {
        heading: "Repere rapide",
        paragraphs: [
          "La ville est construite en terrasses, avec une separation tres nette entre la hauteur ceremonielle et les basses halles marchandes."
        ]
      }
    ]
  },
  {
    slug: "alimar-histoire",
    kind: "note",
    title: "Histoire d'Alimar",
    icon: "H",
    summary: "Evenements fondateurs, sieges, ruptures et mythes politiques.",
    category: "Univers",
    parentSlug: "alimar",
    updatedAt: "Aujourd'hui, 11:40",
    tags: ["lieu", "histoire"],
    content: [
      {
        heading: "Trame historique",
        paragraphs: [
          "L'histoire officielle ne mentionne pas certains compromis passes entre la Maison du Lion et les marchands de la basse ville."
        ]
      }
    ]
  },
  {
    slug: "alimar-pnj-importants",
    kind: "note",
    title: "PNJ importants d'Alimar",
    icon: "P",
    summary: "Figures d'autorite, relais logistiques et personnalites a forte presence.",
    category: "Univers",
    parentSlug: "alimar",
    updatedAt: "Aujourd'hui, 12:05",
    tags: ["lieu", "pnj"],
    content: [
      {
        heading: "Figures a maintenir visibles",
        paragraphs: [
          "Cette page sert de passerelle entre le dossier d'univers et les fiches PNJ qui comptent pour la ville."
        ]
      }
    ]
  },
  {
    slug: "factions",
    kind: "note",
    title: "Factions",
    icon: "F",
    summary: "Vue d'ensemble des maisons, allegiances et lignes de fracture.",
    category: "Univers",
    parentSlug: "univers",
    updatedAt: "Hier, 21:10",
    tags: ["univers", "politique"],
    content: [
      {
        heading: "Maisons majeures",
        paragraphs: [
          "Le jeu tourne actuellement autour de trois poles : la Maison du Lion, les Veilleurs de Cendre et la Ligue des Marchands."
        ],
        bullets: [
          "Maison du Lion : legitimite, heritiers, poids du sang",
          "Veilleurs de Cendre : secret, rites, protection des archives",
          "Ligue des Marchands : dette, ravitaillement, influence discrete"
        ]
      }
    ]
  },
  {
    slug: "calendrier-fiction",
    kind: "note",
    title: "Calendrier fiction",
    icon: "C",
    summary: "Repere des evenements historiques utiles a l'ecriture.",
    category: "Chronologie",
    parentSlug: "chronologie",
    updatedAt: "Lundi, 18:45",
    tags: ["chronologie"],
    content: [
      {
        heading: "Points d'appui",
        paragraphs: [
          "Cette page pose la chronologie commune. Elle permet de dater les dettes, les trahisons et les serments qui nourrissent les intrigues."
        ],
        bullets: [
          "Annee -12 : incendie des reserves royales",
          "Annee -7 : disparition de la princesse-custode",
          "Annee -1 : treve imposee entre les maisons"
        ]
      }
    ]
  }
];

export const characters: Character[] = [
  {
    id: "alim",
    name: "Alim de Vermeille",
    role: "PJ",
    tags: ["faction"],
    playerNotes: "Joueur sensible aux scenes d'etouffement. Prevoir un point de sortie clair en cas de surcharge.",
    background:
      "Heritier brillant mais use, Alim porte a la fois l'attente dynastique de la Maison du Lion et le poids d'anciens serments qu'il ne peut plus ignorer.",
    objectives: [
      "Obtenir l'appui discret de la Ligue",
      "Identifier qui manipule les registres de la succession",
      "Garder sa soeur hors de la tourmente"
    ],
    secrets: [
      "A signe un pacte de protection avec les Veilleurs il y a cinq ans",
      "Connait le nom de la personne responsable de l'incendie"
    ]
  },
  {
    id: "mira",
    name: "Mira la Cendre",
    role: "PNJ",
    tags: ["faction", "secret"],
    playerNotes: "PNJ interprete par une orga mobile. Eviter les scenes avec fumee dense et garder une pause eau accessible.",
    background:
      "Gardienne des rites, Mira donne l'image d'une maitrise froide et impeccable. Sa parole pese lourd, mais elle dissimule plusieurs choix deja faits dans l'ombre.",
    objectives: [
      "Conserver l'unite des Veilleurs",
      "Tester la solidite morale d'Alim",
      "Eviter que les archives interdites ne circulent"
    ],
    secrets: [
      "A efface une preuve essentielle dans les archives",
      "Prepare une issue de crise en dehors de toute validation orga"
    ]
  },
  {
    id: "soren",
    name: "Soren Valcor",
    role: "PJ",
    tags: ["faction"],
    playerNotes: "Le joueur prefere eviter les confrontations physiques brusques et demande un rappel oral avant toute escalade.",
    background:
      "Negociant au calme redoutable, Soren voit dans l'etat actuel du royaume une occasion historique de transformer la dette en levier politique durable.",
    objectives: [
      "Faire voter un nouvel accord commercial",
      "Dissocier la Ligue du destin de la Maison du Lion",
      "Recuperer un document scelle"
    ],
    secrets: [
      "A finance une expedition clandestine vers les reserves brulees"
    ]
  }
];

export const plotCategories: WorkspaceCategory[] = [
  {
    slug: "politique",
    title: "Politique",
    summary: "Intrigues de cour, succession, alliances et jeux de pouvoir.",
    updatedAt: "Aujourd'hui, 10:20",
    tags: ["cour", "pouvoir"]
  },
  {
    slug: "mystere",
    title: "Mystere",
    summary: "Secrets, rites, archives et revelations progressives.",
    updatedAt: "Aujourd'hui, 10:20",
    tags: ["secret", "rituel"]
  },
  {
    slug: "logistique-de-jeu",
    title: "Logistique de jeu",
    summary: "Arcs qui soutiennent les besoins materiels et la circulation en jeu.",
    updatedAt: "Aujourd'hui, 10:20",
    tags: ["terrain", "ressources"]
  }
];

export const plots: Plot[] = [
  {
    id: "succession",
    title: "La succession vacillante",
    categorySlug: "politique",
    stage: "Solide",
    summary: "Le trone tient encore, mais plusieurs pieces administratives ont ete alterees et les alliances sont trop fragiles pour encaisser un scandale.",
    content:
      "Le coeur de cette intrigue repose sur la legitimite, les preuves administratives et les alliances qui tiennent encore le royaume debout.",
    tags: ["politique", "succession", "secret"],
    beats: [
      "Ouverture en conseil restreint",
      "Pression economique de la Ligue",
      "Revelation du registre modifie",
      "Choix d'une legitimite imparfaite"
    ],
    characters: ["alim", "soren"],
    linkedPages: ["vision-du-gn", "calendrier-fiction"]
  },
  {
    id: "archives-interdites",
    title: "Les archives interdites",
    categorySlug: "mystere",
    stage: "A consolider",
    summary: "Des fragments rituels menacent d'exposer un passe que les Veilleurs prefereraient garder enseveli.",
    content:
      "Cette intrigue doit monter lentement en pression, avec des revelations rituelles progressives et une vraie tension morale autour de ce qui doit rester enfoui.",
    tags: ["mystere", "rituel", "archives"],
    beats: [
      "Acces progressif a une salle fermee",
      "Fuite organisee d'un fragment d'archive",
      "Confrontation entre devoir et preservation"
    ],
    characters: ["alim", "mira"],
    linkedPages: ["factions", "calendrier-fiction"]
  },
  {
    id: "cendre-portuaire",
    title: "La cendre portuaire",
    categorySlug: "logistique-de-jeu",
    stage: "A lancer",
    summary: "Arc secondaire autour d'un convoi disparu, utile pour nourrir les alliances et les dependances materielles.",
    content:
      "Cet arc sert a creer des besoins concrets, des retards et des rapports de force autour des ressources.",
    tags: ["logistique", "ressources", "convoi"],
    beats: [
      "Annonce d'un retard de livraison",
      "Rumeur sur un sabotage",
      "Negociation d'un secours d'urgence"
    ],
    characters: ["soren"],
    linkedPages: ["alimar-geographie", "factions"]
  }
];

export const organizationCategories: WorkspaceCategory[] = [
  {
    slug: "scenario",
    title: "Scenario",
    summary: "Pilotage de l'ecriture, arbitrages et relectures.",
    updatedAt: "Aujourd'hui, 09:45",
    tags: ["ecriture", "relecture"]
  },
  {
    slug: "logistique",
    title: "Logistique",
    summary: "Materiel, accessoires, production et contraintes terrain.",
    updatedAt: "Aujourd'hui, 09:45",
    tags: ["materiel", "terrain"]
  },
  {
    slug: "reunions",
    title: "Reunions",
    summary: "Preparation des points d'equipe et suivi des arbitrages.",
    updatedAt: "Aujourd'hui, 09:45",
    tags: ["coordination", "orga"]
  }
];

export const tasks: Task[] = [
  {
    id: "task-1",
    title: "Verifier les objectifs d'Alim avec la ligne politique globale",
    categorySlug: "scenario",
    summary: "Aligner la fiche avec la ligne globale du GN.",
    content: "Comparer les objectifs d'Alim avec les arbitrages de la ligne politique et noter les contradictions eventuelles.",
    tags: ["prioritaire", "relecture"],
    owner: "Cyril",
    dueDate: "2026-04-03",
    dueLabel: "Cette semaine",
    status: "En cours"
  },
  {
    id: "task-2",
    title: "Decider si les archives interdites deviennent un arc majeur",
    categorySlug: "scenario",
    summary: "Arbitrer le poids reel de cet arc dans le jeu.",
    content: "Lister les impacts sur les PJ, les PNJ et le rythme global avant validation.",
    tags: ["arbitrage", "intrigue"],
    owner: "Equipe scenario",
    dueDate: "2026-04-06",
    dueLabel: "Reunion de dimanche",
    status: "Bloque"
  },
  {
    id: "task-3",
    title: "Lister les accessoires de ceremonie utiles au prologue",
    categorySlug: "logistique",
    summary: "Faire un premier inventaire materiel.",
    content: "Identifier ce qui existe deja, ce qu'il faut fabriquer et ce qu'il faut emprunter.",
    tags: ["materiel", "prologue"],
    owner: "Pole logistique",
    dueDate: "2026-04-10",
    dueLabel: "D'ici 10 jours",
    status: "Planifie"
  },
  {
    id: "task-4",
    title: "Preparer le compte-rendu de la reunion orga de dimanche",
    categorySlug: "reunions",
    summary: "Mettre en forme les decisions prises.",
    content: "Centraliser les arbitrages, responsables et prochaines echeances pour diffusion a l'equipe.",
    tags: ["compte-rendu", "orga"],
    owner: "Secretariat orga",
    dueDate: "2026-04-05",
    dueLabel: "Avant dimanche",
    status: "En cours"
  }
];

export const updates: UpdateEntry[] = [
  {
    id: "update-1",
    area: "Documents",
    title: "Le dossier Alimar a ete enrichi",
    detail: "Ajout des sous-notes geographie, histoire et PNJ importants.",
    when: "Aujourd'hui, 12:05"
  },
  {
    id: "update-2",
    area: "Intrigues",
    title: "L'arc Archives interdites a change de statut",
    detail: "L'intrigue passe en consolidation pour arbitrer son poids dans le GN.",
    when: "Aujourd'hui, 10:20"
  },
  {
    id: "update-3",
    area: "Organisation",
    title: "Nouvelle deadline de relecture scenario",
    detail: "Une echeance a ete posee avant la reunion orga du week-end.",
    when: "Hier, 19:10"
  }
];

export const deadlines: Deadline[] = [
  {
    id: "deadline-1",
    title: "Relecture du bloc politique",
    dateISO: "2026-04-03",
    dateLabel: "Jeu. 3 avril",
    lane: "Scenario",
    status: "Cette semaine"
  },
  {
    id: "deadline-2",
    title: "Validation des PNJ d'Alimar",
    dateISO: "2026-04-05",
    dateLabel: "Sam. 5 avril",
    lane: "Personnages",
    status: "A venir"
  },
  {
    id: "deadline-3",
    title: "Reunion orga de cadrage logistique",
    dateISO: "2026-04-06",
    dateLabel: "Dim. 6 avril",
    lane: "Reunions",
    status: "Urgent"
  }
];

export const meetingCategories: WorkspaceCategory[] = [
  {
    slug: "scenario",
    title: "Scenario",
    summary: "Reunions de cadrage narratif, relecture et arbitrages de jeu.",
    updatedAt: "Aujourd'hui, 08:50",
    tags: ["ecriture", "intrigues"]
  },
  {
    slug: "logistique",
    title: "Logistique",
    summary: "Reunions de materiel, costumes, lieux et production.",
    updatedAt: "Aujourd'hui, 08:50",
    tags: ["production", "terrain"]
  }
];

export const meetings: Meeting[] = [
  {
    id: "meeting-1",
    categorySlug: "scenario",
    title: "Reunion orga scenario",
    dateISO: "2026-04-06",
    timeLabel: "14:00",
    dateLabel: "Dimanche 6 avril - 14h00",
    focus: "Arbitrer les intrigues majeures et fixer les prochaines relectures.",
    notes: "Cette reunion doit produire des decisions claires sur la priorite des arcs et la repartition des relectures.",
    tags: ["scenario", "arbitrage", "relecture"],
    agenda: [
      "Valider le poids de l'arc Archives interdites",
      "Confirmer la structure du dossier Alimar",
      "Repartir les relectures PJ et PNJ"
    ]
  },
  {
    id: "meeting-2",
    categorySlug: "logistique",
    title: "Reunion logistique",
    dateISO: "2026-04-09",
    timeLabel: "20:30",
    dateLabel: "Mercredi 9 avril - 20h30",
    focus: "Lister les besoins materiels et les responsables.",
    notes: "La priorite est de transformer les besoins vagues en liste d'actions realistes avec responsables.",
    tags: ["logistique", "materiel", "production"],
    agenda: [
      "Prologue et accessoires ceremoniels",
      "Etat des lieux des costumes",
      "Priorites de production avant mai"
    ]
  }
];

export const timelineDays: TimelineDay[] = [
  {
    id: "timeline-day-1",
    label: "Jour 1",
    dateISO: "2026-06-19",
    order: 1
  },
  {
    id: "timeline-day-2",
    label: "Jour 2",
    dateISO: "2026-06-20",
    order: 2
  }
];

export const timelineEntries: TimelineEntry[] = [
  {
    id: "timeline-entry-1",
    dayId: "timeline-day-1",
    title: "Accueil joueurs et check-in",
    startTime: "17:00",
    endTime: "18:30",
    location: "Camp principal",
    summary: "Accueil, verification des costumes, distribution des informations et installation.",
    tags: ["accueil", "orga"]
  },
  {
    id: "timeline-entry-2",
    dayId: "timeline-day-1",
    title: "Ouverture officielle",
    startTime: "20:00",
    endTime: "20:30",
    location: "Place du Lion",
    summary: "Lancement du jeu, annonce du cadre et premiers mouvements de foule.",
    tags: ["temps-fort", "rituel"]
  },
  {
    id: "timeline-entry-3",
    dayId: "timeline-day-2",
    title: "Le conseil restreint",
    startTime: "10:15",
    endTime: "11:00",
    location: "Salle du conseil",
    summary: "Sequence politique cle pour les principaux decisionnaires.",
    tags: ["storyboard"],
    storyboardSceneId: "story-scene-2"
  },
  {
    id: "timeline-entry-4",
    dayId: "timeline-day-1",
    title: "Accueil sous tension",
    startTime: "18:45",
    endTime: "19:30",
    location: "Parvis du camp",
    summary: "Installer les rapports de force et faire sentir qu'un incident politique couve deja.",
    tags: ["storyboard"],
    storyboardSceneId: "story-scene-1"
  }
];

export const storyboardScenes: StoryboardScene[] = [
  {
    id: "story-scene-1",
    title: "Accueil sous tension",
    dayId: "timeline-day-1",
    timelineEntryId: "timeline-entry-4",
    startTime: "18:45",
    endTime: "19:30",
    location: "Parvis du camp",
    status: "En cours",
    summary: "Installer les rapports de force et faire sentir qu'un incident politique couve deja.",
    tags: [],
    cards: [
      {
        id: "story-scene-1-card-1",
        title: "Mise en place",
        content:
          "Les PJ arrivent, prennent leurs marques et sentent que plusieurs maisons se jaugent deja avant meme le lancement officiel."
      },
      {
        id: "story-scene-1-card-2",
        title: "Action PNJ",
        content:
          "Le ceremoniaire accueille les delegations. Un scribe PNJ laisse filtrer un doute sur la validite d'un document sans accuser personne frontalement."
      },
      {
        id: "story-scene-1-card-3",
        title: "Vigilance orga",
        content:
          "Prevoir le registre factice, un signal discret pour le scribe et une relance si aucun PJ ne s'empare de l'information."
      },
      {
        id: "story-scene-1-card-4",
        title: "Information cle",
        content:
          "Les PJ doivent sortir de cette scene avec l'idee qu'une enquete politique sur la succession est desormais possible."
      }
    ]
  },
  {
    id: "story-scene-2",
    title: "Le conseil restreint",
    dayId: "timeline-day-2",
    timelineEntryId: "timeline-entry-3",
    startTime: "10:15",
    endTime: "11:00",
    location: "Salle du conseil",
    status: "A cadrer",
    summary: "Faire basculer l'intrigue en donnant une piste solide aux PJ decisionnaires.",
    tags: [],
    cards: [
      {
        id: "story-scene-2-card-1",
        title: "Declencheur",
        content:
          "Une reunion de crise expose des incoherences dans plusieurs actes officiels. Les PNJ doivent pousser les PJ a prendre position sans leur donner une solution complete."
      },
      {
        id: "story-scene-2-card-2",
        title: "Action PNJ",
        content:
          "Le conseiller royal demande une decision rapide. Un loyaliste contredit publiquement une version officielle au pire moment."
      },
      {
        id: "story-scene-2-card-3",
        title: "Materiel",
        content:
          "Actes officiels annotables, scelles visibles et dossier de preuves incomplet doivent etre prets avant l'ouverture de la scene."
      },
      {
        id: "story-scene-2-card-4",
        title: "Sortie de scene",
        content:
          "Une decision PJ doit modifier la suite du GN ou, si personne ne tranche, provoquer un report tendu vers la scene suivante."
      }
    ]
  }
];

export const kraftItems: KraftItem[] = [
  {
    id: "kraft-1",
    title: "Registre de succession",
    summary: "Fabriquer le registre factice qui servira pendant les scenes politiques.",
    tags: ["logistique"],
    owner: "Pole accessoires",
    status: "A commencer"
  },
  {
    id: "kraft-2",
    title: "Sceaux de la Maison du Lion",
    summary: "Finaliser les finitions cire et verifier la tenue des sceaux en jeu.",
    tags: ["logistique"],
    owner: "Cyril",
    status: "A finir"
  },
  {
    id: "kraft-3",
    title: "Bannieres du prologue",
    summary: "Serie de bannieres deja pretes pour l'ouverture et les temps ceremoniels.",
    tags: ["logistique"],
    owner: "Pole decor",
    status: "Fini"
  }
];

export function getInitialAppData(): AppData {
  return {
    gameName,
    tagSections: structuredClone(DEFAULT_TAG_SECTIONS),
    tagsRegistry: structuredClone(DEFAULT_TAG_DEFINITIONS),
    documents: structuredClone(documents),
    characters: structuredClone(characters),
    plotCategories: structuredClone(plotCategories),
    plots: structuredClone(plots),
    organizationCategories: structuredClone(organizationCategories),
    tasks: structuredClone(tasks),
    updates: structuredClone(updates),
    deadlines: structuredClone(deadlines),
    meetingCategories: structuredClone(meetingCategories),
    meetings: structuredClone(meetings),
    timelineDays: structuredClone(timelineDays),
    timelineEntries: structuredClone(timelineEntries),
    storyboardScenes: structuredClone(storyboardScenes),
    kraftItems: structuredClone(kraftItems)
  };
}

export function getEmptyAppData(name = "Nouveau GN"): AppData {
  return {
    gameName: name,
    tagSections: structuredClone(DEFAULT_TAG_SECTIONS),
    tagsRegistry: structuredClone(DEFAULT_TAG_DEFINITIONS),
    documents: [],
    characters: [],
    plotCategories: [],
    plots: [],
    organizationCategories: [],
    tasks: [],
    updates: [],
    deadlines: [],
    meetingCategories: [],
    meetings: [],
    timelineDays: [],
    timelineEntries: [],
    storyboardScenes: [],
    kraftItems: []
  };
}

export function getDocument(slug: string) {
  return documents.find((doc) => doc.slug === slug);
}

export function getCharacter(id: string) {
  return characters.find((character) => character.id === id);
}

export function getPlot(id: string) {
  return plots.find((plot) => plot.id === id);
}
