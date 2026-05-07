const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

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
Create a vivid, spoiler-free movie pitch for a movie recommendation app.

Your goal is to make the user curious enough to press play.
Write with cinematic energy, emotional pull, and specific atmosphere.
Sound like an enthusiastic human curator, not a database summary.

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
Mention what makes the movie feel worth watching: tension, humor, stakes, relationships, style, pace, setting, or mood.

Return only valid JSON with this shape:
{
  "summary": "2-3 engaging sentences that feel like a compelling recommendation blurb, no spoilers, no markdown",
  "moodTags": ["punchy mood tag", "punchy mood tag", "punchy mood tag"]
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
    moodTags: Array.isArray(parsed.moodTags)
      ? parsed.moodTags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
      : [],
    generatedBy: model,
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
  generateMovieInsight,
};
