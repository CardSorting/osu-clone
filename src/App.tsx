import React, { useEffect } from 'react';
import { GameProvider, useGame } from './interface/contexts/GameContext';
import MenuScreen from './interface/screens/MenuScreen';
import GameScreen from './interface/screens/GameScreen';
import ResultsScreen from './interface/screens/ResultsScreen';
import LoadingOverlay from './interface/components/LoadingOverlay';
import './App.css';

const AppContent: React.FC = () => {
  const { state, actions } = useGame();
  
  useEffect(() => {
    // Initialize the game on component mount
    actions.initialize();
  }, [actions]);

  // Render the appropriate screen based on the current game state
  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'menu':
        return <MenuScreen />;
      case 'game':
        return <GameScreen />;
      case 'results':
        return <ResultsScreen />;
      default:
        return <MenuScreen />;
    }
  };

  return (
    <div className="app-container">
      {renderScreen()}
      {state.isLoading && <LoadingOverlay />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
