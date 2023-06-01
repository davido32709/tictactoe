import express, { Request, Response, NextFunction } from 'express';

interface User {
  id: string;
  username: string;
  password: string;
  gameInProgress: boolean;
  symbol: string;
}

interface Game {
  id: string;
  board: string[][];
  currentPlayer: User;
  player1?: User;
  player2?: User;
}

let gameHistory: Game[] = [];

const app = express();
app.use(express.json());

const users: User[] = [];
let games: Game[] = [];

const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['user_id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
};

const checkGameInProgress = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as User;
  if (user.gameInProgress) {
    return res.status(400).json({ error: 'Game already in progress' });
  }

  const gameId = req.params.gameId;
  const game = games.find((g) => g.id === gameId);
  if (game && game.player2) {
    return res.status(400).json({ error: 'Opponent is still playing' });
  }

  next();
};
app.post('/register', (req: Request, res: Response) => {
  // ... kod rejestracji użytkownika ...

  const newUser: User = { id: generateUniqueId(), username, password, gameInProgress: false, symbol: '' };
  users.push(newUser);

  return res.status(201).json({ message: 'User registered successfully' });
});
app.post('/game', authenticateUser, checkGameInProgress, (req: Request, res: Response) => {
  const user = req.user as User;

  const gameId = generateUniqueId();
  const game: Game = {
    id: gameId,
    board: [['', '', ''], ['', '', ''], ['', '', '']],
    currentPlayer: user,
  };
  const symbols = ['X', 'O'];
  const randomIndex = Math.floor(Math.random() * symbols.length);
  user.symbol = symbols[randomIndex];

  if (!game.player1) {
    game.player1 = user;
  } else {
    game.player2 = user;
  }

  games.push(game);
  user.gameInProgress = true;

  return res.status(200).json({ gameId, symbol: user.symbol });
});

app.post('/game/:gameId/move', authenticateUser, (req: Request, res: Response) => {
  const user = req.user as User;
  const gameId = req.params.gameId;
  const game = games.find((g) => g.id === gameId);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (game.player1 !== user && game.player2 !== user) {
    return res.status(401).json({ error: 'Unauthorized to make a move' });
  }

  if (game.currentPlayer !== user) {
    return res.status(400).json({ error: 'Not your turn' });
  }

  const { row, column } = req.body;
  if (!isValidMove(row, column)) {
    return res.status(400).json({ error: 'Invalid move' });
  }

  const symbol = user.symbol;
  const board = game.board;

  if (board[row][column] !== '') {
    return res.status(400).json({ error: 'Invalid move, the position is already occupied' });
  }

  board[row][column] = symbol;
  game.currentPlayer = game.currentPlayer === game.player1 ? game.player2! : game.player1!;

  const result = checkGameResult(board);
  if (result) {
    game.player1!.gameInProgress = false;
    game.player2!.gameInProgress = false;
    games = games.filter((g) => g.id !== gameId);
    return res.status(200).json({ message: 'Game over', result });
  }

  return res.status(200).json({ message: 'Move successfully made' });
});
app.get('/game/:gameId/board', authenticateUser, (req: Request, res: Response) => {
  const user = req.user as User;
  const gameId = req.params.gameId;
  const game = games.find((g) => g.id === gameId);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (game.player1 !== user && game.player2 !== user) {
    return res.status(401).json({ error: 'Unauthorized to access game board' });
  }

  const board = game.board;
  const symbol = user.symbol;

  return res.status(200).json({ board, symbol });
});

app.get('/users', (req: Request, res: Response) => {
  const userList = users.map((user) => ({
    id: user.id,
    username: user.username,
  }));

  return res.status(200).json(userList);
});

app.get('/games/history', (req: Request, res: Response) => {
  return res.status(200).json(gameHistory);
});

const saveGameToHistory = (game: Game) => {
  gameHistory.push(game);
};

const isValidMove = (row: number, column: number): boolean => {
  return row >= 0 && row < 3 && column >= 0 && column < 3;
};

const isGameDraw = (game: Game): boolean => {
  const board = game.board;

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === '') {
        return false; 
      }
    }
  }

  return true; 
};

const isGameWon = (game: Game): boolean => {
  const board = game.board;

  const winningCombinations = [
    [[0, 0], [0, 1], [0, 2]], 
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]], 
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]], 
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (const combination of winningCombinations) {
    const [i1, j1] = combination[0];
    const [i2, j2] = combination[1];
    const [i3, j3] = combination[2];

    if (
      board[i1][j1] !== '' &&
      board[i1][j1] === board[i2][j2] &&
      board[i1][j1] === board[i3][j3]
    ) {
      return true; 
    }
  }

  return false; 
};

const isGameEnded = (game: Game): boolean => {
  return isGameWon(game) || isGameDraw(game);
};

const endGame = (game: Game) => {
 const gameIndex = games.findIndex((g) => g.id === game.id);

  if (gameIndex === -1) {
    return;
  }

  games.splice(gameIndex, 1);

  if (game.player1) {
    game.player1.gameInProgress = false;
  }
  if (game.player2) {
    game.player2.gameInProgress = false;
  }

  if (isGameWon(game)) {

    game.result = 'win';

    console.log('Won!');  
    
    handleWin(game);

  }
  else if (isGameDraw(game)) {

    game.result = 'draw';

    console.log('Draw!');  
    
    handleDraw(game);
  }

  saveGameToHistory(game);

};

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
