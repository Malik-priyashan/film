"use client";

import { useState } from "react";

const CRITERIA_LABELS = {
  movie: "Title",
  actor: "Actor",
  language: "Language",
  year: "Year",
};

export default function SearchBox() {
  const [similarMovie, setSimilarMovie] = useState("");
  const [mainActor, setMainActor] = useState("");
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("");
  const [results, setResults] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findMovies = async () => {
    try {
      setError(null);
      setLoading(true);
      setMeta(null);
      
      // Build query params from all filled fields
      const params = new URLSearchParams();
      if (similarMovie.trim()) params.append('movie', similarMovie.trim());
      if (mainActor.trim()) params.append('actor', mainActor.trim());
      if (year.trim()) params.append('year', year.trim());
      if (language.trim()) params.append('language', language.trim());
      
      const res = await fetch(`/api/recommend?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Server returned ${res.status}`);
      }

      setResults(Array.isArray(data.results) ? data.results : []);
      setMeta({ count: data.count ?? data.results?.length ?? 0, query: data.query });
    } catch (e) {
      setError(e.message || "Unknown error");
      setResults(null);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen bg-linear-to-br from-black via-red-950 to-black py-12 px-4 relative overflow-hidden">
      {/* Animated background orbs for liquid effect */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-800/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="w-full max-w-2xl mx-auto relative z-10">
  <h1 className="text-6xl font-extrabold text-center mb-3 bg-linear-to-r from-red-500 via-white to-red-500 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
          Movie Finder
        </h1>
        <p className="text-center text-gray-300 mb-10 text-lg">Find movies by multiple criteria</p>

        {/* Main glass card with liquid effect */}
  <div className="bg-linear-to-br from-black/30 via-red-950/20 to-black/30 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl p-8 shadow-2xl shadow-red-900/40 relative overflow-hidden">
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-red-900/5 rounded-3xl"></div>
          
          <div className="space-y-6 relative z-10">
            {/* Similar Movie Field */}
            <div className="group">
              <label className="flex text-sm font-bold text-red-400 mb-3 uppercase tracking-widest items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-ping"></span>
                Similar Movie Name
              </label>
              <input
                type="text"
                placeholder="e.g. Inception, Interstellar"
                value={similarMovie}
                onChange={(e) => setSimilarMovie(e.target.value)}
                className="w-full bg-black/70 backdrop-blur-sm border-2 border-red-900/50 text-white placeholder-gray-500 px-5 py-4 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/30 transition-all duration-300 hover:border-red-700/70 shadow-inner"
                aria-label="similar movie name"
              />
            </div>

            {/* Main Actor Field */}
            <div className="group">
              <label className="flex text-sm font-bold text-red-400 mb-3 uppercase tracking-widest items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-ping"></span>
                Main Actor
              </label>
              <input
                type="text"
                placeholder="e.g. Leonardo DiCaprio"
                value={mainActor}
                onChange={(e) => setMainActor(e.target.value)}
                className="w-full bg-black/70 backdrop-blur-sm border-2 border-red-900/50 text-white placeholder-gray-500 px-5 py-4 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/30 transition-all duration-300 hover:border-red-700/70 shadow-inner"
                aria-label="main actor"
              />
            </div>

            {/* Year and Language in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year Field */}
              <div className="group">
                <label className="flex text-sm font-bold text-red-400 mb-3 uppercase tracking-widest items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-ping"></span>
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-black/70 backdrop-blur-sm border-2 border-red-900/50 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/30 transition-all duration-300 hover:border-red-700/70 appearance-none cursor-pointer shadow-inner"
                  aria-label="year"
                >
                  <option value="" className="bg-black">Select Year</option>
                  {Array.from({ length: 16 }, (_, i) => 2025 - i).map(y => (
                    <option key={y} value={y} className="bg-black">{y}</option>
                  ))}
                </select>
              </div>

              {/* Language Field */}
              <div className="group">
                <label className="flex text-sm font-bold text-red-400 mb-3 uppercase tracking-widest items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full group-hover:animate-ping"></span>
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-black/70 backdrop-blur-sm border-2 border-red-900/50 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/30 transition-all duration-300 hover:border-red-700/70 appearance-none cursor-pointer shadow-inner"
                  aria-label="language"
                >
                  <option value="" className="bg-black">Select Language</option>
                  <option value="english" className="bg-black">English</option>
                  <option value="hindi" className="bg-black">Hindi</option>
                  <option value="telugu" className="bg-black">Telugu</option>
                  <option value="tamil" className="bg-black">Tamil</option>
                  <option value="kannada" className="bg-black">Kannada</option>
                  <option value="malayalam" className="bg-black">Malayalam</option>
                  <option value="korean" className="bg-black">Korean</option>
                  <option value="japanese" className="bg-black">Japanese</option>
                  <option value="french" className="bg-black">French</option>
                  <option value="italian" className="bg-black">Italian</option>
                  <option value="spanish" className="bg-black">Spanish</option>
                  <option value="danish" className="bg-black">Danish</option>
                  <option value="persian" className="bg-black">Persian</option>
                  <option value="portuguese" className="bg-black">Portuguese</option>
                  <option value="german" className="bg-black">German</option>
                  <option value="bengali" className="bg-black">Bengali</option>
                  <option value="swedish" className="bg-black">Swedish</option>
                  <option value="mandarin" className="bg-black">Mandarin</option>
                  <option value="cantonese" className="bg-black">Cantonese</option>
                  <option value="polish" className="bg-black">Polish</option>
                  <option value="english-hindi" className="bg-black">English/Hindi</option>
                  <option value="english-spanish" className="bg-black">English/Spanish</option>
                  <option value="english-polish" className="bg-black">English/Polish</option>
                </select>
              </div>
            </div>

            {/* Find Button - Fully Rounded */}
            <button
              onClick={findMovies}
              disabled={loading || (!similarMovie.trim() && !mainActor.trim() && !year.trim() && !language.trim())}
              className={`w-full px-8 py-5 rounded-full font-bold text-xl bg-linear-to-r from-red-600 via-red-500 to-red-600 text-white shadow-2xl shadow-red-900/60 relative overflow-hidden group ${
                loading ? 'opacity-70 cursor-wait' : 'hover:shadow-red-500/80 hover:scale-[1.03] active:scale-[0.98]'
              } transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {loading ? (
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <svg className="animate-spin h-7 w-7 text-white" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" />
                    <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </svg>
                  <span>Searching...</span>
                </div>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">🎬</span>
                  Find Movies
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-5 bg-linear-to-br from-red-900/40 via-red-950/30 to-black/40 backdrop-blur-xl border-2 border-red-500/50 rounded-3xl shadow-2xl shadow-red-900/50 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠</span>
              <div>
                <span className="text-red-400 font-bold text-lg">Error:</span>
                <p className="text-white mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="mt-8 bg-linear-to-br from-black/30 via-red-950/20 to-black/30 backdrop-blur-xl border-2 border-red-500/30 rounded-3xl p-8 shadow-2xl shadow-red-900/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-red-500/5 via-transparent to-red-900/5 rounded-3xl"></div>
            
            <h3 className="font-extrabold text-3xl mb-6 text-red-400 uppercase tracking-wide flex items-center gap-3 relative z-10">
              <span className="text-4xl">🎥</span>
              Results
            </h3>
            
            {meta && (
              <p className="text-sm text-gray-300 mb-5 relative z-10">
                Showing {results.length} of {meta.count} smart matches based on your filters.
              </p>
            )}

            {results.length > 0 ? (
              <ul className="space-y-4 relative z-10">
                {results.map((r, idx) => (
                  <li key={idx} className="p-5 bg-linear-to-r from-black/70 via-red-950/30 to-black/70 backdrop-blur-lg border-2 border-red-900/40 rounded-2xl hover:border-red-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/50 hover:scale-[1.02] cursor-pointer group">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <div className="font-bold text-xl text-white group-hover:text-red-400 transition-colors">{r.title}</div>
                        {r.year && <div className="text-sm text-red-400 mt-1 font-semibold">📅 {r.year}</div>}
                      </div>
                      <div className="text-sm text-red-300 font-semibold bg-red-900/30 border border-red-500/30 rounded-full px-4 py-1">
                        Match {((r.score || 0) * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-300 leading-relaxed space-y-2">
                      {Array.isArray(r.matchedCriteria) && r.matchedCriteria.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {r.matchedCriteria.map((criteria) => (
                            <span
                              key={criteria}
                              className="text-xs font-semibold uppercase tracking-widest text-red-200 border border-red-500/40 rounded-full px-3 py-1"
                            >
                              {CRITERIA_LABELS[criteria] || criteria}
                            </span>
                          ))}
                        </div>
                      )}
                      {r.imdbRating && (
                        <div className="font-semibold text-yellow-300">IMDb ⭐ {r.imdbRating}</div>
                      )}
                      {r.languages?.length > 0 && (
                        <div>🗣️ Languages: <span className="text-white">{r.languages.join(', ')}</span></div>
                      )}
                      {r.mainActress?.length > 0 && (
                        <div>🎭 Lead Cast: <span className="text-white">{r.mainActress.join(', ')}</span></div>
                      )}
                      {r.cast?.length > 0 && (
                        <div className="text-xs text-gray-400">Full Cast: {r.cast.join(', ')}</div>
                      )}
                      {r.confidence && (
                        <div className="text-xs uppercase tracking-widest text-red-300">Confidence: {r.confidence}</div>
                      )}
                      {r.components && (
                        <div className="text-xs text-gray-400 flex flex-wrap gap-3">
                          {r.components.title > 0 && <span>🎯 title {Math.round(r.components.title * 100)}%</span>}
                          {r.components.actor > 0 && <span>🎭 actor {Math.round(r.components.actor * 100)}%</span>}
                          {r.components.language > 0 && <span>🗣 language {Math.round(r.components.language * 100)}%</span>}
                          {r.components.year > 0 && <span>📅 year {Math.round(r.components.year * 100)}%</span>}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="relative z-10 text-center text-gray-300 bg-black/60 border border-red-900/30 rounded-2xl p-6">
                <p className="text-xl font-semibold mb-2">No matches yet</p>
                <p className="text-sm">Try relaxing your filters or adding a different actor / year.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
