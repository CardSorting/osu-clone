import React, { useEffect, useState } from 'react';
import { useGame } from '@/interface/contexts/GameContext';

const GameScreen: React.FC = () => {
  const { state, actions } = useGame();
  const [isPaused, setIsPaused] = useState(false);

  // Set up keyboard handler for pausing the game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaused]);

  // Toggle pause state
  const togglePause = () => {
    if (isPaused) {
      actions.resumeGame();
    } else {
      actions.pauseGame();
    }
    setIsPaused(!isPaused);
  };

  // Return to menu
  const handleReturnToMenu = () => {
    actions.goToMenu();
  };

  return (
    <div className="game-screen">
      {/* Game play area - the Three.js renderer will attach to the gameContainerRef in GameContext */}
      <div className="game-view">
        {/* HUD Elements */}
        <div className="game-hud">
          <div className="score-display">
            <div className="score">{state.score.toLocaleString()}</div>
            <div className="combo">x{state.combo}</div>
            <div className="accuracy">{(state.accuracy * 100).toFixed(2)}%</div>
          </div>
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div className="pause-overlay">
            <div className="pause-menu">
              <h2>Paused</h2>
              <button className="menu-button" onClick={togglePause}>Resume</button>
              <button className="menu-button" onClick={handleReturnToMenu}>Return to Menu</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .game-screen {
          width: 100vw;
          height: 100vh;
          position: relative;
          overflow: hidden;
          background-color: #000;
        }

        .game-view {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .game-hud {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          padding: 1rem;
          z-index: 10;
          pointer-events: none;
        }

        .score-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 500px;
          margin: 0 auto;
          background-color: rgba(0, 0, 0, 0.7);
          border-radius: 10px;
          padding: 0.5rem 1rem;
        }

        .score {
          font-size: 2rem;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 0 10px rgba(255, 102, 171, 0.7);
        }

        .combo {
          font-size: 1.8rem;
          color: #ff66ab;
          font-weight: bold;
        }

        .accuracy {
          font-size: 1.2rem;
          color: #fff;
        }

        .pause-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }

        .pause-menu {
          background-color: #2a2a2a;
          border-radius: 10px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 300px;
        }

        .pause-menu h2 {
          font-size: 2rem;
          color: #ff66ab;
          margin-bottom: 2rem;
        }

        .menu-button {
          background-color: #ff66ab;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 0.8rem 2rem;
          margin: 0.5rem 0;
          font-size: 1.2rem;
          cursor: pointer;
          transition: background-color 0.2s;
          width: 100%;
        }

        .menu-button:hover {
          background-color: #ff89c4;
        }
      `}</style>
    </div>
  );
};

export default GameScreen;
