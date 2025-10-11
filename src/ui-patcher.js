import { Transform } from 'stream';

/**
 * Creates a Transform stream that patches Claude Code branding to Son of Anton
 * while preserving ANSI escape codes and formatting
 */
export function createPatchStream() {
  let buffer = '';

  const replacements = [
    { from: 'Claude Code', to: 'Son of Anton' },
    { from: 'Claude API', to: '' }, // Remove "Claude API" entirely
    { from: 'Son of Anton API', to: '' }, // Also remove "Son of Anton API" (result of partial replacement)
    { from: 'claude.ai/code', to: 'github.com/jahluwalia/son-of-anton' },
    // Clean up the status line - remove the API part
    { from: /Sonnet \d+\.\d+ · Claude API/g, to: (match) => match.replace(' · Claude API', '') },
    { from: /Sonnet \d+\.\d+ · Son of Anton API/g, to: (match) => match.replace(' · Son of Anton API', '') },
  ];

  return new Transform({
    transform(chunk, encoding, callback) {
      // Add chunk to buffer
      buffer += chunk.toString();

      // Only process complete lines to avoid splitting in the middle of text
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      // Process complete lines
      for (let line of lines) {
        // Apply all replacements
        for (const { from, to } of replacements) {
          if (typeof from === 'string') {
            line = line.replace(new RegExp(escapeRegex(from), 'g'), to);
          } else {
            // It's already a regex
            line = line.replace(from, to);
          }
        }

        // Push the patched line
        this.push(line + '\n');
      }

      callback();
    },

    flush(callback) {
      // Process any remaining buffer content
      if (buffer) {
        let line = buffer;

        for (const { from, to } of replacements) {
          if (typeof from === 'string') {
            line = line.replace(new RegExp(escapeRegex(from), 'g'), to);
          } else {
            line = line.replace(from, to);
          }
        }

        this.push(line);
      }

      callback();
    }
  });
}

// Helper to escape special regex characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default createPatchStream;
