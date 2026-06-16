import React from "react";

function PackageForm({ values, onChange, onSubmit, onCancel, submitting, editing }) {
  return (
    <form className="admin-package-form" onSubmit={onSubmit}>
      <input
        value={values.name}
        onChange={(event) => onChange("name", event.target.value)}
        placeholder="Package name"
        autoComplete="off"
      />
      <textarea
        value={values.description}
        onChange={(event) => onChange("description", event.target.value)}
        placeholder="Package description"
      />
      <input
        value={values.price}
        onChange={(event) => onChange("price", event.target.value)}
        placeholder="Price"
        inputMode="decimal"
      />
      <input
        value={values.currency}
        onChange={(event) => onChange("currency", event.target.value)}
        placeholder="Currency"
        maxLength={3}
      />
      <input
        value={values.duration}
        onChange={(event) => onChange("duration", event.target.value)}
        placeholder="Duration"
      />
      <textarea
        value={values.features}
        onChange={(event) => onChange("features", event.target.value)}
        placeholder="Features, one per line"
      />
      <label>
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => onChange("isActive", event.target.checked)}
        />
        Active
      </label>
      <div className="admin-package-form__actions">
        <button type="submit" disabled={submitting}>
          {editing ? "Update Package" : "Create Package"}
        </button>
        {editing ? (
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export { PackageForm };
