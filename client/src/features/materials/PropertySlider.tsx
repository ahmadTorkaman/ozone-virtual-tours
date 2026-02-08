interface PropertySliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

export function PropertySlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: PropertySliderProps) {
  const precision = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  const displayValue = value.toFixed(precision);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-txt-secondary">{label}</label>
        <span className="text-xs text-txt-primary font-mono">
          {displayValue}
          {unit && <span className="text-txt-tertiary ml-0.5">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-[3px] bg-hovr rounded-full appearance-none cursor-pointer accent-accent"
      />
    </div>
  );
}
