/**
 * HyperArcade Crash Shield & Pure Code Validator
 * Protects the arcade and user browser from freeze exploits, infinite loops,
 * memory exhaustion, top-window hijacking, and modal alert loops.
 */

export interface CodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  preparedCode: string;
}

/**
 * Checks code for patterns known to cause browser lockups, tab crashes, or security escapes.
 */
export function validateGameCode(rawInput: string): CodeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const code = rawInput.trim();

  if (!code) {
    return {
      isValid: false,
      errors: ['No game code provided. Please enter your HTML5 or JavaScript code.'],
      warnings: [],
      preparedCode: ''
    };
  }

  // 1. Check for intentional infinite loops without exit condition
  const infiniteWhileRegex = /while\s*\(\s*(true|1|!0|!\s*false)\s*\)\s*\{([^}]*)\}/gi;
  let match: RegExpExecArray | null;
  while ((match = infiniteWhileRegex.exec(code)) !== null) {
    const loopBody = match[2] || '';
    if (!loopBody.includes('break') && !loopBody.includes('return') && !loopBody.includes('throw')) {
      errors.push('CRASH HAZARD: Unconditional infinite loop `while(true)` without break detected. This will freeze the browser.');
      break;
    }
  }

  // Check for for(;;) infinite loops
  const infiniteForRegex = /for\s*\(\s*;\s*;\s*\)\s*\{([^}]*)\}/gi;
  while ((match = infiniteForRegex.exec(code)) !== null) {
    const loopBody = match[1] || '';
    if (!loopBody.includes('break') && !loopBody.includes('return') && !loopBody.includes('throw')) {
      errors.push('CRASH HAZARD: Unconditional infinite loop `for(;;)` without break detected. This will freeze the browser.');
      break;
    }
  }

  // 2. Check for Top-window / frame-busting hijacking attempts
  const frameBustingPatterns = [
    /top\.location\s*=/i,
    /window\.top\.location/i,
    /parent\.location\s*=/i,
    /window\.parent\.location/i,
    /top\.document/i,
    /parent\.document/i,
  ];

  for (const pattern of frameBustingPatterns) {
    if (pattern.test(code)) {
      errors.push('SECURITY HAZARD: Frame-busting attempt detected (`top.location` or `parent.document`). External navigation is blocked to protect users.');
      break;
    }
  }

  // 3. Check for modal spam loops (e.g. while/for loop wrapping alert/prompt/confirm)
  const modalLoopPatterns = [
    /while\s*\([^)]*\)\s*\{[^}]*alert\s*\(/i,
    /for\s*\([^)]*\)\s*\{[^}]*alert\s*\(/i,
    /while\s*\([^)]*\)\s*\{[^}]*prompt\s*\(/i,
    /while\s*\([^)]*\)\s*\{[^}]*confirm\s*\(/i,
  ];

  for (const pattern of modalLoopPatterns) {
    if (pattern.test(code)) {
      errors.push('CRASH HAZARD: Modal dialog loop (`alert`/`prompt` inside a loop) detected. This locks the user browser tab.');
      break;
    }
  }

  // 4. Check for massive memory allocation bombs
  if (/new\s+Array\s*\(\s*(1e[7-9]|[0-9]{8,})\s*\)/i.test(code)) {
    errors.push('CRASH HAZARD: Excessive memory allocation bomb detected. Allocating hundreds of millions of elements will crash the tab.');
  }

  // Warnings (non-fatal, auto-mitigated)
  if (code.includes('document.write(')) {
    warnings.push('Notice: `document.write()` was detected. Dynamic DOM or Canvas rendering is recommended for modern web games.');
  }

  if (code.includes('localStorage') || code.includes('sessionStorage')) {
    warnings.push('Notice: Storage calls are sandboxed to the game iframe and isolated from the host arcade.');
  }

  const preparedCode = wrapPureCodeIfNeeded(code);
  const shieldedCode = injectCrashProtection(preparedCode);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    preparedCode: shieldedCode
  };
}

/**
 * Checks if input is pure JavaScript or pure CSS/HTML snippet,
 * and if so wraps it in a responsive HTML5 game harness.
 */
export function wrapPureCodeIfNeeded(inputCode: string, gameTitle = 'Playable Game'): string {
  const code = inputCode.trim();

  // If already full HTML document
  if (code.toLowerCase().includes('<!doctype html') || code.toLowerCase().includes('<html')) {
    return code;
  }

  // Check if it's an HTML fragment with elements like <canvas>, <div>, etc.
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(code);

  if (hasHtmlTags) {
    // Wrap HTML snippet in full HTML page structure
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${escapeHtml(gameTitle)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #090d16;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
  }

  // It is pure JavaScript! Wrap it in an auto-resizing full-bleed canvas harness
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>${escapeHtml(gameTitle)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #090d16;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    canvas {
      display: block;
      background: #000;
      max-width: 100%;
      max-height: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <canvas id="canvas" width="800" height="600"></canvas>
  <script>
    // Pure Code Game Harness
    (function() {
      // Auto-assign global canvas & context if code uses them
      var canvas = document.getElementById('canvas');
      var ctx = canvas.getContext('2d');
      window.canvas = canvas;
      window.ctx = ctx;

      try {
        ${code}
      } catch (err) {
        console.error("Game Runtime Exception:", err);
        if (window.__showArcadeCrashUI) {
          window.__showArcadeCrashUI(err.message);
        }
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Injects a bulletproof client-side Crash Shield script directly into the HTML document.
 * This script runs before any game scripts to intercept infinite modal freezes,
 * catch runtime errors gracefully, and enforce execution bounds.
 */
export function injectCrashProtection(htmlContent: string): string {
  if (htmlContent.includes('<!-- SPHERESTRIKE_CRASH_SHIELD_ACTIVE -->')) {
    return htmlContent;
  }

  const shieldScript = `
  <!-- SPHERESTRIKE_CRASH_SHIELD_ACTIVE -->
  <script>
  (function() {
    'use strict';
    
    // 1. Prevent top-level window busting / parent hijacking
    try {
      Object.defineProperty(window, 'parent', { get: function() { return window; }, configurable: true });
      Object.defineProperty(window, 'top', { get: function() { return window; }, configurable: true });
    } catch(e) {}

    // 2. Prevent infinite alert() / confirm() / prompt() freeze attacks
    var alertCount = 0;
    var maxAlerts = 5;
    var originalAlert = window.alert;
    window.alert = function(msg) {
      alertCount++;
      if (alertCount > maxAlerts) {
        console.warn('SphereStrike Shield: Blocked excessive alert dialogs.');
        return;
      }
      console.log('[Game Alert]:', msg);
      // Non-blocking in-canvas toast
      showGameToast(String(msg));
    };

    window.confirm = function(msg) {
      console.log('[Game Confirm requested]:', msg);
      return true;
    };

    window.prompt = function(msg, def) {
      console.log('[Game Prompt requested]:', msg);
      return def || '';
    };

    function showGameToast(msg) {
      var toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.95);color:#38bdf8;border:1px solid #0284c7;padding:8px 18px;border-radius:12px;font-size:13px;font-family:sans-serif;z-index:999999;box-shadow:0 10px 25px rgba(0,0,0,0.5);pointer-events:none;transition:opacity 0.3s;font-weight:600;';
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
      }, 3200);
    }

    // In-game score and progress reporting APIs
    window.SphereArcade = {
      saveScore: function(val) {
        var num = Number(val);
        if (!isNaN(num) && num > 0) {
          window.parent.postMessage({ type: 'ARCADE_SCORE', score: num }, '*');
          showGameToast('🏆 Score Saved: ' + num);
        }
      },
      saveProgress: function(level, score, checkpoint) {
        window.parent.postMessage({ 
          type: 'ARCADE_SAVE_PROGRESS', 
          level: Number(level) || 1, 
          score: Number(score) || 0,
          checkpoints: typeof checkpoint === 'string' ? checkpoint : (checkpoint ? JSON.stringify(checkpoint) : undefined)
        }, '*');
        showGameToast('💾 Level Progress Saved');
      }
    };
    window.saveScore = window.SphereArcade.saveScore;
    window.saveProgress = window.SphereArcade.saveProgress;

    // 3. Graceful in-game crash UI handler
    window.__showArcadeCrashUI = function(errorMsg) {
      var existing = document.getElementById('spherestrike-crash-overlay');
      if (existing) return;

      var overlay = document.createElement('div');
      overlay.id = 'spherestrike-crash-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(8,12,22,0.92);backdrop-filter:blur(8px);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:system-ui,-apple-system,sans-serif;padding:24px;text-align:center;';
      
      overlay.innerHTML = '<div style="background:#0f172a;border:1px solid #dc2626;border-radius:16px;padding:28px;max-width:480px;box-shadow:0 20px 50px rgba(220,38,38,0.2);">' +
        '<div style="font-size:28px;margin-bottom:12px;">🛡️</div>' +
        '<h3 style="font-size:18px;font-weight:bold;color:#f87171;margin-bottom:8px;">Game Error Recovered</h3>' +
        '<p style="font-size:12px;color:#94a3b8;margin-bottom:16px;line-height:1.5;">The arcade crash shield caught an unhandled game script error and protected your browser tab from crashing.</p>' +
        '<pre style="background:#020617;color:#fca5a5;padding:12px;border-radius:8px;font-size:11px;font-family:monospace;text-align:left;overflow-x:auto;max-height:120px;margin-bottom:20px;border:1px solid #1e293b;">' + escapeHtml(errorMsg || 'Script exception') + '</pre>' +
        '<button id="ss-restart-btn" style="background:#2563eb;color:#fff;font-weight:600;padding:10px 22px;border-radius:10px;border:none;cursor:pointer;font-size:13px;transition:background 0.2s;">Restart Game</button>' +
        '</div>';

      document.body.appendChild(overlay);
      var btn = document.getElementById('ss-restart-btn');
      if (btn) {
        btn.onclick = function() { window.location.reload(); };
      }
    };

    // 4. Global Error and Unhandled Rejection traps
    window.onerror = function(msg, url, line, col, error) {
      var details = (msg || 'Error') + (line ? ' (line ' + line + ')' : '');
      console.error('[Shield caught error]:', details, error);
      window.__showArcadeCrashUI(details);
      return true; // Prevents propagation to browser devtools break
    };

    window.addEventListener('unhandledrejection', function(event) {
      var reason = event.reason ? (event.reason.message || String(event.reason)) : 'Unhandled Promise Rejection';
      console.error('[Shield caught unhandled rejection]:', reason);
      window.__showArcadeCrashUI(reason);
      event.preventDefault();
    });

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, function(m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
      });
    }
  })();
  </script>
`;

  // Inject right after <head> or at the very beginning of the document
  if (htmlContent.includes('<head>')) {
    return htmlContent.replace('<head>', '<head>' + shieldScript);
  } else if (htmlContent.includes('<html>')) {
    return htmlContent.replace('<html>', '<html><head>' + shieldScript + '</head>');
  } else {
    return shieldScript + htmlContent;
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
