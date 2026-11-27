import { useEffect } from 'react';

export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;

    const apply = () => {
      const height = vv?.height ?? window.innerHeight;
      const overlap = Math.max(
        0,
        window.innerHeight - height - (vv?.offsetTop ?? 0)
      );
      root.style.setProperty('--app-h', `${height}px`);
      root.style.setProperty('--kb-ratio', String(Math.min(1, overlap / 400)));
    };

    apply();
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);

    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
    };
  }, []);
}
