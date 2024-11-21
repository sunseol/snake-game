import React from 'react';
import styled from 'styled-components';
import Game from './components/Game';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%);
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <Game />
    </AppContainer>
  );
};

export default App;
