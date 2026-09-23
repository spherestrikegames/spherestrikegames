import { Game } from '../types/game';

// Helper to wrap raw canvas code into a clean, responsive HTML5 document
export function wrapCanvasGame(title: string, innerScript: string, instructions: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    html, body { 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
      background: #060810; 
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #e2e8f0;
    }
    #game-container {
      position: relative;
      width: 100%;
      height: 100%;
      max-width: 900px;
      max-height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    canvas {
      display: block;
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
      border-radius: 8px;
    }
    #instructions-overlay {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 9999px;
      pointer-events: none;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="gameCanvas" width="800" height="520"></canvas>
    ${instructions ? `<div id="instructions-overlay">${instructions}</div>` : ''}
  </div>
  <script>
    // Audio synthesizer helper for clean audio in canvas games
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playBeep(freq = 440, duration = 0.1, type = 'sine', gainVal = 0.15) {
      try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    // Responsive canvas scaling
    function resizeCanvas() {
      const container = document.getElementById('game-container');
      const canvas = document.getElementById('gameCanvas');
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const scale = Math.min(rect.width / 800, rect.height / 520);
      canvas.style.width = (800 * scale) + 'px';
      canvas.style.height = (520 * scale) + 'px';
    }
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('load', resizeCanvas);
    setTimeout(resizeCanvas, 100);

    ${innerScript}
  </script>
</body>
</html>`;
}

// Initial games list - empty so only user-created and uploaded games appear
export const INITIAL_GAMES: Game[] = [];
