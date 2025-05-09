import React, { useEffect } from 'react';
import { useGame } from '@/interface/contexts/GameContext';

const MenuScreen: React.FC = () => {
  const { state, actions } = useGame();

  // Load beatmaps when component mounts if they're not already loaded
  useEffect(() => {
    if (state.availableBeatmaps.length === 0 && !state.isLoading) {
      actions.loadBeatmaps();
    }
  }, [state.availableBeatmaps.length, state.isLoading, actions]);

  // Start the game with selected beatmap
  const handleStartGame = (beatmapId: string) => {
    actions.startGame(beatmapId);
  };

  return (
    <div className="menu-screen">
      <div className="menu-header">
        <h1 className="game-title">osu! Clone</h1>
        <p className="game-subtitle">A rhythm game built with React and Three.js</p>
      </div>

      <div className="beatmap-list">
        <h2>Select a Beatmap</h2>
        {state.availableBeatmaps.length > 0 ? (
          <div className="beatmap-grid">
            {state.availableBeatmaps.map((beatmap) => (
              <div 
                key={beatmap.id} 
                className="beatmap-card"
                onClick={() => handleStartGame(beatmap.id)}
              >
                <div className="beatmap-image">
                  {beatmap.metadata.backgroundImage ? (
                    <img
                      src={beatmap.metadata.backgroundImage}
                      alt={beatmap.metadata.title}
                    />
                  ) : (
                    <div className="beatmap-placeholder">
                      <span>{beatmap.metadata.title.substring(0, 1)}</span>
                    </div>
                  )}
                </div>
                <div className="beatmap-info">
                  <h3>{beatmap.metadata.title}</h3>
                  <p className="beatmap-artist">{beatmap.metadata.artist}</p>
                  <p className="beatmap-creator">Mapped by: {beatmap.metadata.creator}</p>
                  <div className="beatmap-details">
                    <span className="beatmap-difficulty">
                      AR: {beatmap.difficulty.approachRate.toFixed(1)}
                    </span>
                    <span className="beatmap-difficulty">
                      CS: {beatmap.difficulty.circleSize.toFixed(1)}
                    </span>
                    <span className="beatmap-length">
                      {Math.floor(beatmap.totalLength / 1000 / 60)}:{((beatmap.totalLength / 1000) % 60).toFixed(0).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-beatmaps">
            {state.isLoading ? 'Loading beatmaps...' : 'No beatmaps available.'}
          </p>
        )}
      </div>

      <div className="menu-footer">
        <p>
          Press on a beatmap to start playing
        </p>
      </div>

      <style>{`
        .menu-screen {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #1a1a1a;
          color: white;
          padding: 2rem;
          overflow: auto;
        }

        .menu-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .game-title {
          font-size: 4rem;
          color: #ff66ab;
          margin-bottom: 0.5rem;
        }

        .game-subtitle {
          font-size: 1.2rem;
          color: #aaa;
        }

        .beatmap-list {
          flex: 1;
        }

        .beatmap-list h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: #ff9ed2;
        }

        .beatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .beatmap-card {
          background-color: #2a2a2a;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .beatmap-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }

        .beatmap-image {
          height: 150px;
          background-color: #333;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .beatmap-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .beatmap-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #ff66ab, #7f66ff);
        }

        .beatmap-placeholder span {
          font-size: 3rem;
          font-weight: bold;
          color: white;
        }

        .beatmap-info {
          padding: 1rem;
        }

        .beatmap-info h3 {
          margin: 0 0 0.5rem;
          font-size: 1.2rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .beatmap-artist {
          color: #ccc;
          margin: 0 0 0.5rem;
          font-style: italic;
        }

        .beatmap-creator {
          color: #999;
          font-size: 0.9rem;
          margin: 0 0 0.5rem;
        }

        .beatmap-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #aaa;
        }

        .beatmap-difficulty {
          background-color: rgba(255, 102, 171, 0.2);
          color: #ff66ab;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .no-beatmaps {
          text-align: center;
          color: #999;
          font-style: italic;
        }

        .menu-footer {
          text-align: center;
          margin-top: 2rem;
          color: #aaa;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default MenuScreen;
