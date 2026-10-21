// SDK 0.2.0's device-pixel ResizeObserver path can undersize the buffer
// under emulated/high DPR. Measure CSS pixels explicitly, without filters.
export function bindRenderResolution(scene, canvas, maxPixelRatio = 2) {
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  const observer = new ResizeObserver(([entry]) => {
    width = entry.contentRect.width;
    height = entry.contentRect.height;
  });
  observer.observe(canvas);
  const resize = () => {
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio,
      Math.sqrt(6_000_000 / (width * height)));
    const w = Math.max(1, Math.round(width * ratio));
    const h = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      scene.app.graphicsDevice.setResolution(w, h);
    }
  };
  // Registered after the SDK resize callback, so the measured CSS size wins.
  scene.app.on('framerender', resize);
  return () => {
    observer.disconnect();
    scene.app.off('framerender', resize);
  };
}
