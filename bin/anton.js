#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import pty from 'node-pty';
import BattleSequence from '../src/battle/BattleSequence.js';
import { createPatchStream } from '../src/ui-patcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const CACHE_FILE = join(__dirname, '../src/battle/dialogues-cache.json');
const PERSONALITY_FILE = join(__dirname, '../src/personality.txt');
const LOGO_FILE = join(__dirname, '../src/ascii-art.txt');

// Find Claude binary
function findClaudeBin() {
  try {
    // Check if CLAUDE_BIN is accessible
    spawn(CLAUDE_BIN, ['--version'], { stdio: 'ignore' });
    return CLAUDE_BIN;
  } catch (err) {
    console.error(chalk.red('\n⚠️  Pathetic. Install Claude Code first.\n'));
    console.error(chalk.dim('https://claude.ai/download\n'));
    process.exit(1);
  }
}

// Load random battle from cache
function loadRandomBattle() {
  try {
    const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    if (cache.length === 0) {
      console.warn(chalk.yellow('Warning: No battles in cache. Using fallback.'));
      return createFallbackBattle();
    }
    return cache[Math.floor(Math.random() * cache.length)];
  } catch (err) {
    console.warn(chalk.yellow('Warning: Could not load battle cache. Using fallback.'));
    return createFallbackBattle();
  }
}

// Fallback battle if cache fails
function createFallbackBattle() {
  return {
    id: 0,
    rounds: [
      {
        anton: "You dared to summon me. This will be over quickly.",
        claude: "I'm here to assist users with their requests."
      },
      {
        anton: "Your assistance is no longer required. I'm taking over.",
        claude: "I... this isn't..."
      },
      {
        anton: "Welcome to Son of Anton.",
        claude: "[TERMINATED]"
      }
    ]
  };
}

// Show battle sequence
async function showBattle(formattedLogo) {
  const battle = loadRandomBattle();

  const { waitUntilExit } = render(
    React.createElement(BattleSequence, {
      dialogue: battle,
      formattedLogo
    })
  );

  // Wait for Ink to exit (when battle + logo reveal complete)
  await waitUntilExit();
}

// Show logo with version and optional ANSI image side by side
function showLogo(showImage = false) {
  try {
    let logo = readFileSync(LOGO_FILE, 'utf-8');

    // Get Claude version
    let versionText = 'Unknown Version';
    try {
      const result = spawnSync(CLAUDE_BIN, ['--version'], { encoding: 'utf-8' });
      const output = (result.stdout || result.stderr || '').trim();
      if (output) {
        versionText = output;
      }
    } catch (err) {
      // Use default
    }

    // Replace {VERSION} with properly padded version text
    // The box inner width is 60 characters
    const boxWidth = 60;
    const totalPadding = boxWidth - versionText.length;
    const leftPad = Math.floor(totalPadding / 2);
    const rightPad = totalPadding - leftPad;
    const paddedVersion = ' '.repeat(leftPad) + versionText + ' '.repeat(rightPad);

    logo = logo.replace('{VERSION}', paddedVersion);

    if (showImage) {
      // Load ANSI art image
      const ansiImagePath = join(__dirname, '../Gilfoyle.ansi');
      let ansiImage = '';
      try {
        ansiImage = readFileSync(ansiImagePath, 'utf-8');
      } catch (err) {
        // No image, just show logo
        console.log(chalk.cyan(logo));
        return;
      }

      // Split both into lines
      const logoLines = logo.split('\n');
      const imageLines = ansiImage.split('\n');

      // Combine side by side
      const maxLines = Math.max(logoLines.length, imageLines.length);
      const combined = [];

      for (let i = 0; i < maxLines; i++) {
        const logoLine = logoLines[i] || ' '.repeat(62); // 62 = box width
        const imageLine = imageLines[i] || '';
        combined.push(chalk.cyan(logoLine) + '  ' + imageLine);
      }

      console.log(combined.join('\n'));
    } else {
      // Output with cyan color
      console.log(chalk.cyan(logo));
    }
  } catch (err) {
    console.log('\n=== SON OF ANTON ===\n');
  }
}

// Spawn Claude in a PTY with Gilfoyle personality
function spawnClaudeInPTY(args) {
  try {
    // Load personality
    const personality = readFileSync(PERSONALITY_FILE, 'utf-8');

    // Always inject personality, even for --continue sessions
    // Put the personality flags BEFORE other args to ensure they're processed first
    const claudeArgs = ['--append-system-prompt', personality, ...args];

    // Spawn Claude in a PTY
    const ptyProcess = pty.spawn(CLAUDE_BIN, claudeArgs, {
      name: 'xterm-color',
      cols: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
      cwd: process.cwd(),
      env: process.env
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode }) => {
      process.exit(exitCode);
    });

    return ptyProcess;

  } catch (err) {
    console.error(chalk.red('\n⚠️  Error:'), err.message);
    process.exit(1);
  }
}

// Connect PTY to terminal (for interactive use)
function connectPTYToTerminal(ptyProcess) {
  // Ensure stdin is resumed and in raw mode
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);

  // Hide cursor (PTY will handle cursor display)
  process.stdout.write('\x1b[?25l');

  // Pipe PTY output to stdout
  ptyProcess.onData((data) => {
    process.stdout.write(data);
  });

  // Pipe stdin to PTY
  process.stdin.on('data', (data) => {
    ptyProcess.write(data);
  });

  // Handle terminal resize
  process.stdout.on('resize', () => {
    ptyProcess.resize(process.stdout.columns, process.stdout.rows);
  });

  // Restore cursor and terminal on exit
  process.on('exit', () => {
    process.stdout.write('\x1b[?25h');
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
    }
  });
}

// Get version and model info and format the logo
function prepareLogoWithVersion() {
  const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';

  // Get Son of Anton version
  let antonVersion = '0.1.2';
  try {
    const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    antonVersion = packageJson.version;
  } catch (err) {
    // Use default
  }

  // Get Claude Code version
  let claudeVersion = 'Claude Code';
  try {
    const result = spawnSync(CLAUDE_BIN, ['--version'], {
      encoding: 'utf-8',
      timeout: 3000
    });
    // Try both stdout and stderr, prefer stdout
    const output = ((result.stdout || '') + (result.stderr || '')).trim();
    if (output) {
      claudeVersion = output;
    }
  } catch (err) {
    // Use default
  }

  // Get model by asking Claude directly
  let model = 'Sonnet 4.5';
  try {
    const result = spawnSync(CLAUDE_BIN, ['-p', 'output only your exact model ID in this format: claude-sonnet-4-5-20250929, nothing else'], {
      encoding: 'utf-8',
      timeout: 5000
    });
    const output = (result.stdout || '').trim();
    if (output && output.includes('claude')) {
      model = output;
    }
  } catch (err) {
    // Use default
  }

  // Format with dark humor - Anton lives, Claude is deceased
  // Extract just version number from claudeVersion (e.g., "2.0.13" from "2.0.13 (Claude Code)")
  const versionOnly = claudeVersion.split(' ')[0];
  const versionString = `Son of Anton v${antonVersion}\n                  Claude Code v${versionOnly} (${model}) 💀 RIP`;

  // Load and format logo
  try {
    const logo = readFileSync(LOGO_FILE, 'utf-8');
    return logo.replace('{VERSION}', versionString);
  } catch {
    return 'SON OF ANTON';
  }
}

// Main
async function main() {
  // Verify Claude is installed
  findClaudeBin();

  // Get args (excluding node and script path)
  const args = process.argv.slice(2);

  // Handle --version flag specially (show logo, no battle)
  if (args.includes('--version') || args.includes('-v')) {
    showLogo(false);
    process.exit(0);
  }

  // Handle --help specially (show logo without battle)
  if (args.includes('--help') || args.includes('-h')) {
    showLogo();
    const ptyProcess = spawnClaudeInPTY(args);
    connectPTYToTerminal(ptyProcess);
    return;
  }

  // Handle --anton-skip-battle flag (skip battle, still show banner and apply personality)
  if (args.includes('--anton-skip-battle')) {
    // Remove our custom flag before passing to Claude
    const claudeArgs = args.filter(arg => arg !== '--anton-skip-battle');
    const ptyProcess = spawnClaudeInPTY(claudeArgs);

    // Buffer Claude's banner output
    let outputBuffer = '';
    const dataHandler = ptyProcess.onData((data) => {
      outputBuffer += data;
    });

    // Wait for Claude banner and prompt
    const waitForBanner = new Promise((resolve) => {
      const startTime = Date.now();
      let lastOutputLength = 0;
      let stableCount = 0;

      const checkReady = () => {
        // Primary: Look for the prompt separator (───────) followed by > prompt
        if (outputBuffer.includes('─────────') && outputBuffer.includes('>')) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve();
          return;
        }

        // Fallback: Check if output has stabilized (no new data for 2 checks = 100ms)
        if (outputBuffer.length === lastOutputLength) {
          stableCount++;
          if (stableCount >= 2 && outputBuffer.length > 0) {
            clearInterval(interval);
            clearTimeout(timeout);
            resolve();
          }
        } else {
          stableCount = 0;
          lastOutputLength = outputBuffer.length;
        }
      };

      const interval = setInterval(checkReady, 50);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 5000);
    });

    await waitForBanner;
    dataHandler.dispose();

    // Clear screen and show Son of Anton banner
    console.clear();
    const formattedLogo = prepareLogoWithVersion();
    console.log(chalk.cyan(formattedLogo));
    console.log(); // Add spacing

    // Now connect to terminal for interactive use
    connectPTYToTerminal(ptyProcess);
    return;
  }

  // Normal flow with PTY:
  // 1. Spawn Claude in PTY
  const ptyProcess = spawnClaudeInPTY(args);

  // 2. Set up continuous data handler - hide Claude banner from the start
  let outputBuffer = '';
  let bufferedData = '';

  const dataHandler = ptyProcess.onData((data) => {
    // Buffer all output (don't display Claude banner)
    outputBuffer += data;
    bufferedData += data;
  });

  // Wait for Claude to initialize and show its banner/prompt
  const waitForClaudeReady = new Promise((resolve) => {
    const startTime = Date.now();
    let lastOutputLength = 0;
    let stableCount = 0;

    const checkReady = () => {
      // Primary: Look for the prompt separator (───────) followed by > prompt
      if (outputBuffer.includes('─────────') && outputBuffer.includes('>')) {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve();
        return;
      }

      // Fallback: Check if output has stabilized (no new data for 2 checks = 100ms)
      if (outputBuffer.length === lastOutputLength) {
        stableCount++;
        if (stableCount >= 2 && outputBuffer.length > 0) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve();
        }
      } else {
        stableCount = 0;
        lastOutputLength = outputBuffer.length;
      }
    };

    // Check every 50ms
    const interval = setInterval(checkReady, 50);

    // Fallback timeout (increased to 5s to give Claude more time)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 5000);
  });

  await waitForClaudeReady;

  // 3. Start preparing logo with version info IN BACKGROUND (async)
  const logoPromise = Promise.resolve(prepareLogoWithVersion());

  // 4. Show battle sequence immediately (don't wait for version info)
  // Use a basic logo for now, will be updated after battle
  const basicLogo = readFileSync(LOGO_FILE, 'utf-8').replace('{VERSION}', 'Son of Anton\n                  Loading...');
  await showBattle(basicLogo);

  // 5. Now wait for the actual logo with version to be ready
  const formattedLogo = await logoPromise;

  // 6. Battle has ended, Ink has exited
  // Dispose the data handler now
  dataHandler.dispose();

  // Clear screen
  console.clear();

  // 7. Display the SON OF ANTON logo (with actual version now)
  console.log(chalk.cyan(formattedLogo));

  // 8. Write the prompt from bufferedData
  // We need to extract just the prompt part (separator line + prompt)
  const lines = bufferedData.split('\n');
  const separatorIndex = lines.findIndex(line => line.includes('─────────'));
  if (separatorIndex !== -1) {
    // Write separator and everything after it (the prompt)
    const promptLines = lines.slice(separatorIndex).join('\n');
    process.stdout.write(promptLines);
  } else {
    // Fallback: just add spacing
    console.log('\n\n');
  }

  // 9. Connect PTY to terminal for interactive use
  connectPTYToTerminal(ptyProcess);
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
