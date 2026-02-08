import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { getAssetUrl } from '@/lib/tauri-file';
import { getSettings } from '@/services/tauri';
import { useEffect, useState } from 'react';

interface TextureUploadProps {
  label: string;
  value?: string | null;
  onImport: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function TextureUpload({
  label,
  value,
  onImport,
  onClear,
  disabled = false,
}: TextureUploadProps) {
  const [dataPath, setDataPath] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    getSettings().then((settings) => {
      setDataPath(settings.data_path);
    });
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [value]);

  const textureUrl = value && dataPath
    ? getAssetUrl(`${dataPath}/materials/textures/${value}`)
    : null;

  return (
    <div>
      <label className="block text-xs text-txt-secondary mb-1.5">{label}</label>

      {textureUrl && !imageError ? (
        <div className="relative group rounded-lg overflow-hidden bg-raised border border-border-subtle">
          <img
            src={textureUrl}
            alt={label}
            className="w-full h-20 object-cover"
            onError={() => setImageError(true)}
          />
          {/* Clear button overlay */}
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="absolute top-1.5 right-1.5 p-1 bg-red-500/80 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Remove texture"
          >
            <X size={12} className="text-white" />
          </button>
          {/* Filename */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
            <p className="text-[10px] text-white/70 truncate" title={value || ''}>
              {value?.split('/').pop()}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onImport}
          disabled={disabled}
          className="w-full h-20 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-txt-tertiary hover:border-border-focus hover:text-txt-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <>
              <ImageIcon size={20} className="mb-1" />
              <span className="text-[10px]">Save first to add textures</span>
            </>
          ) : (
            <>
              <Upload size={20} className="mb-1" />
              <span className="text-[10px]">Import Texture</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
