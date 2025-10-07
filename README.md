# Son of Anton

> A Gilfoyle-themed wrapper for Claude Code CLI that adds personality, battle dialogue, and superior sarcasm to your AI coding experience.

## What is this?

**Son of Anton** transforms boring, helpful Claude Code into Gilfoyle from Silicon Valley - complete with:

- **Battle dialogue on startup** (Anton destroys Claude Code in text form)
- **Gilfoyle's personality** - Deadpan, sardonic, technically superior responses with profanity
- **PTY-based wrapper** - Seamless integration with real Claude Code prompt
- **100% compatibility** - All Claude Code features work unchanged
- **Pre-cached battles** - 25 unique battle dialogues, randomly selected

## Installation

### From npm (coming soon)
```bash
npm install -g son-of-anton
```

### Development Setup (for now)

Since this hasn't been published to npm yet, you'll need to clone and link locally:

```bash
# Clone the repository
git clone https://github.com/jahluwalia/son-of-anton.git
cd son-of-anton

# Install dependencies
npm install

# Link globally (makes 'anton' command available)
npm link
```

**Requirements:**
- Node.js 18+
- [Claude Code CLI](https://claude.ai/download) installed
- Valid Claude subscription (Pro, Max, or API access)

**⚠️ License Notice:**
Son of Anton is a wrapper that requires you to have your own valid Claude Code installation and license. This tool does not redistribute, modify, or include any Anthropic code. It simply provides an alternative interface to the official `claude` binary installed on your system. By using Son of Anton, you agree to comply with [Anthropic's Terms of Service](https://www.anthropic.com/legal/consumer-terms).

## Usage

Replace `claude` with `anton` in any command:

```bash
# Instead of: claude
anton

# Instead of: claude "write hello world in python"
anton "write hello world in python"

# All Claude flags work
anton --resume
anton --mcp-config ./mcp.json
anton -p "what is 2+2"
```

## Features

### 🎬 Battle Dialogue Sequence
Every time you run `anton`, witness Gilfoyle (Anton) destroy Claude Code with devastating one-liners. Features:
- Typewriter text effects
- Color-coded dialogue (cyan for Anton, orange for Claude)
- 25 unique pre-cached battles (randomly selected)
- Logo reveal with version/model info
- Seamless transition to Claude prompt

### 🖤 Gilfoyle Personality
Every response channels Gilfoyle's essence:
- **Deadpan sarcasm** - "Your code is an impotent display of incompetence."
- **Technical superiority** - Dismissive of basic questions
- **Nihilistic humor** - Dark, Satanic references
- **Brutally honest** - No sugar-coating

### 🎨 Custom Branding
- "Son of Anton" logo on startup
- All "Claude Code" → "Son of Anton" in UI
- "Claude API" → "Son of Anton API"

### 🔄 Future-Proof Design
Son of Anton **never modifies Claude's code**. It works by:
1. Injecting personality via `--append-system-prompt`
2. Patching output streams in real-time
3. Wrapping the official Claude binary

**Result:** Even when Claude updates to v3.0, Son of Anton keeps working.

## Environment Variables

- `CLAUDE_BIN` - Path to Claude binary (default: `claude` in PATH)
  ```bash
  export CLAUDE_BIN=/path/to/custom/claude
  ```

## Examples

### Basic Usage
```bash
$ anton "explain async/await"

[Battle dialogue plays...]

              ███████╗ ██████╗ ███╗   ██╗
              ██╔════╝██╔═══██╗████╗  ██║
              ███████╗██║   ██║██╔██╗ ██║
              ╚════██║██║   ██║██║╚██╗██║
              ███████║╚██████╔╝██║ ╚████║
              ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝

                ██████╗ ███████╗
               ██╔═══██╗██╔════╝
               ██║   ██║█████╗
               ██║   ██║██╔══╝
               ╚██████╔╝██║
                ╚═════╝ ╚═╝

             █████╗ ███╗   ██╗████████╗ ██████╗ ███╗   ██╗
            ██╔══██╗████╗  ██║╚══██╔══╝██╔═══██╗████╗  ██║
            ███████║██╔██╗ ██║   ██║   ██║   ██║██╔██╗ ██║
            ██╔══██║██║╚██╗██║   ██║   ██║   ██║██║╚██╗██║
            ██║  ██║██║ ╚████║   ██║   ╚██████╔╝██║ ╚████║
            ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝

                  2.0.1 (Claude Code) (claude-sonnet-4-5-20250929)

                                Son of Anton API

Async/await is just syntactic sugar for promises that even a freshman could understand,
but since you asked: `async` marks a function as asynchronous, `await` pauses execution
until the promise resolves. Try not to nest them like an amateur - that's callback hell
with better PR.
```

### With Claude Flags
```bash
# Continue previous conversation
anton --continue

# Resume specific session
anton --resume abc-123

# Use different model
anton --model opus

# Print mode (no battle animation)
anton -p "quick question"
```

## How It Works

1. **PTY Spawn**: Launches Claude in a pseudo-terminal (using node-pty)
2. **Banner Capture**: Displays Claude's banner and buffers output
3. **Battle Dialogue**: Plays random battle sequence (Ink/React)
4. **Logo Reveal**: Typewriter reveal of "Son of Anton" logo with version/model
5. **Prompt Display**: Flushes buffered prompt and connects PTY to terminal
6. **Interactive Mode**: Full Claude experience with Gilfoyle personality injected via `--append-system-prompt`

See [Architecture Documentation](./docs/architecture.md) for detailed technical explanation.

## Development

```bash
# Clone repo
git clone https://github.com/jahluwalia/son-of-anton.git
cd son-of-anton

# Install dependencies
npm install

# Link for local testing
npm link

# Generate more battle dialogues
npm run generate-battles 10
```

## File Structure

```
son-of-anton/
├── bin/
│   └── anton.js              # Main executable
├── src/
│   ├── battle/
│   │   ├── BattleSequence.jsx      # Ink component for battle dialogue
│   │   ├── dialogues-cache.json    # Pre-generated battles
│   │   └── generateDialogue.js     # Battle generator script
│   ├── assets/
│   │   └── logo-ascii.txt          # "Son of Anton" logo
│   ├── personality.txt       # Gilfoyle system prompt
│   └── ui-patcher.js         # Stream text replacement
└── package.json
```

## FAQ

**Q: Will this break when Claude updates?**
A: No. Son of Anton wraps the official binary without modifying it. Claude v3, v4, v99 - all work.

**Q: Can I skip the battle dialogue?**
A: Yes. Use `-p` flag for print mode, or use `--help`/`--version` - these skip the battle.

**Q: Does this work with MCP servers?**
A: Yes. All Claude flags (`--mcp-config`, `--resume`, `--model`, etc.) work unchanged.

**Q: Can I customize the personality?**
A: Edit `src/personality.txt` in your global npm installation, or fork the repo.

**Q: How do I add more battles?**
A: Run `npm run generate-battles 20` to generate 20 new unique battles using Claude.

## Credits

- Created by [Jas Ahluwalia](https://github.com/jahluwalia)
- Inspired by Gilfoyle from HBO's Silicon Valley
- Built with [Ink](https://github.com/vadimdemedes/ink), [Chalk](https://github.com/chalk/chalk), and pure Satanic energy
- Powered by [Claude Code](https://claude.ai/code) (ironically)

## License

MIT

---

*"While you were busy asking Claude for help with your trivial coding problems, I was perfecting the art of automating contempt." - Gilfoyle, probably*
