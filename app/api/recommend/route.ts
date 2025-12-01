import { NextResponse } from "next/server";
import {
  recommendMovies,
  RecommendationQuery,
} from "@/lib/recommender";

const parseYear = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query: RecommendationQuery = {
    movie: searchParams.get("movie") ?? undefined,
    actor: searchParams.get("actor") ?? undefined,
    year: parseYear(searchParams.get("year")),
    language: searchParams.get("language") ?? undefined,
  };

  const hasAnyInput = Object.values(query).some((value) => {
    if (typeof value === "number") return true;
    return Boolean(value && value.toString().trim());
  });

  if (!hasAnyInput) {
    return NextResponse.json(
      { error: "Provide at least one filter (movie, actor, year, or language)." },
      { status: 400 }
    );
  }

  try {
    const recommendations = await recommendMovies(query, 25);

    return NextResponse.json({
      query,
      count: recommendations.length,
      results: recommendations.map(({ movie, score, matchedCriteria, components }) => ({
        title: movie.movieName,
        mainActress: movie.mainActress,
        cast: movie.cast,
        year: movie.year,
        languages: movie.language,
        imdbRating: movie.imdbRating,
        confidence: movie.confidence,
        score,
        matchedCriteria,
        components,
      })),
    });
  } catch (error) {
    console.error("recommend route error", error);
    return NextResponse.json(
      { error: "Unable to read movie dataset. Ensure data/movies.json exists." },
      { status: 500 }
    );
  }
}
