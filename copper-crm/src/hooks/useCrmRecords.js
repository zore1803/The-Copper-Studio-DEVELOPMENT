import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../lib/api";
import { storeGet, storeSave, storeRemove, storeSet } from "../lib/store";

function isLocalId(id, type) {
  return !id || String(id).startsWith(type + "-") || String(id).startsWith("demo");
}

export function useCrmRecords(type, fallback = []) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    apiGet(`/api/crm/${type}`)
      .then((data) => {
        if (!alive) return;
        const records = Array.isArray(data) ? data : (data.records || []);
        console.log(`[useCrmRecords] Fetched ${type}:`, records.length, "records", records);
        // Always sync the cache to the server's response, even when empty,
        // so stale demo/offline records don't linger after the database changes.
        storeSet(type, records);
        setRecords(records);
        setError("");
      })
      .catch((err) => {
        if (!alive) return;
        console.error(`[useCrmRecords] Error fetching ${type}:`, err);
        setError(err.message || "Failed to fetch records");
        // Fallback to localStorage only if API fails
        const cached = storeGet(type);
        console.log(`[useCrmRecords] Falling back to localStorage for ${type}:`, cached.length, "cached records");
        setRecords(cached.length ? cached : fallback);
      })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [type, fallback]);

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
      } catch (err) {
        console.error(`Failed to persist ${type} record to the database:`, err);
        setError(err.message || `Failed to save ${type}.`);
      }

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
      } catch (err) {
        console.error(`Failed to delete ${type} record from the database:`, err);
        setError(err.message || `Failed to delete ${type}.`);
      }
    },

    setRecords,
  }), [type]);

  return { records, loading, error, ...actions };
}
