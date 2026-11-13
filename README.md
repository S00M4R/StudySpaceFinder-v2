# StudySpaceFinder
### 3rd Year IT Research Project
**"Evaluating the Impact of a Real-Time Mobile Application on Campus Study Space Utilisation"**

---

## Project Structure

```
StudySpaceFinder/
├── App.tsx                         ← App entry point
├── app.json                        ← Expo config
├── package.json
│
├── sql/
│   └── schema.sql                  ← Run this in Supabase first
│
├── src/
│   ├── lib/
│   │   ├── supabase.ts             ← Supabase client + types  ⚠️ add your keys here
│   │   ├── AuthContext.tsx         ← Auth state (login/register)
│   │   └── theme.ts                ← Design system / colours
│   │
│   ├── hooks/
│   │   └── useSpaces.ts            ← All data hooks (spaces, check-ins, sessions, survey)
│   │
│   ├── components/
│   │   ├── UI.tsx                  ← Shared components (Button, Input, Card, etc.)
│   │   └── SpaceCard.tsx           ← Space list card
│   │
│   ├── screens/
│   │   ├── AuthScreen.tsx          ← Login / Register
│   │   ├── HomeScreen.tsx          ← Space list + filters + search
│   │   ├── SpaceDetailScreen.tsx   ← Check-in / check-out + observer headcount
│   │   ├── SurveyScreen.tsx        ← TAM questionnaire
│   │   └── ProfileScreen.tsx       ← User stats + sign out
│   │
│   └── navigation/
│       └── AppNavigator.tsx        ← Bottom tabs + stack
│
└── analysis/
    └── analyse.py                  ← Python script for research analysis
```

---

## Step 1 — Set up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a **new project** (choose a region close to South Africa, e.g. `eu-west-1`)
3. Go to **SQL Editor** → paste the entire contents of `sql/schema.sql` → click **Run**
4. Go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://abcdef.supabase.co`)
   - **anon / public key**
5. Open `src/lib/supabase.ts` and replace the placeholder values:
   ```ts
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   ```
6. In Supabase → **Database → Replication**, enable **Realtime** on the `check_ins` table

---

## Step 2 — Install and run the app

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

Then:
- **Android**: install **Expo Go** from the Play Store → scan the QR code
- **iOS**: install **Expo Go** from the App Store → scan the QR code
- **Emulator**: press `a` (Android) or `i` (iOS) in the terminal

---

## Step 3 — Run the research analysis

After collecting data from participants:

```bash
# Install Python dependencies
pip install supabase pandas scipy matplotlib seaborn

# Set your credentials
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"   # from Settings → API → service_role

# Run analysis
cd analysis
python analyse.py
```

Output files will be saved to `analysis/output/`:
- `search_time_distribution.png` — RQ1: search duration histogram
- `accuracy_heatmap.png` — RQ2: crowdsourcing accuracy confusion matrix
- `tam_survey_results.png` — TAM questionnaire means
- `usage_over_time.png` — daily app usage
- `*.csv` — raw data exports for R or SPSS

---

## Research Design Summary

| Element | Detail |
|---|---|
| RQ1 | How does the app affect average search time? |
| RQ2 | How accurate is crowdsourced occupancy data vs. physical headcounts? |
| Framework | Technology Acceptance Model (Davis, 1989) |
| Paradigm | Mixed methods (positivism + interpretivism) |
| Stack | React Native · Expo · Supabase (PostgreSQL + Realtime) |
| Analysis | Python (pandas, scipy, matplotlib) |

---

## Key Features

- **Real-time occupancy updates** — Supabase Realtime pushes changes instantly to all users
- **Search session tracking** — automatically measures how long users spend finding a space (RQ1)
- **Observer/headcount mode** — hidden panel for researchers to record ground-truth counts (RQ2)
- **TAM survey** — 4-item Likert questionnaire built into the Profile screen
- **Anonymised data** — no GPS, no persistent identifiers in analysis exports

---

## Ethical Notes

- No background GPS or continuous location tracking
- Location only captured on active user interaction
- All raw logs anonymised before analysis
- Participants can withdraw at any time (contact researcher to delete data)
- No academic incentives tied to usage (avoids coercion bias)



