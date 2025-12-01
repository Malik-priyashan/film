import { readFile } from "node:fs/promises";
import path from "node:path";

export interface MovieRecord {
  movieName: string;
  mainActress: string[];
  cast: string[];
  year: number | null;
  language: string[];
  imdbRating: number | null;
  confidence: string;
}

interface PreparedMovie extends MovieRecord {
  tokens: {
    title: string[];
    cast: string[];
    language: string[];
  };
}

export interface RecommendationQuery {
  movie?: string;
  actor?: string;
  year?: number | null;
  language?: string;
}

export interface ScoreComponents {
  title: number;
  actor: number;
  language: number;
  year: number;
  ratingBoost: number;
}

export interface RecommendationResult {
  score: number;
  movie: MovieRecord;
  matchedCriteria: string[];
  components: ScoreComponents;
}

let cachedMovies: PreparedMovie[] | null = null;

const dataPath = path.join(process.cwd(), "data", "movies.json");

const tokenize = (value: string | undefined | null): string[] =>
  value
    ? value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
    : [];

const listTokenize = (values: string[]): string[] =>
  values.flatMap((value) => tokenize(value));

const jaccard = (a: string[], b: string[]): number => {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection += 1;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const normalizeMovieRecord = (record: MovieRecord): PreparedMovie => {
  const ensureList = (values?: string[] | string): string[] => {
    if (!values) return [];
    if (Array.isArray(values)) return values.filter(Boolean);
    return values.split(/[,|]/).map((item) => item.trim()).filter(Boolean);
  };

  const cleanRecord: MovieRecord = {
    movieName: record.movieName?.trim() ?? "",
    mainActress: ensureList(record.mainActress ?? []),
    cast: ensureList(record.cast ?? []),
    year: typeof record.year === "number" ? record.year : null,
    language: ensureList(record.language ?? []),
    imdbRating:
      typeof record.imdbRating === "number" && !Number.isNaN(record.imdbRating)
        ? record.imdbRating
        : null,
    confidence: record.confidence ?? "UNKNOWN",
  };

  return {
    ...cleanRecord,
    tokens: {
      title: tokenize(cleanRecord.movieName),
      cast: listTokenize([...cleanRecord.cast, ...cleanRecord.mainActress]),
      language: listTokenize(cleanRecord.language),
    },
  };
};

async function readMoviesFromDisk(): Promise<PreparedMovie[]> {
  const file = await readFile(dataPath, "utf-8");
  const raw = JSON.parse(file) as MovieRecord[];
  return raw
    .map(normalizeMovieRecord)
    .filter((movie) => movie.movieName.length > 0);
}

export async function loadMovies(): Promise<PreparedMovie[]> {
  if (!cachedMovies) {
    cachedMovies = await readMoviesFromDisk();
  }
  return cachedMovies;
}

const yearScore = (movieYear: number | null, queryYear: number | null): number => {
  if (!movieYear || !queryYear) return 0;
  const diff = Math.abs(movieYear - queryYear);
  if (diff === 0) return 1;
  const MAX_DIFF = 15;
  return Math.max(0, 1 - diff / MAX_DIFF);
};

const languageScore = (movieLanguages: string[], queryLanguage?: string): number => {
  if (!queryLanguage) return 0;
  const normalized = queryLanguage.toLowerCase();
  const hasMatch = movieLanguages.some((lang) =>
    lang.toLowerCase().includes(normalized)
  );
  return hasMatch ? 1 : 0;
};

const ratingBoost = (rating: number | null): number => {
  if (!rating) return 0;
  const normalized = Math.min(Math.max(rating, 0), 10) / 10;
  return normalized * 0.1;
};

const textScore = (query: string | undefined, ...targets: string[][]): number => {
  if (!query?.trim()) return 0;
  const queryTokens = tokenize(query);
  const combinedTargets = targets.flat();
  return jaccard(queryTokens, combinedTargets);
};

const actorScore = (query: string | undefined, castTokens: string[]): number => {
  if (!query?.trim()) return 0;
  const queryTokens = tokenize(query);
  return jaccard(queryTokens, castTokens);
};

const actorNameMatch = (
  query: string | undefined,
  names: string[]
): boolean => {
  if (!query?.trim()) return false;
  const normalized = query.toLowerCase().trim();
  return names.some((name) => name.toLowerCase().includes(normalized));
};

export async function recommendMovies(
  query: RecommendationQuery,
  limit = 20
): Promise<RecommendationResult[]> {
  const movies = await loadMovies();

  const queryFlags = {
    movie: Boolean(query.movie?.trim()),
    actor: Boolean(query.actor?.trim()),
    language: Boolean(query.language?.trim()),
    year: typeof query.year === "number" && Number.isFinite(query.year),
  } as const;

  const STRICT_MATCH = {
    movie: 0.08,
    actor: 0.06,
    year: 0.2,
  };

  const RELAXED_MATCH = {
    movie: 0.04,
    actor: 0.03,
    year: 0.12,
  };

  const MIN_SCORE_STRICT = 0.1;
  const MIN_SCORE_RELAXED = 0.05;

  const activeFilterCount = Object.values(queryFlags).filter(Boolean).length;

  const runPass = (relaxed: boolean) => {
    const thresholds = relaxed ? RELAXED_MATCH : STRICT_MATCH;
    const minScore = relaxed ? MIN_SCORE_RELAXED : MIN_SCORE_STRICT;
    const requiredSignals = activeFilterCount
      ? Math.max(1, activeFilterCount - (relaxed ? 1 : 0))
      : 0;

    const provisional: Array<RecommendationResult & { signalsMatched: number }> = [];

    for (const movie of movies) {
      const titleSimilarity = textScore(query.movie, movie.tokens.title, movie.tokens.cast);
      const actorSimilarity = actorScore(query.actor, movie.tokens.cast);
      const languageSimilarity = languageScore(movie.language, query.language);
      const yearSimilarity = yearScore(movie.year, query.year ?? null);
      const rating = ratingBoost(movie.imdbRating);
      const actorExactMatch = actorNameMatch(query.actor, [
        ...movie.cast,
        ...movie.mainActress,
      ]);

      const matches = {
        movie: !queryFlags.movie || titleSimilarity >= thresholds.movie,
        actor:
          !queryFlags.actor || actorExactMatch || actorSimilarity >= thresholds.actor,
        language: !queryFlags.language || languageSimilarity > 0,
        year: !queryFlags.year || yearSimilarity >= thresholds.year,
      } as const;

      if (!relaxed && Object.values(matches).some((match) => !match)) continue;

      const matchedCriteria = Object.entries(matches)
        .filter(([key, value]) => value && queryFlags[key as keyof typeof queryFlags])
        .map(([key]) => key);

      const signalsMatched = matchedCriteria.length;
      if (activeFilterCount && signalsMatched < requiredSignals) continue;

      const score =
        titleSimilarity * 0.4 +
        actorSimilarity * 0.25 +
        languageSimilarity * 0.15 +
        yearSimilarity * 0.15 +
        rating;

      if (activeFilterCount && score < minScore) continue;

      provisional.push({
        movie,
        score: Number(score.toFixed(4)),
        matchedCriteria,
        components: {
          title: Number(titleSimilarity.toFixed(4)),
          actor: Number(actorSimilarity.toFixed(4)),
          language: Number(languageSimilarity.toFixed(4)),
          year: Number(yearSimilarity.toFixed(4)),
          ratingBoost: Number(rating.toFixed(4)),
        },
        signalsMatched,
      });
    }

    return provisional
      .sort((a, b) => {
        if (b.signalsMatched !== a.signalsMatched) {
          return b.signalsMatched - a.signalsMatched;
        }
        return b.score - a.score;
      })
      .slice(0, limit)
      .map((entry) => {
        const { signalsMatched, ...rest } = entry;
        void signalsMatched;
        return rest;
      });
  };

  const strictResults = runPass(false);
  if (strictResults.length || !activeFilterCount) {
    return strictResults;
  }

  return runPass(true);
}
