import { wrapCanvasGame } from './initialGames';

export interface GameTemplate {
  id: string;
  name: string;
  genre: 'Action' | 'Arcade' | 'Casual' | 'Puzzle' | 'Retro';
  description: string;
  defaultControls: { key: string; action: string }[];
  tags: string[];
  code: string;
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'flappy-pixel',
    name: 'Flappy Pixel Wing',
    genre: 'Casual',
    description: 'Tap to flap through vector pillars. Great starting point for arcade timing games.',
    tags: ['Casual', 'One-Button', 'Flappy', 'Pixel'],
    defaultControls: [
      { key: 'Space / Click', action: 'Flap Wings & Jump' }
    ],
    code: wrapCanvasGame(
      'Flappy Pixel Wing',
      `
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let state = 'PLAY';
  let score = 0;
  let best = 0;

  const bird = {
    x: 120,
    y: canvas.height / 2,
    vy: 0,
    gravity: 0.38,
    jump: -7.5,
    r: 14
  };

  let pipes = [];
  let frame = 0;

  function flap() {
    if (state === 'GAMEOVER') {
      restart();
      return;
    }
    bird.vy = bird.jump;
    playBeep(600, 0.08, 'square');
  }

  window.addEventListener('keydown', e => { if (e.code === 'Space') flap(); });
  canvas.addEventListener('mousedown', flap);

  function restart() {
    bird.y = canvas.height / 2;
    bird.vy = 0;
    pipes = [];
    score = 0;
    frame = 0;
    state = 'PLAY';
  }

  function update() {
    if (state === 'GAMEOVER') return;

    frame++;
    bird.vy += bird.gravity;
    bird.y += bird.vy;

    // Spawn pipes
    if (frame % 90 === 0) {
      const gap = 140;
      const minTop = 60;
      const maxTop = canvas.height - gap - 60;
      const topH = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
      pipes.push({
        x: canvas.width,
        w: 52,
        topH: topH,
        bottomY: topH + gap,
        passed: false
      });
    }

    // Move pipes
    pipes.forEach((p, i) => {
      p.x -= 3;
      if (!p.passed && p.x + p.w < bird.x) {
        p.passed = true;
        score++;
        playBeep(880, 0.1, 'sine');
      }

      // Check collision
      if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w) {
        if (bird.y - bird.r < p.topH || bird.y + bird.r > p.bottomY) {
          gameOver();
        }
      }

      if (p.x < -60) pipes.splice(i, 1);
    });

    // Floor/ceiling collision
    if (bird.y + bird.r > canvas.height || bird.y - bird.r < 0) {
      gameOver();
    }
  }

  function gameOver() {
    state = 'GAMEOVER';
    playBeep(150, 0.3, 'sawtooth');
    if (score > best) best = score;
  }

  function draw() {
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pipes
    pipes.forEach(p => {
      ctx.save();
      ctx.fillStyle = '#10b981';
      // Top pipe
      ctx.fillRect(p.x, 0, p.w, p.topH);
      // Bottom pipe
      ctx.fillRect(p.x, p.bottomY, p.w, canvas.height - p.bottomY);
      ctx.restore();
    });

    // Bird
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bird.x + 6, bird.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Score HUD
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 24px sans-serif';
    ctx.fillText('SCORE: ' + score, 24, 40);
    ctx.fillText('BEST: ' + best, 200, 40);

    if (state === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(5, 7, 18, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f43f5e';
      ctx.font = '700 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '500 16px sans-serif';
      ctx.fillText('PRESS [SPACE] OR CLICK TO RETRY', canvas.width / 2, canvas.height / 2 + 30);
      ctx.textAlign = 'start';
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
`,
      'Controls: [Space] or [Click] to Flap'
    )
  },
  {
    id: 'blank-canvas',
    name: 'Blank HTML5 / Canvas Studio',
    genre: 'Retro',
    description: 'Clean starter template with canvas loop, key listeners, and Web Audio API setup ready for custom game logic.',
    tags: ['Custom', 'Canvas', 'HTML5', 'Indie'],
    defaultControls: [
      { key: 'Mouse / Keyboard', action: 'Custom controls' }
    ],
    code: wrapCanvasGame(
      'My Custom Game',
      `
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let x = canvas.width / 2;
  let y = canvas.height / 2;
  let color = '#3b82f6';

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  });

  canvas.addEventListener('click', () => {
    playBeep(660, 0.1, 'sine');
    color = '#' + Math.floor(Math.random()*16777215).toString(16);
  });

  function draw() {
    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Build your dream game! Move mouse & click to test.', canvas.width / 2, canvas.height / 2 + 80);
    ctx.textAlign = 'start';

    requestAnimationFrame(draw);
  }
  draw();
`,
      'Move mouse & click to test sound and color'
    )
  }
];
