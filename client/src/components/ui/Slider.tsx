import { type InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  showValue = true,
  className = '',
  ...props
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-txt-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs text-txt-tertiary font-mono tabular-nums">
              {Number.isInteger(step) ? value : value.toFixed(2)}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-slider"
        style={{
          background: `linear-gradient(to right, var(--accent) ${percent}%, var(--bg-hover) ${percent}%)`,
        }}
        {...props}
      />
    </div>
  );
}
