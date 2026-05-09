const KEY = "sessionData";

export function startSession(username) {
  if (!username) return;

  const data = JSON.parse(localStorage.getItem(KEY)) || {};

  data[username] = data[username] || {
    totalTimeMs: 0,
    sessions: 0,
    startTime: Date.now(),
  };

  data[username].startTime = Date.now();
  data[username].sessions += 1;

  localStorage.setItem(KEY, JSON.stringify(data));
}

export function endSession(username) {
  if (!username) return;

  const data = JSON.parse(localStorage.getItem(KEY)) || {};
  const user = data[username];

  if (!user || !user.startTime) return;

  const sessionTime = Date.now() - user.startTime;

  user.totalTimeMs += sessionTime;
  user.startTime = null;

  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getSessionData(username) {
  const data = JSON.parse(localStorage.getItem(KEY)) || {};
  return data[username] || null;
}