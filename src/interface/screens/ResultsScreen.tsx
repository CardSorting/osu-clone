import React, { useEffect } from 'react';
import { useGame } from '@/interface/contexts/GameContext';
import { Grade } from '@/shared/types/game';

const ResultsScreen: React.FC = () => {
  const { state, actions } = useGame();
  
  // Map grade to display text and color
  const getGradeDisplay = (grade: Grade): { text: string; color: string } => {
    switch (grade) {
      case Grade.SS:
        return { text: 'SS', color: '#ffcc22' };
      case Grade.S:
        return { text: 'S', color: '#ffcc22' };
      case Grade.A:
        return { text: 'A', color: '#88b300' };
      case Grade.B:
        return { text: 'B', color: '#66ccff' };
      case Grade.C:
        return { text: 'C', color: '#ff66ab' };
      case Grade.D:
        return { text: 'D', color: '#ff6666' };
      default:
        return { text: 'F', color: '#aaaaaa' };
    }
  };
  
  // Get the current grade based on accuracy
  const getGrade = (): Grade => {
    const accuracy = state.accuracy;
    
    if (accuracy >= 1.0) return Grade.SS;
    if (accuracy >= 0.9) return Grade.S;
    if (accuracy >= 0.8) return Grade.A;
    if (accuracy >= 0.7) return Grade.B;
    if (accuracy >= 0.6) return Grade.C;
    if (accuracy >= 0.5) return Grade.D;
    return Grade.F;
  };
  
  // Get the current grade display
  const gradeDisplay = getGradeDisplay(getGrade());
  
  // Effect to animate the results
  useEffect(() => {
    // You could add animations here using CSS transitions
    const elements = document.querySelectorAll('.animate-in');
    elements.forEach((element, index) => {
      setTimeout(() => {
        (element as HTMLElement).style.opacity = '1';
        (element as HTMLElement).style.transform = 'translateY(0)';
      }, index * 100);
    });
  }, []);
  
  // Handle replay of the same beatmap
  const handleReplay = () => {
    if (state.selectedBeatmap) {
      actions.startGame(state.selectedBeatmap.id);
    }
  };
  
  // Handle return to menu
  const handleReturnToMenu = () => {
    actions.goToMenu();
  };

  return (
    <div className="results-screen">
      <div className="results-container">
        <h1 className="results-title animate-in">Results</h1>
        
        <div className="beatmap-info animate-in">
          {state.selectedBeatmap && (
            <>
              <h2>{state.selectedBeatmap.metadata.title}</h2>
              <p className="artist">{state.selectedBeatmap.metadata.artist}</p>
              <p className="mapper">Mapped by: {state.selectedBeatmap.metadata.creator}</p>
            </>
          )}
        </div>
        
        <div className="grade-display animate-in" style={{ color: gradeDisplay.color }}>
          {gradeDisplay.text}
        </div>
        
        <div className="stats-container">
          <div className="stat-box animate-in">
            <div className="stat-value">{state.score.toLocaleString()}</div>
            <div className="stat-label">Score</div>
          </div>
          
          <div className="stat-box animate-in">
            <div className="stat-value">x{state.combo}</div>
            <div className="stat-label">Max Combo</div>
          </div>
          
          <div className="stat-box animate-in">
            <div className="stat-value">{(state.accuracy * 100).toFixed(2)}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
        </div>
        
        <div className="hit-results animate-in">
          {/* In a real implementation, we would show the breakdown of hit results here */}
          <div className="hit-result">
            <span className="hit-count">0</span>
            <span className="hit-type" style={{ color: '#66ffcc' }}>Perfect</span>
          </div>
          <div className="hit-result">
            <span className="hit-count">0</span>
            <span className="hit-type" style={{ color: '#66ccff' }}>Great</span>
          </div>
          <div className="hit-result">
            <span className="hit-count">0</span>
            <span className="hit-type" style={{ color: '#ffcc66' }}>Good</span>
          </div>
          <div className="hit-result">
            <span className="hit-count">0</span>
            <span className="hit-type" style={{ color: '#ff6666' }}>Bad</span>
          </div>
          <div className="hit-result">
            <span className="hit-count">0</span>
            <span className="hit-type" style={{ color: '#bbbbbb' }}>Miss</span>
          </div>
        </div>
        
        <div className="results-actions">
          <button className="action-button animate-in" onClick={handleReplay}>
            Retry
          </button>
          <button className="action-button animate-in" onClick={handleReturnToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
      
      <style>{`
        .results-screen {
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
          color: white;
          overflow: auto;
        }
        
        .results-container {
          width: 90%;
          max-width: 800px;
          background-color: rgba(0, 0, 0, 0.6);
          border-radius: 10px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .results-title {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          color: #ff66ab;
          text-shadow: 0 0 10px rgba(255, 102, 171, 0.7);
        }
        
        .beatmap-info {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .beatmap-info h2 {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        
        .artist {
          font-style: italic;
          color: #cccccc;
          margin-bottom: 0.5rem;
        }
        
        .mapper {
          font-size: 0.9rem;
          color: #999999;
        }
        
        .grade-display {
          font-size: 8rem;
          font-weight: bold;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          margin: 1rem 0 2rem;
        }
        
        .stats-container {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 2rem;
        }
        
        .stat-box {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          flex: 1;
          margin: 0 0.5rem;
          text-align: center;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #ff66ab;
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: #cccccc;
        }
        
        .hit-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
          width: 100%;
        }
        
        .hit-result {
          display: flex;
          justify-content: space-between;
          width: 60%;
          margin: 0.3rem 0;
          padding: 0.5rem 1rem;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .hit-count {
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .hit-type {
          font-size: 1.2rem;
        }
        
        .results-actions {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        
        .action-button {
          background-color: #ff66ab;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 0.8rem 2rem;
          margin: 0 0.5rem;
          font-size: 1.2rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .action-button:hover {
          background-color: #ff89c4;
        }
        
        .animate-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
      `}</style>
    </div>
  );
};

export default ResultsScreen;
