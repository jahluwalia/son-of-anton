#!/usr/bin/env node

import { spawn } from 'child_process';
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
      const result = spawn.sync(CLAUDE_BIN, ['--version'], { encoding: 'utf-8' });
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

    // Build args with personality injection
    const claudeArgs = [...args, '--append-system-prompt', personality];

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

  // Get version
  let version = 'Unknown';
  try {
    const versionResult = spawn.sync(CLAUDE_BIN, ['--version'], { encoding: 'utf-8' });
    version = (versionResult.stdout || versionResult.stderr || '').trim();
  } catch (err) {
    // Use default
  }

  // Get model
  let model = 'Unknown Model';
  try {
    const modelResult = spawn.sync(CLAUDE_BIN, ['-p', 'output only your exact model ID, nothing else'], {
      encoding: 'utf-8',
      timeout: 5000
    });
    model = (modelResult.stdout || '').trim();
  } catch (err) {
    // Use default
  }

  const versionString = `${version} (${model})`;

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

  // Normal flow with PTY:
  // 1. Spawn Claude in PTY
  const ptyProcess = spawnClaudeInPTY(args);

  // 2. Set up continuous data handler that we'll control
  let outputBuffer = '';
  let shouldDisplay = true;
  let bufferedData = '';

  const dataHandler = ptyProcess.onData((data) => {
    if (shouldDisplay) {
      process.stdout.write(data);
      outputBuffer += data;
    } else {
      // Buffer data during battle
      bufferedData += data;
    }
  });

  // Wait for banner and prompt
  const showBannerUntilPrompt = new Promise((resolve) => {
    const checkPrompt = () => {
      // Check for Claude's prompt indicators
      if (
        outputBuffer.includes('> ') ||
        outputBuffer.includes('➜') ||
        outputBuffer.match(/\n\s*>\s*$/) ||
        outputBuffer.match(/\n.*?:\s*$/)
      ) {
        resolve();
      }
    };

    // Check periodically
    const interval = setInterval(checkPrompt, 100);

    // Fallback timeout
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 3000);
  });

  await showBannerUntilPrompt;

  // 3. Stop displaying, start buffering (for battle sequence)
  shouldDisplay = false;
  bufferedData = '';

  // 4. Prepare logo with version info
  const formattedLogo = prepareLogoWithVersion();

  // 5. Show battle sequence with logo reveal (in Ink)
  await showBattle(formattedLogo);

  // 6. Battle has ended, Ink has exited
  // Dispose the data handler now
  dataHandler.dispose();

  // Clear screen
  console.clear();

  // 7. Display the SON OF ANTON logo
  console.log(chalk.cyan(formattedLogo));

  // 8. Display any buffered data (like the prompt)
  if (bufferedData) {
    process.stdout.write(bufferedData);
  }

  // 9. Connect PTY to terminal for interactive use
  connectPTYToTerminal(ptyProcess);
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
