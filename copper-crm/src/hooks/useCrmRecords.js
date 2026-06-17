import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import { storeGet, storeSave, storeRemove, storeSet } from "../lib/store";

function isLocalId(id, type) {
  return !id || String(id).startsWith(type + "-") || String(id).startsWith("demo");
}

export function useCrmRecords(type, fallback = []) {
  const [records, setRecords] = useState(() => storeGet(type));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    apiGet(`/api/crm/${type}`)
      .then((data) => {
        if (!alive) return;
        if (data.length) {
          storeSet(type, data);
          setRecords(data);
        }
        setError("");
      })
      .catch(() => {
        if (!alive) return;
        setError("");
      })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [type]);

  useEffect(() => {
    function onUpdate(e) {
      if (e.detail?.type === type) {
        setRecords(storeGet(type));
      }
    }
    window.addEventListener("cs-store", onUpdate);
    return () => window.removeEventListener("cs-store", onUpdate);
  }, [type]);

  const actions = useMemo(() => ({
    async save(record) {
      const saved = storeSave(type, record);
      setRecords(storeGet(type));

      try {
        const mongoId = record._id;
        if (mongoId && !isLocalId(mongoId, type)) {
          const updated = await apiPut(`/api/crm/${type}/${mongoId}`, record);
          storeSave(type, updated);
          setRecords(storeGet(type));
          return updated;
        } else if (!mongoId) {
          const created = await apiPost(`/api/crm/${type}`, record);
          storeSave(type, created);
          setRecords(storeGet(type));
          return created;
        }
      } catch {}

      return saved;
    },

    async remove(record) {
      const id = record._id || record.id;
      storeRemove(type, id);
      setRecords(storeGet(type));
      try {
        if (record._id && !isLocalId(record._id, type)) {
          await apiDelete(`/api/crm/${type}/${record._id}`);
        }
      } catch {}
    },

    setRecords,
  }), [type]);

  return { records, loading, error, ...actions };
}
