"use client";

import { useState } from "react";
import type { BrandBrainFieldDto, BrandBrainSection } from "@kairo/contracts";
import { saveBrandBrainFieldAction } from "../brand-brain-control/actions";
import { fieldEvidenceLabel, fieldStateLabel } from "../../../../src/lib/brand-brain-view-model";

type Definition = {
  key: string;
  label: string;
  hint: string;
};

export function InlineBrandField({
  brandId,
  section,
  definition,
  field,
}: {
  brandId: string;
  section: BrandBrainSection;
  definition: Definition;
  field?: BrandBrainFieldDto;
}) {
  const [editing, setEditing] = useState(false);
  const state = field?.state ?? "unset";
  const action = saveBrandBrainFieldAction.bind(null, brandId, definition.key, section);

  if (editing) {
    return (
      <form className="brand-inline-field editing" action={action}>
        <div className="brand-inline-field-heading">
          <div>
            <label htmlFor={`brand-field-${definition.key}`}>{definition.label}</label>
            <p>{definition.hint}</p>
          </div>
          <span className={`brand-field-state ${state}`}>{fieldStateLabel(field)}</span>
        </div>
        <textarea
          id={`brand-field-${definition.key}`}
          name="value"
          rows={field?.value && field.value.length > 180 ? 5 : 3}
          maxLength={10000}
          required
          autoFocus
          defaultValue={field?.value ?? ""}
          placeholder="Not set yet"
        />
        {field ? <input type="hidden" name="expectedVersion" value={field.version} /> : null}
        <div className="brand-inline-edit-footer">
          <span>{fieldEvidenceLabel(field)}</span>
          <div>
            <button className="tertiary-button" type="button" onClick={() => setEditing(false)}>Cancel</button>
            <button className={field?.state === "inferred" ? "primary-button" : "secondary-button"} type="submit">
              {field?.state === "inferred" ? "Confirm & save" : "Save"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <button
      className="brand-inline-field value"
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`Edit ${definition.label}`}
    >
      <span className="brand-inline-field-heading">
        <span>
          <strong>{definition.label}</strong>
          <small>{definition.hint}</small>
        </span>
        <span className={`brand-field-state ${state}`}>{fieldStateLabel(field)}</span>
      </span>
      <span className={`brand-inline-value ${field?.value ? "" : "empty"}`}>{field?.value ?? "Not set"}</span>
      <span className="brand-inline-meta">
        <span>{fieldEvidenceLabel(field)}</span>
        <span className="brand-edit-cue">Edit</span>
      </span>
    </button>
  );
}
