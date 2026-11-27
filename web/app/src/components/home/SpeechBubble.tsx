import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TYPE_MS = 42;
const QUIP_TYPE_MS = 20;
const HOLD_MS = 6500;
const FULL_HOLD_MS = 2500;
const QUIP_HOLD_MS = 8000;
const FIRST_KEY_MS = 350;
const LINE_GAP_MS = 200;
const FADE_MS = 400;

type Props = {
  message: string;
  followUp?: string;
  quick?: boolean;
  visible?: boolean;
  onDone: () => void;
};

export default function SpeechBubble({
  message,
  followUp,
  quick = false,
  visible = true,
  onDone,
}: Props) {
  const [text, setText] = useState('');
  const [holding, setHolding] = useState(false);
  const [fading, setFading] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    const lines = followUp ? [message, followUp] : [message];
    const speed = quick ? QUIP_TYPE_MS : TYPE_MS;
    const timers: number[] = [];
    let cancelled = false;
    let lineIndex = 0;
    let charIndex = 0;

    const typeNext = () => {
      if (cancelled) return;
      charIndex += 1;
      setText(lines[lineIndex].slice(0, charIndex));
      if (charIndex < lines[lineIndex].length) {
        timers.push(window.setTimeout(typeNext, speed));
        return;
      }
      setHolding(true);
      const isFirstOfTwo = lines.length > 1 && lineIndex === 0;
      const hold = isFirstOfTwo
        ? FULL_HOLD_MS
        : quick
          ? QUIP_HOLD_MS
          : HOLD_MS;
      timers.push(
        window.setTimeout(() => {
          setHolding(false);
          if (lineIndex < lines.length - 1) {
            lineIndex += 1;
            charIndex = 0;
            timers.push(window.setTimeout(typeNext, LINE_GAP_MS));
            return;
          }
          setFading(true);
          timers.push(window.setTimeout(onDone, FADE_MS * 2));
        }, hold)
      );
    };

    setText('');
    setHolding(false);
    setFading(false);
    timers.push(window.setTimeout(typeNext, FIRST_KEY_MS));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [message, followUp, quick, onDone]);

  useEffect(() => {
    const id = window.setInterval(() => setCursorOn((on) => !on), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      data-testid="speech-bubble"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 flex -translate-x-1/2 flex-col items-center"
      style={{ marginBottom: -14 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: visible && !fading ? 1 : 0, y: 0 }}
        transition={{ duration: fading ? FADE_MS / 1000 : 0.3 }}
        className="flex flex-col items-center"
      >
        <div
          className="max-w-[240px] rounded-2xl border px-3.5 py-2 text-center font-mono text-xs leading-5 font-medium text-cyan-100"
          style={{
            borderColor: 'rgba(34, 211, 238, 0.25)',
            backgroundColor: 'rgba(14, 26, 46, 0.9)',
          }}
        >
          {text}
          {holding ? '...' : ''}
          <span style={{ color: cursorOn ? undefined : 'transparent' }}>|</span>
        </div>
        <div
          style={{
            width: 10,
            height: 10,
            marginTop: -5,
            backgroundColor: 'rgba(14, 26, 46, 0.9)',
            borderRight: '1px solid rgba(34, 211, 238, 0.25)',
            borderBottom: '1px solid rgba(34, 211, 238, 0.25)',
            transform: 'rotate(45deg)',
          }}
        />
      </motion.div>
    </div>
  );
}
