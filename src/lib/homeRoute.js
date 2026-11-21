export function accountTypeOf(user) {
  if (!user) return null;
  return user.account_type || user.data?.account_type || null;
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function canSell(user) {
  return isAdmin(user) || accountTypeOf(user) === 'vendeur';
}

export function homeRouteFor(user) {
  if (!user) return '/login';
  if (isAdmin(user)) return '/vendeur';
  const type = accountTypeOf(user);
  if (!type) return '/bienvenue';
  return type === 'vendeur' ? '/vendeur' : '/espace-client';
}