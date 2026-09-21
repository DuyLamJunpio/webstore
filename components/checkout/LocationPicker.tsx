"use client";

import { useEffect, useId, useMemo, useState } from "react";

type Location = { code: number; name: string };

type LocationsResponse = {
  provinces?: Location[];
  wards?: Location[];
  error?: string;
};

type Props = {
  city: string;
  ward: string;
  cityError?: string;
  wardError?: string;
  onChange: (field: "city" | "ward", value: string) => void;
};

const normalise = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLocaleLowerCase("vi")
    .trim();

const matches = (items: Location[], query: string) => {
  const needle = normalise(query);
  return needle ? items.filter((item) => normalise(item.name).includes(needle)) : items;
};

function SearchSelect({
  label,
  value,
  error,
  hint,
  options,
  loading,
  disabled,
  placeholder,
  autoComplete,
  onChange,
  onSelect,
}: {
  label: string;
  value: string;
  error?: string;
  hint?: string;
  options: Location[];
  loading: boolean;
  disabled?: boolean;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
  onSelect: (location: Location) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const visible = useMemo(() => matches(options, value).slice(0, 100), [options, value]);
  const message = error ?? hint;

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-2 block text-xs sm:text-[13px] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-expanded={disabled ? undefined : open}
        aria-controls={`${id}-options`}
        role="combobox"
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onChange={(event) => {
          setOpen(true);
          onChange(event.target.value);
        }}
        className={`h-12 w-full rounded-card border bg-surface px-4 text-sm sm:text-[15px] outline-none transition-colors placeholder:text-muted/60 focus:border-ink disabled:cursor-not-allowed disabled:bg-cream-dark/40 disabled:text-muted ${
          error ? "border-gold-deep" : "border-line-strong"
        }`}
      />

      {!disabled && open && (
        <div
          id={`${id}-options`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-line-strong bg-surface p-1 shadow-lg"
        >
          {loading ? (
            <p className="px-3 py-2.5 text-xs text-muted">Đang tải danh sách…</p>
          ) : visible.length > 0 ? (
            visible.map((option) => (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={option.name === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                className="block w-full rounded-md px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-cream-dark/60"
              >
                {option.name}
              </button>
            ))
          ) : (
            <p className="px-3 py-2.5 text-xs text-muted">Không tìm thấy kết quả phù hợp.</p>
          )}
        </div>
      )}

      <p className={`mt-1.5 min-h-4 text-xs ${error ? "font-medium text-gold-deep" : "text-muted"}`}>
        {message}
      </p>
    </div>
  );
}

/** Chọn tỉnh/thành rồi mới tải phường/xã tương ứng từ API địa giới sau sáp nhập. */
export default function LocationPicker({ city, ward, cityError, wardError, onChange }: Props) {
  const [initialCity] = useState(city);
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [wards, setWards] = useState<Location[]>([]);
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [loadedWardProvince, setLoadedWardProvince] = useState<number | null>(null);
  const [cityQuery, setCityQuery] = useState(city);
  const [wardQuery, setWardQuery] = useState(ward);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [provinceProblem, setProvinceProblem] = useState("");
  const [wardProblem, setWardProblem] = useState("");
  const loadingWards = provinceCode !== null && loadedWardProvince !== provinceCode && !wardProblem;

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/locations")
      .then(async (response) => ({ response, data: (await response.json()) as LocationsResponse }))
      .then(({ response, data }) => {
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data.provinces)) {
          setProvinceProblem(data.error ?? "Không tải được danh sách tỉnh/thành phố. Bạn vẫn có thể nhập tay.");
          return;
        }

        setProvinces(data.provinces);
        const restored = data.provinces.find((province) => normalise(province.name) === normalise(initialCity));
        if (restored) setProvinceCode(restored.code);
      })
      .catch(() => {
        if (!cancelled) setProvinceProblem("Không tải được danh sách tỉnh/thành phố. Bạn vẫn có thể nhập tay.");
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });

    return () => { cancelled = true; };
  }, [initialCity]);

  useEffect(() => {
    if (provinceCode === null) {
      return;
    }

    let cancelled = false;

    void fetch(`/api/locations?province=${provinceCode}`)
      .then(async (response) => ({ response, data: (await response.json()) as LocationsResponse }))
      .then(({ response, data }) => {
        if (cancelled) return;
        if (!response.ok || !Array.isArray(data.wards)) {
          setWardProblem(data.error ?? "Không tải được danh sách phường/xã. Bạn vẫn có thể nhập tay.");
          return;
        }

        setWards(data.wards);
        setLoadedWardProvince(provinceCode);
      })
      .catch(() => {
        if (!cancelled) setWardProblem("Không tải được danh sách phường/xã. Bạn vẫn có thể nhập tay.");
      })
    return () => { cancelled = true; };
  }, [provinceCode]);

  const chooseProvince = (province: Location) => {
    setProvinceCode(province.code);
    setLoadedWardProvince(null);
    setWards([]);
    setWardProblem("");
    setCityQuery(province.name);
    setWardQuery("");
    onChange("city", province.name);
    onChange("ward", "");
  };

  return (
    <>
      <SearchSelect
        label="Tỉnh / Thành phố"
        value={cityQuery}
        error={cityError}
        hint={provinceProblem || "Gõ để tìm nhanh rồi chọn tỉnh/thành phố."}
        options={provinces}
        loading={loadingProvinces}
        placeholder="Tìm tỉnh / thành phố"
        autoComplete="address-level1"
        onChange={(value) => {
          setCityQuery(value);
          setProvinceCode(null);
          setLoadedWardProvince(null);
          setWards([]);
          setWardProblem("");
          setWardQuery("");
          onChange("city", value);
          onChange("ward", "");
        }}
        onSelect={chooseProvince}
      />
      <SearchSelect
        label="Phường / Xã"
        value={wardQuery}
        error={wardError}
        hint={
          wardProblem ||
          (provinceCode === null ? "Chọn tỉnh/thành phố trước để xem phường/xã." : "Gõ để tìm nhanh phường/xã.")
        }
        options={wards}
        loading={loadingWards}
        disabled={provinceCode === null && !provinceProblem}
        placeholder="Tìm phường / xã"
        autoComplete="address-level2"
        onChange={(value) => {
          setWardQuery(value);
          onChange("ward", value);
        }}
        onSelect={(location) => {
          setWardQuery(location.name);
          onChange("ward", location.name);
        }}
      />
    </>
  );
}
