<div align="center">

# 📚 StudySpace Finder

**Real-time, crowdsourced study-space availability for campus.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://s00m4r.github.io/StudySpaceFinder/)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-3ECF8E?style=flat&logo=supabase&logoColor=white)

### 🔗 [**Try the live app → s00m4r.github.io/StudySpaceFinder**](https://s00m4r.github.io/StudySpaceFinder/)

</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Building for Android](#building-for-android)
- [Research Analysis](#research-analysis)
- [Research Design](#research-design)
- [Privacy & Ethics](#privacy--ethics)
- [Troubleshooting](#troubleshooting)
- [Author](#author)

---

## About

Finding a free seat in a lab, library or group room on a busy campus wastes time. **StudySpace Finder** lets students see which spaces are free or occupied *right now*, using live check-ins reported by other students.

The app was built as a **3rd Year IT Research Project**:

> *"Evaluating the Impact of a Real-Time Mobile Application on Campus Study Space Utilisation"*

It doubles as both a working product and a data-collection instrument for the study.

## Features

| | Feature | Description |
|---|---|---|
| ⚡ | **Real-time occupancy** | Supabase Realtime pushes check-ins to every user instantly |
| 🔍 | **Search & filter** | Find spaces by name or building, and filter by type (lab, library, group room) |
| 🗺️ | **Building map** | Floor-by-floor map with rooms colour-coded green / red / grey by live status |
| ✅ | **Check-in / check-out** | One-tap occupancy reporting with a server-enforced 5-minute cooldown to prevent spam |
| ⏱️ | **Search-time tracking** | Measures how long users take to find a space (research question 1) |
| 👁️ | **Observer mode** | Hidden panel for researchers to log ground-truth headcounts (research question 2) |
| 📝 | **TAM survey** | Built-in Technology Acceptance Model questionnaire |
| 🔐 | **Authentication** | Email sign-up / login with persistent sessions |
| 🌐 | **Cross-platform** | One codebase for Android, iOS and the web |

## Tech Stack

- **Framework:** [Expo](https://expo.dev) (SDK 54) + [React Native](https://reactnative.dev) 0.81, [React Native Web](https://necolas.github.io/react-native-web/)
- **Language:** TypeScript
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (file-based)
- **Backend:** [Supabase](https://supabase.com): PostgreSQL, Auth, Row Level Security, Realtime
- **Icons:** `@expo/vector-icons` (Ionicons)
- **Hosting:** GitHub Pages (web) · EAS Build (Android / iOS)
- **Analysis:** Python (pandas, SciPy, matplotlib, seaborn)

## Project Structure

```
StudySpaceFinder/
├── app/                        # Expo Router routes
│   ├── _layout.tsx             # Root layout: auth gate + providers
│   ├── (tabs)/                 # Bottom tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Spaces list
│   │   ├── map.tsx             # Building map
│   │   └── profile.tsx         # Profile & stats
│   ├── space/[id].tsx          # Space detail
│   └── survey.tsx              # TAM survey
│
├── src/
│   ├── components/             # UI.tsx (shared components), SpaceCard.tsx
│   ├── hooks/useSpaces.ts      # Data hooks: spaces, check-ins, sessions, survey
│   ├── lib/                    # supabase client, AuthContext, SpacesContext, theme
│   ├── navigation/             # AppNavigator.tsx
│   └── screens/                # Auth, Home, SpaceDetail, BuildingMap, Survey, Profile
│
├── sql/
│   ├── schema.sql              # Full database schema (run first)
│   └── migration_*.sql         # Incremental migrations
│
├── analysis/analyse.py         # Research analysis script
├── assets/                     # Icons, splash screen, images
├── app.json                    # Expo config
├── eas.json                    # EAS Build profiles
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- A free [Supabase](https://supabase.com) account
- (Optional) [Expo Go](https://expo.dev/go) on your phone

### 1. Clone and install

```bash
git clone https://github.com/S00M4R/StudySpaceFinder.git
cd StudySpaceFinder
npm install
```

> The repo includes an `.npmrc` with `legacy-peer-deps=true`, so a plain `npm install` works.

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`sql/schema.sql`](sql/schema.sql) and click **Run**.
3. If your database was created from an older version of the schema, run the latest file in [`sql/`](sql/) named `migration_*.sql` **once**.
4. Go to **Settings → API** and copy your **Project URL** and **anon / public key**.
5. Confirm **Realtime** is enabled for the `check_ins` and `spaces` tables (**Database → Replication**).
6. Add your study spaces to the `spaces` table.

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

> ⚠️ Only ever put the **anon** key here. The `service_role` key must never be placed in the app or committed to Git. `.env` is already listed in `.gitignore`.

### 4. Run the app

```bash
npx expo start
```

| Target | How |
|---|---|
| **Phone** | Scan the QR code with Expo Go |
| **Android emulator** | Press `a` |
| **iOS simulator** | Press `i` |
| **Web browser** | Press `w` or run `npm run web` |

## Deploying to GitHub Pages

The web version is deployed with [`gh-pages`](https://www.npmjs.com/package/gh-pages).

```bash
npm run deploy
```

This runs `predeploy` (exports the web build, renames the font folder, copies `index.html` to `404.html` for SPA routing) and then publishes `dist/` to the `gh-pages` branch with `--nojekyll`.

**Required configuration** (already set in this repo):

```jsonc
// app.json
{
  "expo": {
    "web": { "bundler": "metro", "output": "single" },
    "experiments": { "baseUrl": "/StudySpaceFinder/" }
  }
}
```

**Suggested `package.json` scripts:**

```json
"predeploy": "npx expo export -p web && node scripts/fix-assets.js && node -e \"require('fs').copyFileSync('dist/index.html','dist/404.html')\"",
"deploy": "gh-pages --nojekyll -d dist"
```

Then in the GitHub repo go to **Settings → Pages** and set the source to the `gh-pages` branch (root).

### Why `scripts/fix-assets.js`?

Expo exports icon fonts to `dist/assets/node_modules/...`. Folders named `node_modules` are skipped during deployment, so the icon fonts never reached the live site and icons appeared blank. `scripts/fix-assets.js` renames that folder to `dist/assets/vendor/` and rewrites every reference to it in the built files.

<details>
<summary><strong>View <code>scripts/fix-assets.js</code></strong></summary>

```js
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'vendor');

if (fs.existsSync(from)) fs.renameSync(from, to);

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(js|html|json)$/.test(f)) {
      const s = fs.readFileSync(p, 'utf8');
      if (s.includes('/assets/node_modules/')) {
        fs.writeFileSync(p, s.split('/assets/node_modules/').join('/assets/vendor/'));
      }
    }
  }
}
walk(dist);
```

</details>

## Building for Android

An installable APK for testers can be built with [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Build profiles (`development`, `preview`, `production`) are defined in [`eas.json`](eas.json).

## Research Analysis

After data collection, export results and generate figures with the analysis script.

```bash
pip install supabase pandas scipy matplotlib seaborn

# macOS / Linux
export SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
export SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"

# Windows (PowerShell)
$env:SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
$env:SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"

python analysis/analyse.py
```

Outputs are written to `analysis/output/`:

| File | Purpose |
|---|---|
| `search_time_distribution.png` | RQ1: distribution of time taken to find a space |
| `accuracy_heatmap.png` | RQ2: crowdsourced occupancy vs. physical headcounts |
| `tam_survey_results.png` | TAM questionnaire mean scores |
| `usage_over_time.png` | Daily app usage |
| `*.csv` | Raw exports for R / SPSS (git-ignored) |

## Research Design

| Element | Detail |
|---|---|
| **RQ1** | How does the app affect average search time for a study space? |
| **RQ2** | How accurate is crowdsourced occupancy data compared to physical headcounts? |
| **Framework** | Technology Acceptance Model (Davis, 1989): perceived usefulness, ease of use, trust, intent to continue |
| **Paradigm** | Mixed methods (positivism + interpretivism) |
| **Data collection** | Check-ins, search sessions, observer headcounts, TAM survey |

## Privacy & Ethics

- No background GPS or continuous location tracking
- Location is only captured on active user interaction
- The public `space_status` view does not expose who reported an occupancy status
- Row Level Security is enabled on all tables
- Raw logs are anonymised before analysis
- Participants may withdraw at any time and request deletion of their data
- No academic incentives are tied to usage, to avoid coercion bias

## Troubleshooting

| Problem | Fix |
|---|---|
| **Icons blank on the deployed site** | Make sure `predeploy` runs `scripts/fix-assets.js`, then redeploy and hard-refresh (Ctrl+Shift+R) |
| **Blank page or 404 on assets at GitHub Pages** | Check `experiments.baseUrl` in `app.json` matches the repo name (`/StudySpaceFinder/`) |
| **Page refresh gives 404** | Ensure `predeploy` copies `index.html` to `404.html` |
| **`npm install` peer-dependency errors** | Keep `legacy-peer-deps=true` in `.npmrc` |
| **App can't connect to Supabase** | Check `.env` values, then restart with `npx expo start -c` |
| **"Please wait 5 minutes" on check-in** | Expected: the server-side anti-spam cooldown |



---

<div align="center">
<sub>Built as a 3rd Year IT research project · React Native · Expo · Supabase</sub>
</div>
