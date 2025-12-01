#!/usr/bin/env node
import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const dataDir = path.join(projectRoot, "data");
const resolvePath = (input, fallback) => {
  if (!input) return fallback;
  const candidate = path.isAbsolute(input)
    ? input
    : path.join(projectRoot, input);
  return candidate;
};

const csvPath = resolvePath(process.env.MOVIE_CSV_PATH, path.join(dataDir, "movies.csv"));
const jsonPath = resolvePath(process.env.MOVIE_JSON_PATH, path.join(dataDir, "movies.json"));

async function main() {
  try {
    await mkdir(dataDir, { recursive: true });
  const csv = await readFile(csvPath, "utf-8");
    const rows = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const normalizeList = (value) =>
      value
        ? value
            .split(/[,|]/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const records = rows
      .map((row) => ({
        movieName: row["Movie Name"]?.trim() ?? "",
        mainActress: normalizeList(row["Main Actress"] ?? row["Main Actor"]),
        cast: normalizeList(row["Cast"]),
        year: row["Year"] ? Number(row["Year"].slice(0, 4)) : null,
        language: normalizeList(row["Language"]),
        imdbRating: row["IMDb_Rating"] ? Number(row["IMDb_Rating"]) : null,
        confidence: row["Confidence"] || "UNKNOWN",
      }))
      .filter((movie) => movie.movieName.length > 0);

    await writeFile(jsonPath, JSON.stringify(records, null, 2));

    console.log(`✅ Wrote ${records.length} movies to ${path.relative(projectRoot, jsonPath)}`);
  } catch (error) {
    console.error("Failed to build movie JSON:\n", error.message);
    process.exitCode = 1;
  }
}

await main();
