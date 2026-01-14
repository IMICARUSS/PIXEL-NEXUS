const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "*", // Izinkan koneksi dari mana saja (sesuaikan untuk production)
  },
});

let players = {};

io.on("connection", (socket) => {
  console.log("a user connected: " + socket.id);

  // Buat data pemain baru
  players[socket.id] = {
    x: 400,
    y: 300,
    playerId: socket.id,
    rotation: 0,
    username: "Player",
    character: "dude", // Default character
  };

  // Kirim data pemain yang sudah ada ke pemain baru
  socket.emit("currentPlayers", players);

  // Beritahu pemain lain bahwa ada pemain baru
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("disconnect", () => {
    console.log("user disconnected: " + socket.id);
    delete players[socket.id];
    io.emit("disconnect", socket.id);
  });

  socket.on("playerMovement", (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].rotation = movementData.rotation;
      if (movementData.username) players[socket.id].username = movementData.username;
      if (movementData.character) players[socket.id].character = movementData.character;

      socket.broadcast.emit("playerMoved", players[socket.id]);
    }
  });
});

console.log("Socket.IO server running on port 3001");