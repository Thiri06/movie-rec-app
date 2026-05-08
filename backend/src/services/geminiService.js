const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const INSIGHT_VERSION = 2;

const parseGeminiJson = (text) => {
  if (!text) {
    return null;
  }

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    return null;
  }
};

const buildPrompt = (movie) => {
  const genres = (movie.genres || []).map((genre) => genre.name).filter(Boolean).join(", ") || "Unknown";
  const directors = (movie.directors || []).map((director) => director.name).filter(Boolean).join(", ") || "Unknown";
  const cast = (movie.cast || []).slice(0, 6).map((person) => person.name).filter(Boolean).join(", ") || "Unknown";

  return `
Create a spoiler-free "Why Watch" recommendation for a movie app.

Your goal is not to retell the plot. Explain why this movie is worth a user's time.
Focus on viewing value: emotional payoff, visual style, genre appeal, pacing, performances, director/cast draw, atmosphere, originality, rewatchability, or who would especially enjoy it.
Sound like an observant human curator making a recommendation, not a database summary or synopsis.

Avoid flat phrases such as:
- faces challenges
- must navigate
- put to the test
- mounting pressure
- unexpected events
- a journey of
- explores themes of

Do not reveal twists, endings, or major spoilers.
Do not exaggerate beyond the movie facts.
Avoid summarizing the setup unless it directly supports a recommendation reason.

Return only valid JSON with this shape:
{
  "summary": "1 sentence that directly states the main reason to watch, no spoilers, no markdown",
  "reasons": [
    "specific reason 1, focused on craft, emotion, style, performance, or audience appeal",
    "specific reason 2, not a plot beat",
    "specific reason 3, not a plot beat"
  ],
  "bestFor": "short audience fit, such as 'Best for viewers who want ...'",
  "moodTags": ["punchy appeal tag", "punchy appeal tag", "punchy appeal tag"]
}

Movie:
Title: ${movie.title}
Year: ${movie.releaseYear || "Unknown"}
Genres: ${genres}
Rating: ${movie.voteAverage || "Unknown"}
Runtime: ${movie.runtime || "Unknown"}
Directors: ${directors}
Cast: ${cast}
TMDb overview: ${movie.overview || "No overview available"}
`.trim();
};

const requestGeminiInsight = async (movie, model) => {
  const response = await fetch(`${GEMINI_BASE_URL}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(movie) }],
        },
      ],
      generationConfig: {
        temperature: 0.55,
        maxOutputTokens: 260,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const error = new Error(`Gemini request failed with status ${response.status}. ${errorBody}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n");
  const parsed = parseGeminiJson(text);

  if (!parsed?.summary) {
    return null;
  }

  return {
    summary: String(parsed.summary).slice(0, 900),
    reasons: Array.isArray(parsed.reasons)
      ? parsed.reasons.map((reason) => String(reason).trim()).filter(Boolean).slice(0, 3)
      : [],
    bestFor: parsed.bestFor ? String(parsed.bestFor).trim().slice(0, 220) : "",
    moodTags: Array.isArray(parsed.moodTags)
      ? parsed.moodTags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
      : [],
    generatedBy: model,
    insightVersion: INSIGHT_VERSION,
  };
};

const getCandidateModels = () => {
  const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return [...new Set([configuredModel, "gemini-2.0-flash"])];
};

const generateMovieInsight = async (movie) => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const retryableStatuses = new Set([404, 429, 503]);
  let lastError = null;

  for (const model of getCandidateModels()) {
    try {
      return await requestGeminiInsight(movie, model);
    } catch (error) {
      lastError = error;
      if (!retryableStatuses.has(error.status)) {
        throw error;
      }
    }
  }

  throw lastError;
};

module.exports = {
  INSIGHT_VERSION,
  generateMovieInsight,
};
