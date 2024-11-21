import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const StartScreenContainer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: #4ecca3;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px rgba(78, 204, 163, 0.3);
`;

const DifficultySelect = styled.div`
  margin-bottom: 2rem;
`;

const DifficultyButton = styled(motion.button)<{ $selected?: boolean }>`
  background: ${props => props.$selected ? '#4ecca3' : 'rgba(255, 255, 255, 0.1)'};
  border: none;
  padding: 0.8rem 1.5rem;
  margin: 0 0.5rem;
  color: white;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: ${props => props.$selected ? '#45b393' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const StartButton = styled(motion.button)`
  background: #fc5185;
  border: none;
  padding: 1rem 2rem;
  color: white;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    background: #e64677;
  }
`;

const HighScore = styled.div`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #4ecca3;
`;

interface StartScreenProps {
  onStart: (difficulty: string) => void;
  highScore: number;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, highScore }) => {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('normal');

  return (
    <StartScreenContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Title>Snake Game</Title>
      <HighScore>최고 점수: {highScore}</HighScore>
      <DifficultySelect>
        <DifficultyButton
          $selected={selectedDifficulty === 'easy'}
          onClick={() => setSelectedDifficulty('easy')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          쉬움
        </DifficultyButton>
        <DifficultyButton
          $selected={selectedDifficulty === 'normal'}
          onClick={() => setSelectedDifficulty('normal')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          보통
        </DifficultyButton>
        <DifficultyButton
          $selected={selectedDifficulty === 'hard'}
          onClick={() => setSelectedDifficulty('hard')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          어려움
        </DifficultyButton>
      </DifficultySelect>
      <StartButton
        onClick={() => onStart(selectedDifficulty)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        게임 시작
      </StartButton>
    </StartScreenContainer>
  );
};

export default StartScreen;
