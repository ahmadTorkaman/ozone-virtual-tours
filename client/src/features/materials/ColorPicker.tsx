import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#ffffff', // White
  '#000000', // Black
  '#808080', // Gray
  '#c0c0c0', // Silver
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ffa500', // Orange
  '#800080', // Purple
  '#8b4513', // Brown
  '#228b22', // Forest Green
  '#4169e1', // Royal Blue
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value);
    }
  };

  const handlePresetClick = (color: string) => {
    onChange(color);
    setInputValue(color);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs text-txt-secondary mb-2">{label}</label>
      )}

      <div className="flex items-center gap-2">
        {/* Color swatch button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded border border-border hover:border-border-focus transition-colors flex-shrink-0"
          style={{ backgroundColor: value }}
          title="Click to pick color"
        />

        {/* Hex input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          className="flex-1 bg-raised text-txt-primary px-2.5 py-2 rounded font-mono text-xs border border-border-subtle focus:outline-none focus:border-border-focus transition-colors"
          placeholder="#ffffff"
        />
      </div>

      {/* Dropdown picker */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-overlay rounded-lg p-3 shadow-xl z-50 min-w-[240px] border border-border">
          {/* Preset colors grid */}
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                  value.toLowerCase() === color.toLowerCase()
                    ? 'border-accent'
                    : 'border-border hover:border-txt-tertiary'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Native color picker */}
          <div className="border-t border-border pt-3">
            <label className="block text-[10px] text-txt-tertiary mb-1">Custom Color</label>
            <input
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setInputValue(e.target.value);
              }}
              className="w-full h-8 rounded cursor-pointer bg-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
