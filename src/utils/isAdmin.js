export function isAdmin(user) {
  if (!user) return false;

  // admin username(s)
  const ADMIN_USERNAMES = ["ryk_cool"];

  // storing username in Firestore/localStorage
  const username =
    user.displayName ||
    localStorage.getItem("username") ||
    "";

  return ADMIN_USERNAMES.includes(username);
}
