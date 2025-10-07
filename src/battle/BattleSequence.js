import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';

// Typewriter effect hook
function useTypewriter(text, speed = 30) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    let index = 0;
    setDisplayedText('');
    setIsComplete(false);

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return [displayedText, isComplete];
}

export default function BattleSequence({ dialogue, formattedLogo }) {
  const { exit } = useApp();
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState('anton'); // 'anton' or 'claude'
  const [displayedRounds, setDisplayedRounds] = useState([]); // Track all completed exchanges
  const [showLogo, setShowLogo] = useState(false);

  const round = dialogue.rounds[currentRound];
  const currentText = currentSpeaker === 'anton' ? round.anton : round.claude;
  const isLastRound = currentRound === dialogue.rounds.length - 1;
  const isFinalBlow = isLastRound && currentSpeaker === 'claude';

  // Typewriter speeds
  const antonSpeed = 25;
  const claudeSpeed = isLastRound ? 60 : 35; // Slower when dying

  const [displayedText, isTypingComplete] = useTypewriter(
    showLogo ? '' : currentText,
    currentSpeaker === 'anton' ? antonSpeed : claudeSpeed
  );

  // Handle progression to next speaker/round
  useEffect(() => {
    if (!isTypingComplete) return;
    if (showLogo) return;

    const timer = setTimeout(() => {
      if (currentSpeaker === 'anton') {
        // Add Anton's line to history
        setDisplayedRounds([...displayedRounds, { speaker: 'anton', text: round.anton, roundNum: currentRound }]);
        // Move to Claude's response
        setCurrentSpeaker('claude');
      } else {
        // Add Claude's line to history
        setDisplayedRounds([...displayedRounds, { speaker: 'claude', text: round.claude, roundNum: currentRound }]);

        // Move to next round or finish
        if (currentRound < dialogue.rounds.length - 1) {
          setCurrentRound(currentRound + 1);
          setCurrentSpeaker('anton');
        } else {
          // Battle complete - show logo reveal
          setTimeout(() => {
            setShowLogo(true);
          }, 1500);
        }
      }
    }, 800); // Pause between exchanges

    return () => clearTimeout(timer);
  }, [isTypingComplete, currentSpeaker, currentRound, dialogue.rounds.length, displayedRounds, round, showLogo]);

  // Use the pre-formatted logo for reveal
  const [revealedLogo, logoRevealComplete] = useTypewriter(showLogo ? formattedLogo : '', 5);

  // Exit Ink when logo reveal is done
  useEffect(() => {
    if (showLogo && logoRevealComplete) {
      setTimeout(() => {
        exit();
      }, 2000);
    }
  }, [showLogo, logoRevealComplete, exit]);

  if (showLogo) {
    // Show logo reveal
    return React.createElement(Box, { flexDirection: "column", padding: 1 },
      React.createElement(Text, { color: "cyan" }, revealedLogo)
    );
  }

  return React.createElement(Box, { flexDirection: "column", padding: 1 },
    // Battle Arena
    React.createElement(Box, { flexDirection: "column", borderStyle: "double", borderColor: "cyan", padding: 1, width: 80 },
      React.createElement(Text, { bold: true, color: "cyan" },
        ` ⚔️  ROUND ${currentRound + 1} / ${dialogue.rounds.length} ⚔️ `
      ),

      React.createElement(Box, { marginTop: 1 }),

      // Show all previous rounds
      ...displayedRounds.map((item, idx) =>
        React.createElement(Box, { key: idx, flexDirection: "column", marginBottom: 1 },
          React.createElement(Text, { bold: true, color: item.speaker === 'anton' ? 'cyan' : '#FF8C00' },
            item.speaker === 'anton' ? "ANTON:" : "CLAUDE CODE:"
          ),
          React.createElement(Text, { color: item.speaker === 'anton' ? 'cyan' : '#FF8C00' }, item.text)
        )
      ),

      // Current speaker typing
      React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
        React.createElement(Text, { bold: true, color: currentSpeaker === 'anton' ? 'cyan' : (isFinalBlow ? 'gray' : '#FF8C00') },
          currentSpeaker === 'anton' ? "ANTON:" : "CLAUDE CODE:"
        ),
        React.createElement(Text, { color: currentSpeaker === 'anton' ? 'cyan' : (isFinalBlow ? 'gray' : '#FF8C00') },
          displayedText,
          !isTypingComplete && React.createElement(Text, { color: currentSpeaker === 'anton' ? 'cyanBright' : (isFinalBlow ? 'gray' : '#FFA500') }, "▋")
        )
      )
    ),

    // Status message
    React.createElement(Box, { marginTop: 1 },
      React.createElement(Text, { dimColor: true },
        isFinalBlow && isTypingComplete
          ? '💀 Claude Code has been terminated...'
          : isTypingComplete
          ? '⏳ Processing...'
          : ''
      )
    )
  );
}
