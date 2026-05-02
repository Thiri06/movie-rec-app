import React from "react";
import { formatRating, getPosterUrl } from "../utils/movieApi";

const MovieCard = ({ movie, colors, onSelect, index = 0, actions }) => {
  const handleSelect = () => {
    if (onSelect) {
      onSelect(movie);
    }
  };

  return (
    <article
      className="yoko-fade-up group overflow-hidden rounded-2xl"
      style={{
        backgroundColor: `${colors.background}dd`,
        border: `1px solid ${colors.secondary}`,
        animationDelay: `${index * 65}ms`,
      }}
    >
      <button onClick={handleSelect} className="block w-full text-left" type="button">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={getPosterUrl(movie.poster_path)}
            alt={movie.title || "Movie poster"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div
            className="absolute right-2 top-2 rounded-lg px-2 py-1 text-xs font-bold"
            style={{
              backgroundColor: `${colors.background}d9`,
              color: colors.primary,
            }}
          >
            {formatRating(movie.vote_average)}
          </div>
        </div>
        <div className="space-y-2 p-3">
          <h4
            className="text-sm font-bold md:text-base"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {movie.title}
          </h4>
          <p
            className="text-xs leading-relaxed md:text-sm"
            style={{
              color: `${colors.text}bf`,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {movie.overview || "No overview available."}
          </p>
        </div>
      </button>
      {actions ? <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2">{actions}</div> : null}
    </article>
  );
};

export default MovieCard;
