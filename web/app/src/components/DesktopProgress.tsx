import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Download,
  X,
} from 'lucide-react';
import LogLine from './terminal/LogLine';
import EmePhaseCaption from './EmePhaseCaption';
import { ProgressRing } from '../assets/icons/ProgressRing';
import { useAppStore } from '../store/useAppStore';
import { formatSize } from '../lib/utils';

interface StatusLabelArgs {
  error: string;
  done: boolean;
  isPickerOpen: boolean;
  emePhase: 'download' | 'mux' | null;
  status: string;
  selectedFormat: string;
}

const statusLabel = ({
  error,
  done,
  isPickerOpen,
  emePhase,
  status,
  selectedFormat,
}: StatusLabelArgs) => {
  if (error) return 'Something went wrong';
  if (done) return 'Done';
  if (isPickerOpen) return 'Choose a format';
  if (emePhase) return 'Preparing on your device';
  switch (status) {
    case 'fetching_info':
      return `Analyzing ${selectedFormat === 'mp4' ? 'video' : 'audio'}`;
    case 'initializing':
      return 'Getting ready';
    case 'downloading':
      return 'Downloading';
    case 'merging':
      return 'Finishing up';
    case 'sending':
      return 'Sending to device';
    default:
      return 'Working on it';
  }
};

interface DesktopProgressProps {
  onCancel?: () => void;
}

interface LogData {
  id: string;
  timestamp: string;
  type: string;
  text: string;
}

const DesktopProgress = ({ onCancel }: DesktopProgressProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const loading = useAppStore((state) => state.loading);
  const progress = useAppStore((state) => state.progress);
  const status = useAppStore((state) => state.status);
  const subStatus = useAppStore((state) => state.subStatus);
  const videoTitle = useAppStore((state) => state.videoTitle);
  const desktopLogs = useAppStore((state) => state.desktopLogs) ?? [];
  const selectedFormat = useAppStore((state) => state.selectedFormat);
  const error = useAppStore((state) => state.error);
  const isPickerOpen = useAppStore((state) => state.isPickerOpen);
  const emePhase = useAppStore((state) => state.emePhase);
  const emeProgress = useAppStore((state) => state.emeProgress);
  const emeBytes = useAppStore((state) => state.emeBytes);
  const logRef = useRef<HTMLDivElement>(null);

  const humanize = useCallback((text: string) => {
    if (!text) return '';
    if (text.includes('ISRC_IDENTIFIED:')) {
      const isrc = text.split('ISRC_IDENTIFIED:')[1].trim();
      return `FINGERPRINT: ${isrc}`;
    }

    let cleaned = text
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase())
      .trim();

    cleaned = cleaned
      .replace(/Api/gi, 'API')
      .replace(/Isrc/gi, 'ISRC')
      .replace(/Tls/gi, 'TLS')
      .replace(/Sse/gi, 'SSE')
      .replace(/Youtube/gi, 'YouTube')
      .replace(/Spotify/gi, 'Spotify')
      .replace(/\bId\b/gi, 'ID')
      .replace(/\bAi\b/gi, 'AI')
      .replace(/Cdn/gi, 'CDN')
      .replace(/Dns/gi, 'DNS')
      .replace(/Muxer/gi, 'MUXER')
      .replace(/Http/gi, 'HTTP');

    return cleaned;
  }, []);

  const displayLogs: LogData[] = useMemo(() => {
    return (desktopLogs || [])
      .map((log, index) => {
        if (typeof log !== 'string')
          return { id: `log-${index}`, text: '', timestamp: '', type: 'info' };

        const match = log.match(/^(\[[\d:.]+\])\s*(.*)/);
        const rawText = match ? match[2] : log;
        const timestamp = match ? match[1] : '';
        const withoutPrefix = rawText.replace(/^[A-Za-z0-9_\-\s]+:\s*/, '');
        const text = humanize(withoutPrefix);

        return {
          id: `${timestamp}-${rawText.substring(0, 20)}-${index}`,
          text,
          timestamp,
          type: log.includes('SYSTEM_ALERT') ? 'error' : 'info',
        };
      })
      .filter((item) => item.text);
  }, [desktopLogs, humanize]);

  useEffect(() => {
    if (showDetails && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [displayLogs, showDetails]);

  const done = status === 'completed' && !loading;
  const isVisible = Boolean(
    status !== 'idle' || loading || error || isPickerOpen
  );

  const label = statusLabel({
    error,
    done,
    isPickerOpen,
    emePhase,
    status,
    selectedFormat,
  });
  const pct = Math.min(100, Math.max(0, progress || 0));

  return (
    <div className="hidden xl:block fixed bottom-6 left-6 z-[2000000]">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-label={`${label} — ${Math.floor(pct)}%. Show progress details`}
              className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/40 bg-[#080d18]/90 shadow-[0_12px_30px_-10px_rgba(6,182,212,0.6)] backdrop-blur-xl transition-colors hover:border-cyan-300/70"
            >
              <ProgressRing
                pct={pct}
                done={done}
                hasError={Boolean(error)}
                emePhase={Boolean(emePhase)}
              />
              {error ? (
                <AlertCircle size={20} className="text-red-300" />
              ) : done ? (
                <Check size={22} className="text-cyan-200" />
              ) : (
                <Download size={19} className="text-cyan-200" />
              )}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute bottom-[68px] left-0 w-[340px] rounded-[24px] border border-cyan-400/20 bg-[#080d18]/95 p-5 shadow-[0_24px_60px_-20px_rgba(6,182,212,0.35)] backdrop-blur-2xl"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold ${error ? 'text-red-300' : 'text-white/85'}`}
                    >
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      aria-label="Close progress details"
                      className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {!isPickerOpen && emePhase === null && (
                    <>
                      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-cyan-200/70">
                        <span>{Math.floor(pct)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </>
                  )}

                  {emePhase && (
                    <div className="mb-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] text-purple-200/90">
                          On-device {emePhase === 'mux' ? 'muxing' : 'download'}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-purple-200">
                            {Math.floor(emeProgress || 0)}%
                          </span>
                          {onCancel && (
                            <button
                              type="button"
                              onClick={onCancel}
                              aria-label="Cancel on-device processing"
                              className="rounded-md p-0.5 text-purple-200/60 hover:bg-red-400/10 hover:text-red-300"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-400"
                          style={{ width: `${emeProgress || 0}%` }}
                        />
                      </div>
                      {emePhase === 'download' &&
                        emeBytes &&
                        emeBytes.total > 0 && (
                          <div className="mt-1.5 font-mono text-[10px] text-purple-200/60">
                            {formatSize(emeBytes.received)} /{' '}
                            {formatSize(emeBytes.total)}
                          </div>
                        )}
                      <EmePhaseCaption phase={emePhase} progress={emeProgress} />
                    </div>
                  )}

                  {subStatus && !emePhase && (
                    <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                      {subStatus}
                    </p>
                  )}

                  {videoTitle && (
                    <p className="mt-3 truncate border-t border-white/10 pt-3 text-[11px] text-white/60">
                      {videoTitle}
                    </p>
                  )}

                  {displayLogs.length > 0 && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowDetails((value) => !value)}
                        aria-expanded={showDetails}
                        className="flex w-full items-center justify-between text-[11px] text-white/45 transition-colors hover:text-white/70"
                      >
                        Details
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {showDetails && (
                        <div
                          ref={logRef}
                          className="mt-2 max-h-40 overflow-y-auto font-mono scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20"
                        >
                          {displayLogs.map((log) => (
                            <LogLine key={log.id} log={log} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesktopProgress;
