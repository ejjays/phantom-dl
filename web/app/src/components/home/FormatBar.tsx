import type { ReactNode } from 'react';
import AutoIcon from '../../assets/icons/AutoIcon';
import MusicIcon from '../../assets/icons/MusicIcon';
import PasteIcon from '../../assets/icons/PasteIcon';

export type DownloadMode = 'mp4' | 'mp3';

type CellProps = {
  active?: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

function Cell({ active, label, icon, onClick }: CellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative flex flex-1 cursor-pointer items-center justify-center py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          }}
        />
      ) : null}
      <span className="relative z-10 flex items-center">
        {icon}
        <span
          className={`ml-1.5 font-mono text-sm font-bold ${
            active ? 'text-white' : 'text-black'
          }`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

type Props = {
  mode: DownloadMode;
  onChange: (mode: DownloadMode) => void;
  onPaste: () => void;
};

export default function FormatBar({ mode, onChange, onPaste }: Props) {
  return (
    <div className="mt-3 flex w-full overflow-hidden rounded-2xl border border-cyan-400/50 bg-cyan-500 shadow-[0_4px_12px_rgba(6,182,212,0.3)]">
      <Cell
        active={mode === 'mp4'}
        label="Auto"
        icon={<AutoIcon size={26} />}
        onClick={() => onChange('mp4')}
      />
      <span className="w-px self-stretch bg-white/30" />
      <Cell
        active={mode === 'mp3'}
        label="Audio"
        icon={<MusicIcon size={22} />}
        onClick={() => onChange('mp3')}
      />
      <span className="w-px self-stretch bg-white/30" />
      <Cell
        label="Paste"
        icon={<PasteIcon size={22} />}
        onClick={onPaste}
      />
    </div>
  );
}
