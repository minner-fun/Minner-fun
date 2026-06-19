import {useEffect, useRef, type ReactNode, type CSSProperties} from 'react';

const FILL: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  pointerEvents: 'auto',
};

/** 链上数据感粒子网络：漂移 + 近距连线 + 鼠标排斥。颜色取 --accent，随主题切换。 */
export default function ParticleField({
  density = 60,
  style,
}: {
  density?: number;
  style?: CSSProperties;
}): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const N = Math.max(0, density);
    const pts: {x: number; y: number; vx: number; vy: number}[] = [];
    const accent = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ||
      '#2fe6c4';
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = c.getBoundingClientRect();
      w = rect.width;
      h = Math.max(rect.height, 1);
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < N; i++)
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
      });
    const mouse = {x: -999, y: -999};
    const onMove = (e: MouseEvent) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -999;
      mouse.y = -999;
    };
    c.addEventListener('mousemove', onMove);
    c.addEventListener('mouseleave', onLeave);
    let raf = 0;
    const draw = () => {
      const ac = accent();
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 130) {
          p.x += ((p.x - mouse.x) / dm) * 0.5;
          p.y += ((p.y - mouse.y) / dm) * 0.5;
        }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 124) {
            ctx.globalAlpha = (1 - d / 124) * 0.16;
            ctx.strokeStyle = ac;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        const near = dm < 140;
        ctx.globalAlpha = near ? 0.95 : 0.5;
        ctx.fillStyle = ac;
        ctx.beginPath();
        ctx.arc(p.x, p.y, near ? 2.3 : 1.5, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      c.removeEventListener('mousemove', onMove);
      c.removeEventListener('mouseleave', onLeave);
    };
  }, [density]);
  return <canvas ref={ref} style={{...FILL, ...style}} aria-hidden="true" />;
}
