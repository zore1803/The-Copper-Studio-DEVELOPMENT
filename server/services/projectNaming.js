// Shared project-naming helpers used both when a project is first created from a
// paid order and when an orphan (no-company) project is later adopted by a
// company in the CRM. Keeping them in one place stops the two paths from
// drifting apart and producing differently-formatted names/codes.

// First 4 DISTINCT letters of the company name (repeats skipped), e.g.
// "DATACENTRIC" -> "DATC". Padded with X if fewer than 4 distinct letters.
export function companyCodeFromName(name) {
  const letters = String(name || "").toUpperCase().replace(/[^A-Z]/g, "");
  const seen = new Set();
  let code = "";
  for (const ch of letters) {
    if (seen.has(ch)) continue;
    seen.add(ch);
    code += ch;
    if (code.length === 4) break;
  }
  return code.padEnd(4, "X");
}

// Structured project code: CS-<4 letters>-<project #>-<MMYY>, e.g. CS-DATC-02-0626.
export function buildProjectCode(companyName, projectNumber, date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const num = String(projectNumber || 1).padStart(2, "0");
  return `CS-${companyCodeFromName(companyName)}-${num}-${mm}${yy}`;
}

// Default project name: <Company>-Project <project #>-<MMYY>, e.g. "Datacentric-Project 2-0626".
export function buildDefaultProjectName(companyName, projectNumber, date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${companyName}-Project ${projectNumber || 1}-${mm}${yy}`;
}
