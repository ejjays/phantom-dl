import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, Monitor, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import LogLine from './LogLine';
import EmePhaseCaption from '../EmePhaseCaption';
import { formatSize } from '../../lib/utils';

interface LogData {
  id?: string;
  timestamp: string;
  type: string;
  text: string;
}

interface TerminalViewProps {
  isVisible: boolean;
  progress: number;
  statusText?: string;
  displayLogs: LogData[];
  showSuccess?: boolean;
  getTimestamp: () => string;
  scrollRef: React.RefObject<HTMLDivElement>;
  handleScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  error?: string;
  isPickerOpen?: boolean;
  emePhase?: 'download' | 'mux' | null;
  emeProgress?: number;
  emeBytes?: { received: number; total: number } | null;
  onCancel?: () => void;
}

const TerminalWindowDecorations = () => (
  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 shrink-0 relative z-20">
    <div className="flex gap-1.5">
      <div className="w-2 h-2 rounded-full bg-red-400/60" />
      <div className="w-2 h-2 rounded-full bg-amber-400/60" />
      <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
    </div>
    <div className="flex-1 flex items-center justify-center gap-2">
      <Monitor size={12} className="text-cyan-300/70" />
      <span className="text-[11px] font-mono font-medium text-cyan-200/80 tracking-wide">
        phantom / live
      </span>
    </div>
    <div className="w-12" />
  </div>
);

const MonitorContent = ({ progress }: { progress: number }) => (
  <div className="relative z-20 mb-5 shrink-0">
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-2">
        <Terminal size={15} className="text-cyan-300/80" />
        <span className="text-xs font-medium text-white/70">
          Download progress
        </span>
      </div>
      <span className="font-mono text-lg font-semibold text-cyan-300">
        {String(Math.floor(progress || 0))}%
      </span>
    </div>
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
        initial={{ width: 0 }}
        animate={{ width: `${progress || 0}%` }}
        transition={{
          type: 'spring',
          stiffness: 40,
          damping: 15,
          mass: 0.5,
        }}
      />
    </div>
  </div>
);

const EmeMonitorBar = ({
  progress,
  phase,
  onCancel,
}: {
  progress: number;
  phase: 'download' | 'mux';
  onCancel?: () => void;
}) => (
  <div className="relative z-20 mb-5 shrink-0 -mt-1">
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[11px] font-medium text-purple-200/90">
        On-device {phase === 'mux' ? 'muxing' : 'download'}
      </span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-purple-200">
          {String(Math.floor(progress || 0))}%
        </span>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Abort on-device processing"
            className="rounded-lg p-1 text-purple-200/60 hover:bg-red-400/10 hover:text-red-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </span>
    </div>
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
        initial={{ width: 0 }}
        animate={{ width: `${progress || 0}%` }}
        transition={{ type: 'spring', stiffness: 40, damping: 15, mass: 0.5 }}
      />
    </div>
    <EmePhaseCaption phase={phase} progress={progress} />
  </div>
);

const StatusArea = ({
  statusText,
  error,
}: {
  statusText?: string;
  error?: string;
}) => (
  <div className="mb-5 shrink-0">
    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 mb-2">
      Current step
    </div>
    <div
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] font-medium ${
        error
          ? 'bg-red-400/10 text-red-300'
          : 'bg-cyan-400/10 text-cyan-100'
      }`}
    >
      {statusText}
    </div>
  </div>
);

const TechnicalHeader = () => (
  <div className="flex items-center gap-2 mb-3 shrink-0 relative z-20">
    <Activity size={13} className="text-cyan-300/60" />
    <span className="text-[11px] font-medium text-white/50">Activity</span>
  </div>
);

const TerminalFooter = () => (
  <div className="mt-4 pt-3 border-t border-white/10 shrink-0 flex items-center justify-between">
    <span className="font-mono text-[10px] tracking-widest text-white/30">
      PHANTOM
    </span>
    <span className="flex items-center gap-1.5 text-[10px] text-white/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
      live
    </span>
  </div>
);

const TerminalWindow = ({
  children,
  isPickerOpen,
}: {
  children: React.ReactNode;
  isPickerOpen: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -50 }}
    animate={{
      opacity: 1,
      x: isPickerOpen ? 'calc(25vw - 140px - 50%)' : 0,
      scale: isPickerOpen ? 0.85 : 1,
      originX: 0.5,
      originY: 0.5,
    }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    style={{ left: isPickerOpen ? '0' : '1.5rem' }}
    className="hidden xl:flex fixed top-0 bottom-0 w-[clamp(320px,calc(50vw_-_320px),420px)] z-[2000000] flex-col justify-center pt-6 pointer-events-none"
  >
    <div className="h-[70vh] max-h-[88vh] relative bg-[#080d18]/85 border border-cyan-400/20 rounded-[28px] shadow-[0_24px_60px_-20px_rgba(6,182,212,0.3)] backdrop-blur-2xl overflow-hidden flex flex-col pointer-events-auto">
      <TerminalWindowDecorations />
      {children}
    </div>
  </motion.div>
);

const useRevealQueue = (total: number, intervalMs: number): number => {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    if (revealed > total) {
      setRevealed(total);
      return undefined;
    }
    if (revealed >= total) return undefined;
    const timer = setTimeout(
      () => setRevealed((prev) => Math.min(prev + 1, total)),
      intervalMs
    );
    return () => clearTimeout(timer);
  }, [revealed, total, intervalMs]);
  return revealed;
};

const LogStream = ({ displayLogs }: { displayLogs: LogData[] }) => {
  const revealed = useRevealQueue(displayLogs.length, 140);
  return (
    <div className="flex flex-col gap-1.5">
      {displayLogs.slice(0, revealed).map((log) => (
        <LogLine key={log.id || `${log.timestamp}-${log.text}`} log={log} />
      ))}
    </div>
  );
};

const LogDisplay = ({
  showSuccess,
  displayLogs,
  scrollRef,
  handleScroll,
}: {
  showSuccess: boolean;
  displayLogs: LogData[];
  scrollRef: React.RefObject<HTMLDivElement>;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}) => (
  <div
    ref={scrollRef}
    onScroll={handleScroll}
    className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-1.5 font-mono scroll-smooth relative z-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/20 hover:scrollbar-thumb-cyan-500/40"
  >
    {showSuccess ? (
      <motion.div
        key="success-view"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1.5"
      >
        <LogLine
          log={{
            timestamp: '',
            text: 'Saved to your device',
            type: 'success',
          }}
          isTyping={false}
        />
        <LogLine
          log={{
            timestamp: '',
            text: 'Your file is ready. Check your downloads.',
            type: 'info',
          }}
          isTyping
        />
      </motion.div>
    ) : (
      <LogStream displayLogs={displayLogs} />
    )}
    {!showSuccess && displayLogs.length === 0 && (
      <div className="text-[11px] text-white/35 tracking-wide">
        Waiting for your link...
      </div>
    )}
  </div>
);

const TerminalView = ({
  isVisible,
  progress,
  statusText,
  displayLogs,
  showSuccess,
  scrollRef,
  handleScroll,
  error,
  isPickerOpen,
  emePhase,
  emeProgress,
  emeBytes,
  onCancel,
}: TerminalViewProps) => {
  const terminalContent = (
    <AnimatePresence>
      {isVisible && (
        <TerminalWindow isPickerOpen={!!isPickerOpen}>
          <div className="flex-1 min-h-0 p-6 flex flex-col overflow-hidden relative">
            <MonitorContent progress={progress} />
            {emePhase != null && (
              <EmeMonitorBar
                progress={emeProgress ?? 0}
                phase={emePhase}
                onCancel={onCancel}
              />
            )}
            {emePhase === 'download' && emeBytes && emeBytes.total > 0 && (
              <div className="relative z-20 -mt-3 mb-5 shrink-0 font-mono text-[11px] text-purple-200/70">
                {formatSize(emeBytes.received)} / {formatSize(emeBytes.total)}
              </div>
            )}
            <StatusArea statusText={statusText} error={error} />
            <div className="flex-1 min-h-0 flex flex-col relative">
              <TechnicalHeader />
              <LogDisplay
                showSuccess={!!showSuccess}
                displayLogs={displayLogs}
                scrollRef={scrollRef}
                handleScroll={handleScroll || (() => {})}
              />
            </div>
            <TerminalFooter />
          </div>
        </TerminalWindow>
      )}
    </AnimatePresence>
  );

  return createPortal(terminalContent, document.body);
};

export default TerminalView;
