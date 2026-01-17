# Scene - Gestionnaire de Performances

Application web monopage (SPA) pour gérer une liste de performances avec lecture audio intégrée.

## Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Démarrage rapide](#démarrage-rapide)
- [Scripts disponibles](#scripts-disponibles)
- [Architecture du projet](#architecture-du-projet)
- [API REST](#api-rest)
- [Fonctionnalités](#fonctionnalités)
- [Tests](#tests)
- [Développement](#développement)
- [Notes techniques](#notes-techniques)

## Prérequis

- **Node.js** version 18 ou supérieure
- **npm** (inclus avec Node.js)

## Installation

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd scene

# Installer les dépendances
npm install
```

## Démarrage rapide

```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur **http://localhost:3333**

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm install` | Installe toutes les dépendances |
| `npm run dev` | Lance le serveur en mode développement avec rechargement automatique |
| `npm start` | Lance le serveur en mode production |
| `npm test` | Exécute tous les tests avec couverture de code |

## Architecture du projet

```
scene/
├── server/                 # Backend Express.js
│   ├── index.js           # Point d'entrée du serveur
│   ├── routes/
│   │   ├── api.js         # Routes API REST
│   │   └── upload.js      # Configuration Multer pour uploads
│   └── utils/
│       ├── fileManager.js # Gestion des fichiers et dossiers
│       └── idGenerator.js # Génération d'identifiants uniques
│
├── public/                 # Frontend SPA (JavaScript vanilla)
│   ├── index.html         # Page HTML principale
│   ├── css/
│   │   ├── main.css       # Styles principaux
│   │   └── variables.css  # Variables CSS (thèmes clair/sombre)
│   ├── js/
│   │   ├── app.js         # Bootstrap de l'application
│   │   ├── api/
│   │   │   └── performanceApi.js  # Client API
│   │   ├── state/
│   │   │   └── store.js   # Gestion d'état (pattern Observer)
│   │   └── components/
│   │       ├── AudioPlayer.js      # Lecteur audio avec Web Audio API
│   │       ├── PerformanceCard.js  # Carte de performance
│   │       ├── PerformanceForm.js  # Formulaire création/édition
│   │       ├── PerformanceList.js  # Liste des performances
│   │       ├── DragDropManager.js  # Glisser-déposer HTML5
│   │       └── Modal.js            # Fenêtre modale de confirmation
│   └── assets/            # Images et ressources statiques
│
├── data/                   # Stockage des données
│   ├── performances.json  # Liste des performances (JSON)
│   └── {id}/              # Dossier par performance
│       └── music_file.ext # Fichier musical associé
│
└── __tests__/             # Tests unitaires et d'intégration
    ├── api.test.js        # Tests des endpoints API
    ├── audioPlayer.test.js # Tests du lecteur audio
    ├── fileManager.test.js # Tests gestion fichiers
    ├── idGenerator.test.js # Tests génération ID
    └── theme.test.js      # Tests du thème
```

## API REST

### Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/performances` | GET | Récupérer toutes les performances |
| `/api/performances` | POST | Créer une nouvelle performance |
| `/api/performances/:id` | PUT | Mettre à jour une performance |
| `/api/performances/:id` | DELETE | Supprimer une performance |
| `/api/performances/reorder` | PUT | Réorganiser l'ordre des performances |
| `/api/performances/:id/music` | GET | Récupérer le fichier musical |

### Créer une performance (POST /api/performances)

**Corps de la requête** (multipart/form-data) :

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `title` | string | Oui | Titre de la performance |
| `performerName` | string | Oui | Nom de l'artiste |
| `performerPseudo` | string | Non | Pseudo/nom de scène |
| `startOffsetMinutes` | number | Non | Décalage de lecture (minutes) |
| `startOffsetSeconds` | number | Non | Décalage de lecture (secondes) |
| `musicFile` | file | Non | Fichier audio (MP3, WAV, OGG) |

**Exemple de réponse** :

```json
{
  "id": "perf_abc12345",
  "title": "Ma Performance",
  "performerName": "Jean Dupont",
  "performerPseudo": "JD",
  "startOffset": { "minutes": 1, "seconds": 30 },
  "musicFile": {
    "originalName": "musique.mp3",
    "storedPath": "perf_abc12345/musique.mp3"
  },
  "isOver": false
}
```

### Mettre à jour une performance (PUT /api/performances/:id)

Mêmes champs que POST, tous optionnels. Seuls les champs fournis sont mis à jour.

### Réorganiser les performances (PUT /api/performances/reorder)

**Corps de la requête** (JSON) :

```json
{
  "order": ["perf_id1", "perf_id3", "perf_id2"]
}
```

## Fonctionnalités

### Gestion des performances
- Créer, modifier et supprimer des performances
- Réorganiser l'ordre par glisser-déposer
- Marquer une performance comme terminée

### Lecteur audio
- Lecture avec fondu d'entrée/sortie (fade in/out)
- Démarrage à un temps de décalage configurable
- Contrôles lecture/pause/arrêt
- Affichage du temps de lecture en temps réel

### Interface utilisateur
- Thème clair et sombre (bascule automatique sauvegardée)
- Design responsive
- Interface en français

## Tests

### Exécuter les tests

```bash
# Tous les tests avec couverture
npm test

# Tests d'un fichier spécifique
npm test -- api.test.js
npm test -- audioPlayer.test.js
```

### Structure des tests

| Fichier | Description |
|---------|-------------|
| `api.test.js` | Tests d'intégration des endpoints API |
| `audioPlayer.test.js` | Tests du lecteur audio et gestion des offsets |
| `fileManager.test.js` | Tests de gestion des fichiers |
| `idGenerator.test.js` | Tests de génération d'identifiants |
| `theme.test.js` | Tests du système de thème |

### Couverture de code

Les tests génèrent un rapport de couverture affiché dans la console. L'objectif est de maintenir une couverture supérieure à 80%.

## Développement

### Mode développement

```bash
npm run dev
```

Le serveur redémarre automatiquement à chaque modification des fichiers grâce à l'option `--watch` de Node.js.

### Ajouter un nouveau composant frontend

1. Créer le fichier dans `public/js/components/`
2. Exporter la classe avec `export class MonComposant { ... }`
3. Importer dans `app.js` : `import { MonComposant } from './components/MonComposant.js'`

### Ajouter une nouvelle route API

1. Ajouter la route dans `server/routes/api.js`
2. Créer le test correspondant dans `__tests__/api.test.js`
3. Mettre à jour le client API dans `public/js/api/performanceApi.js`

### Conventions de code

- **JavaScript** : ES6+ avec modules ES
- **Nommage** : camelCase pour variables/fonctions, PascalCase pour classes
- **Commentaires** : JSDoc pour les fonctions publiques

## Notes techniques

### Politique audio des navigateurs

Les navigateurs modernes bloquent la lecture audio automatique. L'utilisateur doit interagir avec la page (clic) avant que le son puisse être joué. L'application gère cela automatiquement.

### Formats audio supportés

- MP3 (recommandé)
- WAV
- OGG

### Limite de téléchargement

La taille maximale des fichiers uploadés est de **50 Mo**.

### Stockage des données

Les données sont stockées localement dans le dossier `data/` :
- `performances.json` : métadonnées de toutes les performances
- `{id}/` : dossier contenant le fichier musical de chaque performance

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | 3333 | Port du serveur HTTP |

```bash
# Exemple : démarrer sur un port différent
PORT=8080 npm start
```

## Licence

ISC
