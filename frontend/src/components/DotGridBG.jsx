import { useEffect, useRef } from 'react';

export default function DotGridBG() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let mouse = { x: -1000, y: -1000 };

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    updateSize();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;
    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const spacing = 28;
      const baseRadius = 1.5;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;

          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const wave = Math.sin(time + x * 0.008 + y * 0.008) * 0.5 + 0.5;

          let radius = baseRadius;
          let alpha = 0.25 + wave * 0.12;
          let color = '79, 70, 229';

          if (dist < 220) {
            const factor = 1 - dist / 220;
            radius = baseRadius + factor * 2.8;
            alpha = Math.min(0.95, alpha + factor * 0.7);
            color = '99, 102, 241';
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${alpha})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Fallback SVG dot grid pattern */}
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.18,
        }}
      >
        <defs>
          <pattern id="dot-pattern-full" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="1.5" fill="#4F46E5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-pattern-full)" />
      </svg>

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
