# Atelier orga GN - base multi-GN

Cette base pose une application web pour creer et piloter plusieurs GN, chacun avec son espace de travail separe.

## Ce qui est deja present

- une structure `Next.js + TypeScript`
- un tableau de bord general
- un espace `Documents` type wiki interne
- des fiches `Personnages`
- des fiches `Intrigues`
- une vue `Organisation`
- une vue `Reunion orga`
- une page d'accueil multi-GN
- une base SQLite serveur
- un mode Supabase via Postgres REST
- des mots de passe d'acces hashés
- une session par cookie HTTP-only

## Lancer le projet

1. installer Node.js 20 ou plus
2. installer les dependances :

```bash
npm install
```

3. demarrer le serveur de dev :

```bash
npm run dev
```

4. ouvrir [http://localhost:3000](http://localhost:3000)

## Structure utile

- `app/` : pages principales de l'application
- `app/api/` : routes serveur pour les GN, la session et le workspace
- `components/` : briques UI partagees
- `lib/data.ts` : structure et seeds d'exemple
- `lib/server/` : base SQLite, auth et logique de workspace
- `lib/types.ts` : types de base

## Fonctionnement actuel

- sans configuration Supabase, la liste des GN et leur contenu sont stockes dans `.data/hfgn.sqlite`
- si `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SECRET_KEY` sont definies, l'application bascule sur Supabase
- chaque GN possede son propre mot de passe d'acces
- l'ouverture d'un GN cree une session serveur via cookie HTTP-only
- les donnees de travail sont sauvegardees cote serveur a chaque modification
- la creation d'un nouveau GN est protegee par un mot de passe d'invitation

## Variables utiles avant mise en ligne

- `GN_INVITE_PASSWORD` : mot de passe d'invitation pour creer un nouveau GN
- `GN_ADMIN_PASSWORD` : mot de passe reserve a l'administration des GN
- `NEXT_PUBLIC_SUPABASE_URL` : URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : cle publique pour la future authentification utilisateur
- `SUPABASE_SECRET_KEY` : cle serveur Supabase recommandee pour cette application
- `SUPABASE_SERVICE_ROLE_KEY` : alternative legacy si tu utilises encore l'ancienne cle service role

Sans variable d'environnement, l'application utilise :

- `HistoriaFantasiaGN` pour l'invitation
- `-00000080153612` pour l'administration

Pour une vraie mise en ligne, il faut remplacer les deux.

Tu peux partir de `.env.example` pour creer ton propre `.env.local` en developpement, puis reporter ces variables sur ton hebergeur en production.

## Mise en place Supabase

1. creer un projet Supabase
2. ouvrir l'editeur SQL
3. executer le schema dans `supabase/schema.sql`
4. renseigner `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SECRET_KEY`
5. si tu veux reprendre les donnees SQLite existantes, lancer `npm run supabase:migrate`
6. relancer l'application

Tant que les variables Supabase ne sont pas definies, l'application continue d'utiliser SQLite localement.

## Mise en ligne la plus rapide

1. finir la configuration Supabase ci-dessus
2. pousser le projet sur GitHub
3. importer le depot dans Vercel
4. ajouter dans Vercel :
   `GN_INVITE_PASSWORD`
   `GN_ADMIN_PASSWORD`
   `NEXT_PUBLIC_SUPABASE_URL`
   `SUPABASE_SECRET_KEY`
5. deployer

Avec cette configuration, Vercel heberge l'application Next.js et Supabase remplace completement SQLite en production.

## Fondations v1.0

Le schema Supabase prepare maintenant la suite pour une authentification reelle :

- `profiles` : profil utilisateur lie a `auth.users`
- `game_memberships` : role par GN (`admin`, `orga`, `lecture`)

Le modele cible est bien un role **par GN** :

- un utilisateur peut etre `admin` sur son propre GN
- `orga` sur un autre
- `lecture` sur un troisieme

La creation d'un GN devra ensuite attribuer automatiquement le role `admin` au createur.

## Etapes suivantes conseillees

1. ajouter une gestion fine des membres orga par GN
2. permettre le changement du mot de passe d'acces d'un GN
3. ajouter suppression / archivage d'un GN depuis l'accueil
4. integrer un editeur riche type Tiptap pour les documents
5. ajouter historique, recherche globale et liens entre modules
