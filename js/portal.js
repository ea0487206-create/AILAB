function startPortal(cv) {
  const c = cv.getContext("2d"), S = (cv.width = cv.height = 600), R = 175, P = [];
  const spawn = () => {
    const a = Math.random() * 6.283, r = R + (Math.random() - 0.5) * 16, s = 0.4 + Math.random() * 1.8;
    P.push({
      x: S / 2 + Math.cos(a) * r, y: S / 2 + Math.sin(a) * r,
      vx: -Math.sin(a) * s * 0.9 + Math.cos(a) * s * 0.7,
      vy: Math.cos(a) * s * 0.9 + Math.sin(a) * s * 0.7,
      l: 1, d: 0.008 + Math.random() * 0.02, w: 0.6 + Math.random() * 1.6
    });
  };
  (function frame() {
    c.clearRect(0, 0, S, S);
    c.globalCompositeOperation = "lighter";
    // الحلقة المتوهجة
    c.shadowBlur = 35; c.shadowColor = "#ff9a1f";
    c.strokeStyle = "rgba(255,190,90,.55)"; c.lineWidth = 7;
    c.beginPath(); c.arc(S / 2, S / 2, R, 0, 6.283); c.stroke();
    c.shadowBlur = 0;
    // الشرار
    for (let i = 0; i < 14; i++) spawn();
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.01; p.l -= p.d;
      if (p.l <= 0) { P.splice(i, 1); continue; }
      c.strokeStyle = "rgba(255," + (150 + 90 * p.l | 0) + ",60," + p.l + ")";
      c.lineWidth = p.w;
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); c.stroke();
    }
    requestAnimationFrame(frame);
  })();
}