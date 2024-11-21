import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';
import StartScreen from './StartScreen';
import MobileControls from './MobileControls';

// Types
type Position = {
  x: number;
  y: number;
};

type PowerUp = {
  type: 'speed' | 'slow' | 'points' | 'shield';
  position: Position;
  duration: number;
};

type Difficulty = {
  speed: number;
  speedIncrement: number;
  initialLength: number;
  powerUpChance: number;
};

type PowerUpNotification = {
  type: keyof typeof POWERUP_TYPES;
  timestamp: number;
};

// Constants
const GRID_SIZE = 20;
const BASE_CELL_SIZE = 20;

const POWERUP_TYPES = {
  speed: { duration: 5000, color: '#ffd700', emoji: '⚡' },
  slow: { duration: 5000, color: '#87ceeb', emoji: '❄️' },
  points: { duration: 0, color: '#ff69b4', emoji: '💎' },
  shield: { duration: 10000, color: '#9370db', emoji: '🛡️' },
};

const POWERUP_MESSAGES = {
  speed: '속도 증가!',
  slow: '속도 감소!',
  points: '추가 점수 +50!',
  shield: '무적 상태!',
};

const DIFFICULTY_SETTINGS: Record<string, Difficulty> = {
  easy: { 
    speed: 150, 
    speedIncrement: 5, 
    initialLength: 3,
    powerUpChance: 0.4  // 40% 확률
  },
  normal: { 
    speed: 120, 
    speedIncrement: 8, 
    initialLength: 4,
    powerUpChance: 0.2  // 20% 확률
  },
  hard: { 
    speed: 100, 
    speedIncrement: 10, 
    initialLength: 5,
    powerUpChance: 0.1  // 10% 확률
  },
};

// Styled Components
const GameContainer = styled.div`
  display: flex;
  gap: 2rem;
  padding: 2rem;
  min-height: 100vh;
  background: #232931;
  color: #4ecca3;
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }
`;

const GameBoard = styled.div<{ $size: number }>`
  position: relative;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  background: #393e46;
  border: 2px solid #4ecca3;
  border-radius: 10px;
  overflow: hidden;
  margin: 0 auto;
`;

const InfoPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 300px;
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
    gap: 1rem;
  }
`;

const ScoreBoard = styled.div`
  background: #393e46;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Rules = styled.div`
  background: #393e46;
  padding: 2rem;
  border-radius: 10px;
  
  @media (max-width: 768px) {
    padding: 1rem;
    font-size: 0.9rem;
  }
`;

const SnakeSegment = styled(motion.div)<{ $isHead: boolean; $size: number }>`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  background: ${props => props.$isHead ? '#4ecca3' : '#45b393'};
  border-radius: 4px;
  z-index: 1;
`;

const ShieldEffect = styled(motion.div)<{ $size: number }>`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  border: 2px solid #9370db;
  border-radius: 4px;
  z-index: 0;
`;

const Food = styled(motion.div)<{ $size: number }>`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  background: #ff6b6b;
  border-radius: 50%;
`;

const PowerUpItem = styled(motion.div)<{ $color: string; $size: number }>`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  background: ${props => props.$color}40;
  border: 2px solid ${props => props.$color};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.$size * 0.8}px;
`;

const PowerUpNotificationContainer = styled(motion.div)`
  margin-top: 1rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
`;

const GameOverOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
`;

const RestartButton = styled(motion.button)`
  background: #4ecca3;
  border: none;
  padding: 1rem 2rem;
  color: white;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    background: #45b393;
  }
`;

const PowerUpIndicator = styled.div<{ $color: string }>`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  background: ${props => props.$color}40;
  border: 2px solid ${props => props.$color};
  border-radius: 4px;
  color: white;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 5px;
`;

// 사운드 효과
const useGameSounds = () => {
  const [playEat] = useSound('/sounds/eat.mp3');
  const [playGameOver] = useSound('/sounds/gameover.mp3');
  const [playMove] = useSound('/sounds/move.mp3');

  return {
    playEat,
    playGameOver,
    playMove,
  };
};

const useCellSize = () => {
  const [cellSize, setCellSize] = useState(BASE_CELL_SIZE);

  useEffect(() => {
    const calculateCellSize = () => {
      const minScreenSize = Math.min(window.innerWidth - 40, window.innerHeight - 40);
      const maxGameSize = Math.min(minScreenSize, 600); // 최대 게임 크기 제한
      setCellSize(Math.floor(maxGameSize / GRID_SIZE));
    };

    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);
    return () => window.removeEventListener('resize', calculateCellSize);
  }, []);

  return cellSize;
};

const Game: React.FC = () => {
  const cellSize = useCellSize();
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Position>({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTY_SETTINGS.normal);
  const [speed, setSpeed] = useState(DIFFICULTY_SETTINGS.normal.speed);
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [activePowerUps, setActivePowerUps] = useState<string[]>([]);
  const [notification, setNotification] = useState<PowerUpNotification | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const sounds = useGameSounds();

  const generatePowerUp = useCallback(() => {
    if (Math.random() < difficulty.powerUpChance) {
      const types = Object.keys(POWERUP_TYPES) as Array<keyof typeof POWERUP_TYPES>;
      const type = types[Math.floor(Math.random() * types.length)];
      const position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      setPowerUp({ type, position, duration: POWERUP_TYPES[type].duration });
    }
  }, [difficulty.powerUpChance]);

  const handlePowerUp = (type: keyof typeof POWERUP_TYPES) => {
    // 알림 표시
    setNotification({ type, timestamp: Date.now() });
    setTimeout(() => setNotification(null), 2000);

    switch (type) {
      case 'speed':
        setSpeed(prev => prev * 0.7);
        setTimeout(() => setSpeed(difficulty.speed), POWERUP_TYPES.speed.duration);
        break;
      case 'slow':
        setSpeed(prev => prev * 1.5);
        setTimeout(() => setSpeed(difficulty.speed), POWERUP_TYPES.slow.duration);
        break;
      case 'points':
        setScore(prev => prev + 50);
        break;
      case 'shield':
        setActivePowerUps(prev => [...prev, 'shield']);
        setTimeout(() => {
          setActivePowerUps(prev => prev.filter(p => p !== 'shield'));
        }, POWERUP_TYPES.shield.duration);
        break;
    }
  };

  const handleCollision = (head: Position): boolean => {
    const hasCollision = head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE ||
      snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);

    if (hasCollision && activePowerUps.includes('shield')) {
      // 중앙으로 이동
      const centerX = Math.floor(GRID_SIZE / 2);
      const centerY = Math.floor(GRID_SIZE / 2);
      
      setSnake(prev => [
        { x: centerX, y: centerY },
        ...prev.slice(1)
      ]);

      // 깜빡임 효과
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 500);

      return false;
    }

    return hasCollision;
  };

  const startGame = (difficultyLevel: string) => {
    const settings = DIFFICULTY_SETTINGS[difficultyLevel];
    setDifficulty(settings);
    setSpeed(settings.speed);
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 1, y: 0 }); // 초기 방향을 오른쪽으로 설정
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    generateFood();
  };

  const resetGame = () => {
    setIsPlaying(false);
  };

  const handleDirectionChange = (x: number, y: number) => {
    if ((x !== 0 && direction.x === 0) || (y !== 0 && direction.y === 0)) {
      setDirection({ x, y });
      sounds.playMove();
    }
  };

  const generateFood = useCallback(() => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // 뱀의 몸과 겹치지 않는 위치 찾기
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    setFood(newFood);
  }, [snake]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      switch(e.key) {
        case 'ArrowUp':
          if (direction.y === 0) {
            setDirection({ x: 0, y: -1 });
            sounds.playMove();
          }
          break;
        case 'ArrowDown':
          if (direction.y === 0) {
            setDirection({ x: 0, y: 1 });
            sounds.playMove();
          }
          break;
        case 'ArrowLeft':
          if (direction.x === 0) {
            setDirection({ x: -1, y: 0 });
            sounds.playMove();
          }
          break;
        case 'ArrowRight':
          if (direction.x === 0) {
            setDirection({ x: 1, y: 0 });
            sounds.playMove();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isPlaying, sounds]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      const newSnake = [...snake];
      const head = {
        x: newSnake[0].x + direction.x,
        y: newSnake[0].y + direction.y,
      };

      if (handleCollision(head)) {
        setGameOver(true);
        sounds.playGameOver();
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('snakeHighScore', score.toString());
        }
        return;
      }

      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;

      newSnake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setSpeed(prev => Math.max(prev - difficulty.speedIncrement, 50));
        generateFood();
        generatePowerUp();
        sounds.playEat();
      } else if (powerUp && head.x === powerUp.position.x && head.y === powerUp.position.y) {
        handlePowerUp(powerUp.type);
        setPowerUp(null);
        sounds.playEat();
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    };

    if (direction.x !== 0 || direction.y !== 0) {
      const gameInterval = setInterval(moveSnake, speed);
      return () => clearInterval(gameInterval);
    }
  }, [snake, direction, food, gameOver, speed, generateFood, difficulty, score, highScore, isPlaying, sounds, powerUp, generatePowerUp, activePowerUps]);

  return (
    <GameContainer>
      <AnimatePresence>
        {!isPlaying && (
          <StartScreen onStart={startGame} highScore={highScore} />
        )}
      </AnimatePresence>
      <GameBoard $size={cellSize * GRID_SIZE}>
        {snake.map((segment, index) => (
          <React.Fragment key={index}>
            <SnakeSegment
              $isHead={index === 0}
              $size={cellSize}
              style={{
                left: segment.x * cellSize,
                top: segment.y * cellSize,
              }}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: 1,
                opacity: isBlinking && index === 0 ? [1, 0.3, 1] : 1 
              }}
              transition={{ 
                duration: isBlinking && index === 0 ? 0.5 : 0.2,
                repeat: isBlinking && index === 0 ? 2 : 0
              }}
            />
            {index === 0 && activePowerUps.includes('shield') && (
              <ShieldEffect
                $size={cellSize}
                style={{
                  left: segment.x * cellSize,
                  top: segment.y * cellSize,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 0.4, 0.8],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />
            )}
          </React.Fragment>
        ))}
        <Food
          $size={cellSize}
          style={{
            left: food.x * cellSize,
            top: food.y * cellSize,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
        />
        {powerUp && (
          <PowerUpItem
            $color={POWERUP_TYPES[powerUp.type].color}
            $size={cellSize}
            style={{
              left: powerUp.position.x * cellSize,
              top: powerUp.position.y * cellSize,
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          >
            {POWERUP_TYPES[powerUp.type].emoji}
          </PowerUpItem>
        )}
        {activePowerUps.map((type) => (
          <PowerUpIndicator key={type} $color={POWERUP_TYPES[type as keyof typeof POWERUP_TYPES].color}>
            {POWERUP_TYPES[type as keyof typeof POWERUP_TYPES].emoji}
            {type.toUpperCase()} 활성화
          </PowerUpIndicator>
        ))}
        <AnimatePresence>
          {notification && (
            <PowerUpNotificationContainer
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {POWERUP_TYPES[notification.type].emoji}
              {POWERUP_MESSAGES[notification.type]}
            </PowerUpNotificationContainer>
          )}
        </AnimatePresence>
        {gameOver && (
          <GameOverOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Game Over!</h2>
            <p>점수: {score}</p>
            {score === highScore && <p>🎉 새로운 최고 점수! 🎉</p>}
            <RestartButton
              onClick={resetGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              다시 시작
            </RestartButton>
          </GameOverOverlay>
        )}
      </GameBoard>
      <InfoPanel>
        <ScoreBoard>
          <h3>SCORE</h3>
          <h2>{score}</h2>
          <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
            최고 점수: {highScore}
          </div>
          <AnimatePresence>
            {notification && (
              <PowerUpNotificationContainer
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {POWERUP_TYPES[notification.type].emoji}
                {POWERUP_MESSAGES[notification.type]}
              </PowerUpNotificationContainer>
            )}
          </AnimatePresence>
        </ScoreBoard>
        <Rules>
          <h3>게임 규칙</h3>
          <ul>
            <li>방향키를 사용하여 뱀을 조종합니다</li>
            <li>빨간색 먹이를 먹으면 <span style={{ color: '#ff4444', fontWeight: 'bold' }}>+10점</span>을 획득합니다</li>
            <li>먹이를 먹을수록 <span style={{ color: '#ff4444', fontWeight: 'bold' }}>속도가 빨라집니다</span></li>
            <li><span style={{ color: '#ff4444', fontWeight: 'bold' }}>벽</span>이나 <span style={{ color: '#ff4444', fontWeight: 'bold' }}>자신의 몸</span>에 부딪히면 게임이 종료됩니다</li>
            <li>특별 아이템 효과:
              <ul>
                <li>⚡ 노란색: <span style={{ color: '#ff4444', fontWeight: 'bold' }}>속도 증가</span> (5초)</li>
                <li>❄️ 파란색: <span style={{ color: '#ff4444', fontWeight: 'bold' }}>속도 감소</span> (5초)</li>
                <li>💎 분홍색: <span style={{ color: '#ff4444', fontWeight: 'bold' }}>+50점</span></li>
                <li>🛡️ 보라색: <span style={{ color: '#ff4444', fontWeight: 'bold' }}>무적</span> (10초)</li>
              </ul>
            </li>
          </ul>
        </Rules>
      </InfoPanel>
      <MobileControls onDirectionChange={handleDirectionChange} />
    </GameContainer>
  );
};

export default Game;
