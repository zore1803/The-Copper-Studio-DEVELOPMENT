const STORAGE_KEY = "cs-company-owners";
const DEFAULT_OWNERS = [];

// Company owners are a managed list editable from Settings, kept in localStorage
// the same way Companies.jsx persists hotlist folders — no backend list endpoint
// exists yet, and every consumer (Settings, CompanyFormPanel) reads this module.
export function loadCompanyOwners() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(raw)) return raw;
  } catch {
    /* ignore malformed cache */
  }
  return DEFAULT_OWNERS;
}

export function persistCompanyOwners(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / availability errors */
  }
}
