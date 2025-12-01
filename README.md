# 🎬 Movie AI Finder

A Next.js 16 app that turns your curated movie spreadsheet into a lightweight recommendation engine. Provide any combination of **similar movie title, known actors, release year, or language** and the UI returns the closest matches ranked by a hybrid similarity score.

The backend lives inside the same repo (`app/api/recommend/route.ts`). It loads a preprocessed `data/movies.json`, vectorizes every movie (title tokens, cast tokens, languages, numeric year, IMDb rating), and scores each candidate against the query. No external services, no API keys.

---

## 📦 Setup

```bash
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to use the finder.

---

## 🧠 Preparing your dataset ("training")

1. **Export the Excel sheet as CSV** and save it as `data/movies.csv`.
2. Ensure the header row matches the expected columns (case-sensitive):
	- `Movie Name`, `Main Actress`, `Cast`, `Year`, `Language`, `IMDb_Rating`, `Confidence`
3. Run the ingestion script to convert CSV → JSON (the server reads the JSON file):

```bash
npm run ingest:data
```

The script (`scripts/build-movie-json.mjs`) normalizes lists (comma or pipe delimited), coerces numbers, and writes to `data/movies.json`. Set `MOVIE_CSV_PATH` or `MOVIE_JSON_PATH` in `.env.local` if you store the files somewhere else.

> ✅ Tip: you can re-run the script any time you update the spreadsheet—no code changes needed.

### 🔗 Using an Excel link + pandas

If you’d rather keep everything in Excel and let pandas handle the preprocessing:

1. Copy `.env.example` to `.env.local` and fill in at least one of these:
	- `MOVIE_EXCEL_PATH` – absolute/relative path to a local workbook
	- `MOVIE_EXCEL_URL` – shareable download URL (OneDrive, Google Drive export, etc.)
	- Optional overrides: `MOVIE_EXCEL_SHEET`, `MOVIE_CSV_PATH`, `MOVIE_JSON_PATH`
2. Install the Python tooling once:

```bash
python -m pip install -r scripts/requirements.txt
```

3. Run the pandas-powered ingestion:

```bash
npm run ingest:excel
```

This executes `scripts/excel_to_json.py`, which loads the Excel sheet via pandas, writes `data/movies.csv`, and emits `data/movies.json` in the exact format expected by the recommender. You can rerun it any time you update the sheet; the script respects the `.env.local` link/path so you never have to hard-code the location inside the repository.

---

## 🔍 How recommendations work

- **Token similarity**: Jaccard overlap between the query tokens and a movie's title/cast tokens (weighted highest).
- **Actor awareness**: Extra weight when the supplied actor matches the cast list.
- **Temporal decay**: Movies released within ~15 years of the requested year receive a boost.
- **Language match**: Exact/partial language matches add weight.
- **Rating bonus**: Higher IMDb ratings slightly push quality titles upward.

All weights are configured in `lib/recommender.ts`, so you can tweak the logic without touching the UI.

---

## 🛠 API contract

`GET /api/recommend?movie=&actor=&year=&language=`

| Query param | Type | Notes |
|-------------|------|-------|
| `movie` | string | Any fragment of a title you already like |
| `actor` | string | Actor/actress name (partial or full) |
| `year` | number | 4-digit year (e.g., `2016`) |
| `language` | string | One of the dropdown values (e.g., `english`, `hindi`) |

Response:

```json
{
	"query": { ...echoed filters },
	"count": 8,
	"results": [
		{
			"title": "Arrival",
			"languages": ["English"],
			"year": 2016,
			"mainActress": ["Amy Adams"],
			"cast": ["Amy Adams", "Jeremy Renner"],
			"imdbRating": 7.9,
			"confidence": "MEDIUM",
			"score": 0.72
		}
	]
}
```

Integrations (Postman, other apps) can reuse the same endpoint.

---

## 🧪 Customizing the engine

- Tweak weights or similarity functions inside `lib/recommender.ts`.
- Add new spreadsheet columns (genre, runtime, etc.) and feed them into the scoring function.
- Swap the heuristic approach for an embedding model later—`recommendMovies` centralizes the logic so you only change it in one file.

---

## 🚀 Deployment

The app is a standard Next.js project; deploy anywhere that supports Node.js (Vercel, Netlify, Azure Static Web Apps, etc.). Make sure `data/movies.json` ships with the build artifacts or is mounted in the runtime environment.

---

## 📚 Next steps

- Add more filters (genres, streaming providers) to both the UI and scoring function.
- Cache recommendations per query if dataset grows significantly.
- Introduce embeddings (OpenAI, Cohere, HuggingFace) once you need semantic matches beyond metadata.
