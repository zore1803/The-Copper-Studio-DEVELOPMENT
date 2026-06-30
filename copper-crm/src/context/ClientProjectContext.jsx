/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { clientApi } from "../lib/clientApi";

const ClientProjectContext = createContext(null);
const STORAGE_KEY = "cs_client_selected_project";

const pid = (p) => String(p?._id || p?.id || "");

/**
 * Holds the client's projects and which one is currently selected, so every
 * client section (dashboard, timeline, meetings, documents, billing) can scope
 * itself to a single project. The selection is persisted across reloads.
 */
export function ClientProjectProvider({ children }) {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
  });

  useEffect(() => {
    let alive = true;
    clientApi.getProjects(token)
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        setSelectedId((prev) => {
          const stillValid = list.some((p) => pid(p) === String(prev));
          return stillValid && prev ? prev : pid(list[0]);
        });
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  // Persist the selection so it survives navigation and reloads.
  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(STORAGE_KEY, selectedId);
    } catch { /* ignore */ }
  }, [selectedId]);

  const selectedProject = useMemo(
    () => projects.find((p) => pid(p) === String(selectedId)) || null,
    [projects, selectedId]
  );

  const value = useMemo(
    () => ({ projects, loading, selectedId, setSelectedId, selectedProject }),
    [projects, loading, selectedId, selectedProject]
  );

  return <ClientProjectContext.Provider value={value}>{children}</ClientProjectContext.Provider>;
}

export function useClientProject() {
  return useContext(ClientProjectContext) || {
    projects: [], loading: false, selectedId: "", setSelectedId: () => {}, selectedProject: null,
  };
}

/* ── Shared helpers for scoping records to the selected project ── */

// Meetings & documents carry a projectId. Records with no projectId are treated
// as general (shown under any project) so nothing silently disappears.
export function belongsToProject(record, projectId) {
  if (!projectId) return true;
  const rid = record?.projectId;
  if (!rid) return true;
  return String(rid) === String(projectId);
}

// Orders link to a project via project.orderId (=== order._id) or by name.
export function orderBelongsToProject(order, project) {
  if (!project) return true;
  const orderId = String(order?._id || order?.id || "");
  if (project.orderId && orderId && String(project.orderId) === orderId) return true;
  if (order?.projectName && project.name && order.projectName === project.name) return true;
  // Unlinked orders (no orderId on the project, no projectName) stay visible.
  return !project.orderId && !order?.projectName;
}
