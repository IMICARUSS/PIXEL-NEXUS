const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS to allow client from http://localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
}));

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// In-memory players store
const players = {};

io.on('connection', (socket) => {
  // Assign initial player data
  players[socket.id] = {
    x: 400,
    y: 300,
    playerId: socket.id,
  };

  // Send current players to the newly connected client
  socket.emit('currentPlayers', players);

  // Notify all other clients about the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Handle player movement updates
  socket.on('playerMovement', (movementData) => {
    if (!players[socket.id]) return;

    const { x, y } = movementData || {};
    if (typeof x === 'number') players[socket.id].x = x;
    if (typeof y === 'number') players[socket.id].y = y;

    // Broadcast the player's new position to other clients
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    // Remove player and notify others
    delete players[socket.id];
    socket.broadcast.emit('disconnect', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on http://localhost:${PORT}`);
});

module.exports = { app, server, io, players };