interface User {
  id: string;
  username: string;
  password: string;
  gameInProgress: boolean;
  symbol: string;
}

const users: User[] = [
  { id: 'abc123', username: 'john', password: 'password', gameInProgress: false, symbol: '' },
  { id: 'def456', username: 'jane', password: 'password', gameInProgress: true, symbol: '' },
];

const validateUserId = (userId: string): boolean => {
  const user = users.find((u) => u.id === userId);
  return !!user;
};

export default validateUserId;
