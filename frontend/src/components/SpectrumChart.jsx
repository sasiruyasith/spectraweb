import { useEffect, useRef } from 'react';

// draws a fake-but-realistic trace from the scan's peak + noise floor
export default function SpectrumChart({ start, stop, peakF, peakP, noise, height = 280 }) {
  const ref = useRef(null);

  useEffect(() => {
    const draw = () => {
      const c = ref.current;
      if (!c) return;
      const W = c.clientWidth, H = height, pad = 42;
      const dpr = window.devicePixelRatio || 1;
      c.width = W * dpr;
      c.height = H * dpr;
      const ctx = c.getContext('2d');
      ctx.scale(dpr, dpr);

      const top = Math.ceil((peakP + 10) / 10) * 10;
      const bottom = Math.floor((noise - 10) / 10) * 10;
      const x = f => pad + (f - start) / (stop - start) * (W - pad - 12);
      const y = p => 12 + (top - p) / (top - bottom) * (H - pad - 12);

      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = '#1b2740';
      ctx.fillStyle = '#8aa0bf';
      ctx.font = '11px system-ui, sans-serif';
      for (let p = top; p >= bottom; p -= 10) {
        ctx.beginPath(); ctx.moveTo(pad, y(p)); ctx.lineTo(W - 12, y(p)); ctx.stroke();
        ctx.fillText(p, 6, y(p) + 4);
      }
      for (let i = 0; i <= 4; i++) {
        const f = start + (stop - start) * i / 4;
        ctx.beginPath(); ctx.moveTo(x(f), 12); ctx.lineTo(x(f), H - pad); ctx.stroke();
        ctx.fillText(+f.toFixed(3), x(f) - 14, H - pad + 16);
      }
      ctx.fillText('MHz', W - 36, H - 8);
      ctx.fillText('dBm', 6, H - 8);

      // seeded random so the trace looks the same every time
      let seed = Math.round(peakF * 1000) % 2147483646 || 1;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const width = (stop - start) * 0.03;

      const pts = [];
      for (let i = 0; i <= 400; i++) {
        const f = start + (stop - start) * i / 400;
        const g = Math.exp(-((f - peakF) ** 2) / (2 * width * width));
        pts.push([x(f), y(noise + (peakP - noise) * g + (rand() - 0.5) * 4)]);
      }

      // filled area under the trace
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(56,224,160,0.35)');
      grad.addColorStop(1, 'rgba(56,224,160,0)');
      ctx.beginPath();
      ctx.moveTo(pts[0][0], H - pad);
      pts.forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.lineTo(pts[pts.length - 1][0], H - pad);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.strokeStyle = '#38e0a0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // peak marker
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath(); ctx.arc(x(peakF), y(peakP), 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`${peakP} dBm @ ${peakF} MHz`, Math.min(x(peakF) + 9, W - 160), y(peakP) + 4);
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [start, stop, peakF, peakP, noise, height]);

  return <canvas ref={ref} className="spectrum" style={{ height }} />;
}
