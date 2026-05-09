const KEY = "sessionData";

export function getLeaderboard() {
  const data = JSON.parse(localStorage.getItem(KEY)) || {};

  return Object.entries(data)
    .map(([username, stats]) => ({
      username,
      ...stats,
    }))
    .sort((a, b) => b.totalTimeMs - a.totalTimeMs);
}