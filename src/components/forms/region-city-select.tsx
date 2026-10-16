"use client";

import { useState } from "react";
import { Select, Field } from "@/components/ui/fields";
import { SAUDI_CITIES, SAUDI_REGIONS } from "@/lib/constants";

export function RegionCitySelect({
  defaultRegion,
  defaultCity,
  regionError,
  cityError,
}: {
  defaultRegion?: string;
  defaultCity?: string;
  regionError?: string[];
  cityError?: string[];
}) {
  const [region, setRegion] = useState(defaultRegion ?? "");
  const cities = SAUDI_CITIES.filter((c) => !region || c.region === region);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="المنطقة" error={regionError}>
        <Select
          name="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          required
        >
          <option value="">اختر المنطقة</option>
          {SAUDI_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="المدينة" error={cityError}>
        <Select name="city" defaultValue={defaultCity ?? ""} required>
          <option value="">اختر المدينة</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
