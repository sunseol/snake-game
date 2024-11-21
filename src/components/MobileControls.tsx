import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const ControlsContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: none;
  gap: 10px;
  
  @media (max-width: 768px) {
    display: grid;
    grid-template-areas:
      ". up ."
      "left . right"
      ". down .";
  }
`;

const ControlButton = styled(motion.button)`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(78, 204, 163, 0.2);
  border: 2px solid #4ecca3;
  color: #4ecca3;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  
  &:active {
    background: rgba(78, 204, 163, 0.4);
  }
`;

const UpButton = styled(ControlButton)`
  grid-area: up;
`;

const DownButton = styled(ControlButton)`
  grid-area: down;
`;

const LeftButton = styled(ControlButton)`
  grid-area: left;
`;

const RightButton = styled(ControlButton)`
  grid-area: right;
`;

interface MobileControlsProps {
  onDirectionChange: (x: number, y: number) => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onDirectionChange }) => {
  return (
    <ControlsContainer>
      <UpButton
        onTouchStart={() => onDirectionChange(0, -1)}
        whileTap={{ scale: 0.9 }}
      >
        ↑
      </UpButton>
      <DownButton
        onTouchStart={() => onDirectionChange(0, 1)}
        whileTap={{ scale: 0.9 }}
      >
        ↓
      </DownButton>
      <LeftButton
        onTouchStart={() => onDirectionChange(-1, 0)}
        whileTap={{ scale: 0.9 }}
      >
        ←
      </LeftButton>
      <RightButton
        onTouchStart={() => onDirectionChange(1, 0)}
        whileTap={{ scale: 0.9 }}
      >
        →
      </RightButton>
    </ControlsContainer>
  );
};

export default MobileControls;
