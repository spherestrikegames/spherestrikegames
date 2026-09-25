/**
 * Pure Code Wrapper & Validator
 * Wraps pure JavaScript or HTML snippets cleanly into playable games
 * without imposing crash shield blockers or script traps.
 */

export interface CodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  preparedCode: string;
}

/**
 * Validates and prepares game code for playback without crash protection restrictions.
 */
export function validateGameCode(rawInput: string): CodeValidationResult {
  const code = rawInput.trim();

  if (!code) {
    return {
      isValid: false,
      errors: ['No game code provided. Please enter your HTML5 or JavaScript code.'],
      warnings: [],
      preparedCode: ''
    };
  }

  const preparedCode = wrapPureCodeIfNeeded(code);

  return {
    isValid: true,
    errors: [],
    warnings: [],
    preparedCode
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

  // It is pure JavaScript! Wrap it in an auto-resizing canvas harness
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
    (function() {
      var canvas = document.getElementById('canvas');
      var ctx = canvas.getContext('2d');
      window.canvas = canvas;
      window.ctx = ctx;

      ${code}
    })();
  </script>
</body>
</html>`;
}

/**
 * Returns raw htmlContent directly with no crash shield injection.
 */
export function injectCrashProtection(htmlContent: string): string {
  return htmlContent;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
