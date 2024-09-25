import React, { useState, useEffect } from 'react';

const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const initialBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
initialBoard[3][3] = WHITE;
initialBoard[3][4] = BLACK;
initialBoard[4][3] = BLACK;
initialBoard[4][4] = WHITE;

const AI_LEVELS = {
  WEAK: 'WEAK',
  NORMAL: 'NORMAL',
  HARD: 'HARD'
};

const App = () => {
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState(BLACK);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [flippingCells, setFlippingCells] = useState([]);
  const [gameMode, setGameMode] = useState(null);
  const [aiLevel, setAiLevel] = useState(null);

  useEffect(() => {
    if (gameMode) {
      checkGameOver();
      updateValidMoves();
      if (gameMode === 'AI' && currentPlayer === WHITE && !gameOver) {
        setTimeout(makeAIMove, 500);
      }
    }
  }, [board, currentPlayer, gameMode, gameOver]);

  const startGame = (mode, level = null) => {
    setBoard(initialBoard);
    setCurrentPlayer(BLACK);
    setGameOver(false);
    setWinner(null);
    setGameMode(mode);
    setAiLevel(level);
  };

  const switchPlayer = () => {
    setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
  };

  const isValidMove = (row, col, checkingPlayer = currentPlayer) => {
    if (board[row][col] !== EMPTY) return false;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      let x = row + dx;
      let y = col + dy;
      let foundOpponent = false;

      while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        if (board[x][y] === EMPTY) break;
        if (board[x][y] === checkingPlayer) {
          if (foundOpponent) return true;
          break;
        }
        foundOpponent = true;
        x += dx;
        y += dy;
      }
    }

    return false;
  };

  const updateValidMoves = () => {
    const newValidMoves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidMove(row, col)) {
          newValidMoves.push([row, col]);
        }
      }
    }
    setValidMoves(newValidMoves);
  };

  const makeMove = (row, col) => {
    if (gameOver || !isValidMove(row, col)) return;

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    const cellsToFlip = [];

    for (const [dx, dy] of directions) {
      let x = row + dx;
      let y = col + dy;
      const tilesToFlip = [];

      while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        if (newBoard[x][y] === EMPTY) break;
        if (newBoard[x][y] === currentPlayer) {
          cellsToFlip.push(...tilesToFlip);
          break;
        }
        tilesToFlip.push([x, y]);
        x += dx;
        y += dy;
      }
    }

    setFlippingCells(cellsToFlip);

    setTimeout(() => {
      for (const [fx, fy] of cellsToFlip) {
        newBoard[fx][fy] = currentPlayer;
      }
      setBoard(newBoard);
      setFlippingCells([]);
      switchPlayer();
    }, 500);
  };

  const makeAIMove = () => {
    let bestMove;
    switch (aiLevel) {
      case AI_LEVELS.WEAK:
        bestMove = getRandomMove();
        break;
      case AI_LEVELS.NORMAL:
        bestMove = getBestMove(2);
        break;
      case AI_LEVELS.HARD:
        bestMove = getBestMove(4);
        break;
      default:
        bestMove = getRandomMove();
    }
    if (bestMove) {
      makeMove(bestMove[0], bestMove[1]);
    } else {
      switchPlayer();
    }
  };

  const getRandomMove = () => {
    if (validMoves.length === 0) return null;
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  };

  const getBestMove = (depth) => {
    const moves = validMoves;
    let bestScore = -Infinity;
    let bestMove = null;

    for (const [row, col] of moves) {
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = WHITE;
      const score = minimax(newBoard, depth - 1, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = [row, col];
      }
    }

    return bestMove;
  };

  const minimax = (board, depth, isMaximizing) => {
    if (depth === 0) {
      return evaluateBoard(board);
    }

    const moves = getValidMovesForBoard(board, isMaximizing ? WHITE : BLACK);

    if (moves.length === 0) {
      return evaluateBoard(board);
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const [row, col] of moves) {
        const newBoard = board.map(row => [...row]);
        newBoard[row][col] = WHITE;
        const score = minimax(newBoard, depth - 1, false);
        bestScore = Math.max(bestScore, score);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const [row, col] of moves) {
        const newBoard = board.map(row => [...row]);
        newBoard[row][col] = BLACK;
        const score = minimax(newBoard, depth - 1, true);
        bestScore = Math.min(bestScore, score);
      }
      return bestScore;
    }
  };

  const getValidMovesForBoard = (board, player) => {
    const moves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidMoveForBoard(board, row, col, player)) {
          moves.push([row, col]);
        }
      }
    }
    return moves;
  };

  const isValidMoveForBoard = (board, row, col, player) => {
    if (board[row][col] !== EMPTY) return false;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      let x = row + dx;
      let y = col + dy;
      let foundOpponent = false;

      while (x >= 0 & x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        if (board[x][y] === EMPTY) break;
        if (board[x][y] === player) {
          if (foundOpponent) return true;
          break;
        }
        foundOpponent = true;
        x += dx;
        y += dy;
      }
    }

    return false;
  };

  const evaluateBoard = (board) => {
    const whiteCount = board.flat().filter(cell => cell === WHITE).length;
    const blackCount = board.flat().filter(cell => cell === BLACK).length;
    return whiteCount - blackCount;
  };

  const checkGameOver = () => {
    const blackCount = board.flat().filter(cell => cell === BLACK).length;
    const whiteCount = board.flat().filter(cell => cell === WHITE).length;
    const emptyCount = board.flat().filter(cell => cell === EMPTY).length;

    if (emptyCount === 0 || blackCount === 0 || whiteCount === 0) {
      setGameOver(true);
      if (blackCount > whiteCount) {
        setWinner(BLACK);
      } else if (whiteCount > blackCount) {
        setWinner(WHITE);
      } else {
        setWinner(EMPTY); // Draw
      }
    }
  };

  const getScore = (player) => {
    return board.flat().filter(cell => cell === player).length;
  };

  const isValidMoveCell = (row, col) => {
    return validMoves.some(([r, c]) => r === row && c === col);
  };

  const isFlipping = (row, col) => {
    return flippingCells.some(([r, c]) => r === row && c === col);
  };

  if (!gameMode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200">
        <h1 className="text-4xl font-bold mb-8">オセロ</h1>
        <div className="flex flex-col space-y-4">
          <button 
            className="w-48 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={() => startGame('2P')}
          >
            2人プレイ
          </button>
          <button 
            className="w-48 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            onClick={() => startGame('AI', AI_LEVELS.WEAK)}
          >
            コンピューター (弱い)
          </button>
          <button 
            className="w-48 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            onClick={() => startGame('AI', AI_LEVELS.NORMAL)}
          >
            コンピューター (普通)
          </button>
          <button 
            className="w-48 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            onClick={() => startGame('AI', AI_LEVELS.HARD)}
          >
            コンピューター (強い)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-gray-200 min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">オセロ</h1>
      <div className="flex justify-between w-96 mb-4">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-black rounded-full mr-2"></div>
          <span className="font-bold">黒: {getScore(BLACK)}</span>
        </div>
        <div className="flex items-center">
          <span className="font-bold">白: {getScore(WHITE)}</span>
          <div className="w-6 h-6 bg-white border border-black rounded-full ml-2"></div>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1 bg-green-700 p-2">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`w-12 h-12 rounded-full relative ${
                cell === EMPTY ? 'bg-green-600' :
                (cell === BLACK ? 'bg-black' : 'bg-white border border-black')
              } transition-all duration-300 ease-in-out ${
                isFlipping(rowIndex, colIndex) ? 'animate-flip' : ''
              }`}
              onClick={() => makeMove(rowIndex, colIndex)}
              disabled={gameOver || !isValidMoveCell(rowIndex, colIndex) || (gameMode === 'AI' && currentPlayer === WHITE)}
            >
              {cell === EMPTY && isValidMoveCell(rowIndex, colIndex) && (
                <div className="absolute inset-0 bg-gray-500 bg-opacity-50 rounded-full hover:bg-yellow-500 hover:bg-opacity-50 transition-colors duration-200"></div>
              )}
            </button>
          ))
        )}
      </div>
      <div className="mt-4 flex items-center">
        <span className="mr-2">現在のプレイヤー:</span>
        <div className={`w-6 h-6 rounded-full ${currentPlayer === BLACK ? 'bg-black' : 'bg-white border border-black'}`}></div>
      </div>
      {gameOver && (
        <div className="mt-4 text-xl font-bold">
          {winner === EMPTY ? "引き分け" : (winner === BLACK ? "黒" : "白") + "の勝利!"}
        </div>
      )}
      <button 
        className="mt-8 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        onClick={() => setGameMode(null)}
      >
        メニューに戻る
      </button>
    </div>
  );
};

export default App;