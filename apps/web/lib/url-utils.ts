/**
 * Update URL search params without triggering a server round-trip.
 * Uses window.history.pushState for instant client-side URL updates.
 */
export function updateUrlParams(updates: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });

  const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  window.history.pushState({}, "", newUrl);

  // Dispatch a custom event so React components using useSearchParams can react
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Clear all URL params
 */
export function clearAllUrlParams() {
  window.history.pushState({}, "", window.location.pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
