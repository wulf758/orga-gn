# Atelier Orga GN

Application web Next.js pour preparer et piloter plusieurs GN avec un espace de travail par jeu :
- documents / wiki interne
- personnages
- intrigues
- organisation
- reunions
- timeline
- storyboard
- kraft

Le projet tourne aujourd'hui en mode `Vercel + Supabase` et utilise une authentification par comptes orga avec roles par GN.

## Resume express

Si on reprend le projet apres quelques semaines, le plus important a retenir est :
- la home publique sert a la fois de page d'acces et de page minimale indexable
- l'acces au contenu se fait uniquement via compte Supabase + membership
- un GN a ses propres membres et ses propres roles
- la gestion d'un GN se fait depuis la page `Gestion`, pas depuis l'interface interne du GN
- la source de verite de la base est [supabase/schema.sql](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/supabase/schema.sql)

## Etat actuel du projet

Le produit est deja exploitable pour une petite equipe orga :
- comptes utilisateurs Supabase
- appartenance a un ou plusieurs GN
- roles par GN : `admin`, `orga`, `lecture`
- page d'accueil multi-GN
- page dediee de gestion d'un GN
- gestion des membres depuis l'interface
- masquer les informations joueur pour les comptes `lecture`
- tags partages entre modules avec recherche par tag
- export PDF compose depuis l'interface
- SEO minimal en place sur la home publique

## Stack

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Vitest`
- `Supabase`
- `Vercel`

## Fonctionnement produit actuel

### Comptes et roles

- un utilisateur doit se connecter avec son compte orga
- un utilisateur peut appartenir a plusieurs GN
- un role est defini **par GN**
- un utilisateur peut donc etre :
  - `admin` sur un GN
  - `orga` sur un autre
  - `lecture` sur un troisieme

### Creation et ouverture d'un GN

- la creation d'un GN se fait depuis un compte connecte
- le createur devient automatiquement `admin` de ce GN
- il n'y a plus de mot de passe d'invitation
- il n'y a plus de mot de passe d'acces partage pour ouvrir un GN
- un GN s'ouvre uniquement si le compte connecte y a acces via `game_memberships`

### Gestion d'un GN

La gestion d'un GN se fait depuis la page dediee :
- renommage
- gestion des membres
- archivage

La gestion n'est visible que pour les `admin` du GN.

### Super-admin

Le super-admin ne repose plus sur un nom affiche.

Il est determine uniquement via :
- `SUPER_ADMIN_EMAILS`
- ou mieux `SUPER_ADMIN_USER_IDS`

Le super-admin sert uniquement aux operations de secours :
- voir les GN archives
- restaurer un GN archive
- supprimer definitivement un GN archive
- supprimer un compte orga

## Structure utile

- [app](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/app) : pages App Router
- [app/api](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/app/api) : routes serveur
- [components](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/components) : UI partagee
- [lib/server](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/lib/server) : auth, DB, logique serveur
- [lib/types.ts](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/lib/types.ts) : types de base
- [supabase/schema.sql](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/supabase/schema.sql) : schema source de verite
- [tests](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/tests) : couverture Vitest

### Fichiers clefs pour repartir vite

- [app/page.tsx](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/app/page.tsx) : accueil, auth, selection et creation des GN
- [app/games/[id]/manage/page.tsx](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/app/games/%5Bid%5D/manage/page.tsx) : gestion du GN, membres et archivage
- [components/app-data-provider.tsx](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/components/app-data-provider.tsx) : etat client principal et appels API
- [lib/server/workspace.ts](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/lib/server/workspace.ts) : logique d'acces aux GN, roles, sessions et securite
- [lib/server/supabase-auth.ts](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/lib/server/supabase-auth.ts) : auth Supabase et verification du super-admin
- [components/rich-text-preview.tsx](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/components/rich-text-preview.tsx) : rendu texte riche, liens et images distantes

## Base de donnees

### Tables principales

- `workspaces`
- `profiles`
- `game_memberships`
- `sessions`
- `admin_sessions`

### RLS

Le RLS est active sur les tables publiques importantes.

Policies volontairement strictes :
- `workspaces` : lecture reservee aux membres du GN
- `profiles` : un utilisateur lit/modifie son propre profil
- `game_memberships` : un utilisateur lit ses propres memberships
- `sessions` et `admin_sessions` : RLS active sans policy publique, donc deny-all cote client

## Variables d'environnement

Voir aussi [.env.example](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/.env.example).

Variables importantes :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPER_ADMIN_EMAILS`
- `SUPER_ADMIN_USER_IDS`
- `NEXT_PUBLIC_SITE_URL`

Exemple de prod Vercel :

```env
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
SUPER_ADMIN_EMAILS=ton-email@example.com
NEXT_PUBLIC_SITE_URL=https://orga-gn.vercel.app
```

## Installation locale

1. installer Node.js 20+
2. installer les dependances

```bash
npm install
```

3. creer un `.env.local` a partir de [.env.example](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/.env.example)
4. lancer le projet

```bash
npm run dev
```

5. ouvrir [http://localhost:3000](http://localhost:3000)

## Commandes utiles

```bash
npm run dev
npm run build
npm test
npm run supabase:migrate
```

## Mise en place Supabase

1. creer un projet Supabase
2. executer [supabase/schema.sql](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/supabase/schema.sql)
3. configurer :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY`
4. optionnel : migrer les anciennes donnees SQLite

```bash
npm run supabase:migrate
```

## Mise en ligne rapide

1. pousser le depot sur GitHub
2. importer le projet dans Vercel
3. ajouter les variables d'environnement Vercel
4. deployer

Le site public actuel attendu :
- [https://orga-gn.vercel.app](https://orga-gn.vercel.app)

## Reprendre le projet en 10 minutes

1. verifier les variables d'environnement locales ou Vercel
2. verifier que le super-admin est encore bien configure
3. relire [supabase/schema.sql](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/supabase/schema.sql) si on touche a la base
4. lancer `npm run dev`
5. lancer `npm test`
6. si un doute persiste, verifier l'accueil, la page `Gestion` d'un GN et les roles

## SEO minimal deja en place

Le site garde une home de connexion, mais dispose d'un socle minimum pour ne pas etre introuvable :
- metadata enrichies dans [app/layout.tsx](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/app/layout.tsx)
- [app/robots.ts](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/app/robots.ts)
- [app/sitemap.ts](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/app/sitemap.ts)

Le referencement vise surtout la page d'accueil publique, pas les pages privees de l'application.

## Rendu riche actuel

Le composant [components/rich-text-preview.tsx](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/components/rich-text-preview.tsx) gere aujourd'hui :
- gras / italique / soulignement simples
- liens HTTP/HTTPS cliquables
- affichage auto d'une image distante si un paragraphe contient directement une URL d'image

Cela s'applique deja aux vues de lecture de :
- documents
- personnages
- intrigues
- reunions
- taches d'organisation

## Tests

La suite `Vitest` couvre deja une partie importante du coeur metier :
- parsing/serialisation des documents
- registre de tags
- mutations de tags
- mutations de sections de tags
- exports personnages
- warnings timeline/storyboard

Lancer :

```bash
npm test
```

## Notes de reprise utiles

Si tu reprends le projet plus tard, verifie d'abord :

1. que les variables Vercel sont toujours en place
2. que `SUPER_ADMIN_EMAILS` ou `SUPER_ADMIN_USER_IDS` est bien configure
3. que [supabase/schema.sql](/C:/Users/cyril/Desktop/jeux%20de%20role/Le%20songe%20du%20Lion%20GN/appli%20gn/supabase/schema.sql) correspond a la base
4. que les comptes tests apparaissent bien dans `profiles`
5. que les memberships du GN cible existent dans `game_memberships`
6. que les pages `Gestion` des GN affichent bien les membres et les actions admin

## Limites connues

- `npm run build` peut parfois echouer localement sous Windows avec un `spawn EPERM`, alors que :
  - `npm exec tsc -- --noEmit`
  - `npm test`
  - et le build Vercel
  restent valides
- la protection Supabase contre les mots de passe compromises n'est pas forcement disponible sur plan gratuit
- il n'y a pas encore d'historique complet ni de corbeille fine
- l'editeur reste volontairement simple

## Priorites probables pour la suite

- nouvelle passe UX/mobile/tablette
- meilleurs apercus / preview live dans les editeurs
- liens plus riches entre modules
- sauvegarde/export externe leger
- raffinement des policies et de la gestion admin si l'outil s'ouvre a plus de monde
