# Relationship Planner

A small React + Vite app for keeping a shared list of things to watch, play, do, and plan together.

The app currently supports:
- category tabs (`Movies`, `Restaurants`, `Happenings`, `Videogames`, `Activities`, `Trips`)
- adding and deleting entries
- marking entries as done
- sorting by date or excitement
- filtering to show only not-done items
- JSON export and import
- local autosave via `localStorage`

## Local Development

Requirements:
- Node.js 20+ recommended
- npm

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Data Handling

The app stores data in two ways:

- `localStorage`
  The current list is saved automatically in the browser, so reloading the page does not clear your data.

- `JSON import/export`
  You can export the full list as a `.json` file and import it later. This is useful for manual backup or syncing through a shared folder like Google Drive.

Export format:
- `version`
- `exportedAt`
- `items`

## GitHub Pages Deployment

This project is configured for GitHub Pages as a project site:

- repository: `Avaxxxio/relationship-planner`
- site URL: `https://avaxxxio.github.io/relationship-planner/`

Deployment uses GitHub Actions through:
- [.github/workflows/deploy.yml](e:\UsList\relationship-planner\.github\workflows\deploy.yml)

Vite is configured with the correct base path in:
- [vite.config.js](e:\UsList\relationship-planner\vite.config.js)

To publish:

1. Push the project to the `main` branch.
2. Open `Settings -> Pages` in the GitHub repository.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push changes to `main` to trigger deployment.

## Notes

- GitHub Pages is suitable for simple static hosting, but the site itself is publicly reachable unless you are using GitHub Enterprise features for restricted visibility.
- This app currently has no authentication. Privacy is handled only by what data you choose to upload or share.
