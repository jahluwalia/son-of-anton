# Startup Sequence Fix Summary

## Problem
The original startup flow was trying to achieve: **Claude banner → Battle → Son of Anton banner → Prompt**

However, this approach had a fundamental issue:
- When Claude spawns in a PTY, it doesn't output its banner until stdin is connected in raw mode
- Attempting to capture the banner before connecting stdin resulted in **no data** (Length: 0)
- This caused the battle to play with no Claude banner shown first
- After the battle, the prompt wouldn't appear without hitting Ctrl-C

## Root Cause
The PTY (pseudo-terminal) doesn't flush output until:
1. Stdin is connected and in raw mode, OR
2. The PTY receives input or certain control signals

Since we were trying to capture the banner before connecting stdin, Claude never sent any output to capture.

## Solution
Simplified the flow to: **Battle → Son of Anton banner → Claude (fresh spawn with banner)**

### New Flow (bin/anton.js:402-422)
1. Prepare Son of Anton logo in background
2. Show battle sequence
3. Clear screen and display Son of Anton banner
4. Spawn Claude fresh in PTY
5. Connect terminal immediately - Claude banner displays naturally below Anton banner

### Benefits
- ✅ No complex PTY buffering or data handlers needed
- ✅ No timing issues or race conditions
- ✅ Claude banner displays naturally when PTY connects
- ✅ Prompt appears immediately after banner (no Ctrl-C needed)
- ✅ Much simpler and more reliable code

## Changes Made
- Removed all banner capture logic (lines 406-461 in old version)
- Simplified main flow to just 6 steps instead of 11
- Removed 800ms artificial delays
- Removed PTY resize tricks
- Spawn Claude AFTER battle completes, not before

## Testing
The flow now works correctly:
1. Battle plays
2. Screen clears
3. Son of Anton banner appears
4. Claude spawns and banner displays below
5. Prompt is ready for input immediately

No Ctrl-C needed, no banner display issues.
