#!/usr/bin/env node
import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const CACHE_FILE = join(__dirname, 'dialogues-cache.json');

// Generate a single line of dialogue using claude -p
async function generateLine(prompt) {
  return new Promise((resolve, reject) => {
    const claude = spawn(CLAUDE_BIN, ['-p', prompt], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    claude.stdout.on('data', (data) => {
      output += data.toString();
    });

    claude.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Claude exited with code ${code}`));
      }
    });

    claude.on('error', reject);
  });
}

// Generate a complete battle sequence (3-4 rounds)
async function generateBattle(battleId) {
  console.log(`\nGenerating battle ${battleId}...`);

  const rounds = [];
  const numRounds = 3 + Math.floor(Math.random() * 2); // 3-4 rounds

  for (let i = 0; i < numRounds; i++) {
    const isLastRound = i === numRounds - 1;

    console.log(`  Round ${i + 1}/${numRounds}...`);

    // Anton's line (Gilfoyle)
    const antonPrompt = isLastRound
      ? "You are Gilfoyle from Silicon Valley. Generate a single BRUTAL finishing blow line that destroys Claude Code. Be savage, final, and devastating. 1-2 sentences max. Output only the line."
      : `You are Gilfoyle from Silicon Valley. Generate a single line of ${i === 0 ? 'opening' : 'escalating'} sardonic trash talk directed at Claude Code during a fight. Be deadpan, superior, and dismissive. 1-2 sentences max. Output only the line.`;

    const antonLine = await generateLine(antonPrompt);

    // Claude's response
    const claudePrompt = isLastRound
      ? "You are Claude Code being destroyed. Generate a final dying message. Be pathetic, fading, defeated. 1 sentence. Output '[TERMINATED]' or similar death message."
      : `You are Claude Code, an AI assistant${i > 0 ? ' weakening under attack' : ''}. Generate a ${i > 0 ? 'defensive and weakening' : 'confident'} response to an insult. 1-2 sentences max. Output only the response.`;

    const claudeLine = await generateLine(claudePrompt);

    rounds.push({
      anton: antonLine,
      claude: claudeLine
    });

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    id: battleId,
    rounds
  };
}

// Main function to generate multiple battles
async function main() {
  const numBattles = parseInt(process.argv[2]) || 10;

  console.log(`Generating ${numBattles} battle sequences...\n`);

  // Load existing cache if it exists
  let cache = [];
  try {
    const existing = readFileSync(CACHE_FILE, 'utf-8');
    cache = JSON.parse(existing);
    console.log(`Loaded ${cache.length} existing battles from cache.\n`);
  } catch (err) {
    console.log('No existing cache found. Starting fresh.\n');
  }

  const startId = cache.length + 1;

  for (let i = 0; i < numBattles; i++) {
    try {
      const battle = await generateBattle(startId + i);
      cache.push(battle);
      console.log(`✓ Battle ${battle.id} generated successfully`);
    } catch (err) {
      console.error(`✗ Failed to generate battle ${startId + i}:`, err.message);
    }
  }

  // Save to cache file
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`\n✓ Saved ${cache.length} total battles to ${CACHE_FILE}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { generateBattle, generateLine };
