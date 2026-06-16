import React, { useEffect, useState } from "react";
import { createPackageApi } from "./packageApi.js";
import { PackageForm } from "./PackageForm.jsx";
import { PackageTable } from "./PackageTable.jsx";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  currency: "",
  duration: "",
  features: "",
  isActive: true,
};

function AdminPackageManagementPage() {
  const api = createPackageApi();
  const [packages, setPackages] = useState([]);
  const [formValues, setFormValues] = useState(emptyForm);
  const [editingPackage, setEditingPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadPackages() {
    setLoading(true);
    setError("");

    try {
      const response = await api.list();
      setPackages(response.items ?? []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load packages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPackages();
  }, []);

  function updateFormField(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function startEditing(packageItem) {
    setEditingPackage(packageItem);
    setFormValues({
      name: packageItem.name ?? "",
      description: packageItem.description ?? "",
      price: String(packageItem.price ?? ""),
      currency: packageItem.currency ?? "",
      duration: String(packageItem.duration ?? ""),
      features: Array.isArray(packageItem.features) ? packageItem.features.join("\n") : "",
      isActive: packageItem.isActive ?? true,
    });
  }

  function resetForm() {
    setEditingPackage(null);
    setFormValues(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: formValues.name,
      description: formValues.description,
      price: formValues.price,
      currency: formValues.currency,
      duration: Number.isNaN(Number(formValues.duration)) ? formValues.duration : Number(formValues.duration),
      features: formValues.features
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
      isActive: formValues.isActive,
    };

    try {
      if (editingPackage) {
        const updatedPackage = await api.update(editingPackage.id, payload);
        setPackages((currentPackages) =>
          currentPackages.map((packageItem) => (packageItem.id === editingPackage.id ? updatedPackage : packageItem))
        );
      } else {
        const createdPackage = await api.create(payload);
        setPackages((currentPackages) => [createdPackage, ...currentPackages]);
      }

      resetForm();
    } catch (submissionError) {
      setError(submissionError.message || "Unable to save package.");
    } finally {
      setSaving(false);
    }
  }

  async function disablePackage(packageItem) {
    setSaving(true);
    setError("");

    try {
      const disabledPackage = await api.remove(packageItem.id);
      setPackages((currentPackages) =>
        currentPackages.map((currentPackage) => (currentPackage.id === packageItem.id ? disabledPackage : currentPackage))
      );
      if (editingPackage?.id === packageItem.id) {
        resetForm();
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to disable package.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-package-management">
      <header>
        <h2>Package Management</h2>
        <p>Create, update, view, and disable admin packages.</p>
      </header>
      {error ? <p role="alert">{error}</p> : null}
      <PackageForm
        values={formValues}
        onChange={updateFormField}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        submitting={saving}
        editing={Boolean(editingPackage)}
      />
      {loading ? <p>Loading packages...</p> : <PackageTable packages={packages} onEdit={startEditing} onDisable={disablePackage} />}
    </section>
  );
}

export { AdminPackageManagementPage };
