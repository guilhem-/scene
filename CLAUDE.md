# Scene - Performance Manager

A web-based single page application for managing performance lists with audio playback.

## Quick Start

```bash
npm install
npm run dev     # Development with hot reload
npm start       # Production
```

Server runs at http://localhost:3333

## Project Structure

- `server/` - Express.js backend API
- `public/` - Frontend SPA (vanilla JS)
- `data/` - JSON storage and music files

## Key Commands

- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run tests

## Architecture

### Backend
- Express.js handles API and static files
- JSON file for data persistence
- Multer for file uploads

### Frontend
- Vanilla JavaScript (no framework)
- Web Audio API for audio with fade effects
- Native HTML5 drag and drop

### Data Storage
- `data/performances.json` - Performance list
- `data/{id}/music_file.ext` - Music files per performance

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/performances | GET | List all |
| /api/performances | POST | Create new |
| /api/performances/:id | PUT | Update |
| /api/performances/:id | DELETE | Remove |
| /api/performances/reorder | PUT | Change order |

## Development Notes

- Audio requires user interaction before playing (browser policy)
- Supported audio formats: MP3, WAV, OGG
- Max file upload: 50MB
- do not mention Claude in branches, commit, pr...
- prevent accidental leaking of secret/sensitive data. Adjust .gitignore consequently.