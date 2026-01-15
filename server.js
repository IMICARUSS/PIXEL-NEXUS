const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const io = new Server(3001, {
  cors: {
    origin: "*", // Izinkan koneksi dari mana saja (sesuaikan untuk production)
  },
});

// Simple Database Setup
const DB_FILE = path.join(__dirname, "database.json");
let db = {};

// Load database if exists
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    console.log("Database loaded.");
  } catch (e) {
    console.error("Error loading database:", e);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error saving database:", e);
  }
}

let players = {};

io.on("connection", (socket) => {
  console.log("a user connected: " + socket.id);

  socket.on("joinGame", ({ walletAddress, username, character }) => {
    let playerData;

    // Jika user login dengan wallet
    if (walletAddress && db[walletAddress]) {
      // LOAD PROGRESS: Ambil data dari database
      console.log(`Loading progress for wallet: ${walletAddress}`);
      playerData = { ...db[walletAddress] };
      playerData.playerId = socket.id; // Update socket ID session ini
      // Kita bisa memilih untuk mengupdate username jika user menggantinya di intro, 
      // atau tetap menggunakan yang di DB. Di sini kita prioritaskan DB jika sudah ada, 
      // tapi jika user ingin ubah, mereka bisa pakai fitur edit nanti.
    } else {
      // NEW GAME: Buat data baru
      playerData = {
        x: 400,
        y: 300,
        playerId: socket.id,
        rotation: 0,
        username: username || "Player",
        character: character || "dude",
        walletAddress: walletAddress || null, // Simpan wallet jika ada
      };
    }

    // Simpan ke session memory
    players[socket.id] = playerData;

    // Kirim data pemain yang sudah ada ke pemain baru
    socket.emit("currentPlayers", players);
    // Beritahu pemain lain bahwa ada pemain baru
    socket.broadcast.emit("newPlayer", players[socket.id]);
  });

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

      // Auto-save ke database jika pemain punya wallet
      const p = players[socket.id];
      if (p.walletAddress) {
        db[p.walletAddress] = {
          x: p.x,
          y: p.y,
          rotation: p.rotation,
          username: p.username,
          character: p.character,
          walletAddress: p.walletAddress
        };
        saveDB(); // Simpan perubahan posisi/karakter
      }

      socket.broadcast.emit("playerMoved", players[socket.id]);
    }
  });

  socket.on("updateProfile", ({ username }) => {
    if (players[socket.id]) {
      players[socket.id].username = username;
      // Save DB akan ter-trigger di event playerMovement berikutnya atau bisa dipanggil manual di sini
      const p = players[socket.id];
      if (p.walletAddress) {
        db[p.walletAddress].username = username;
        saveDB();
      }
      // Broadcast perubahan nama ke pemain lain
      socket.broadcast.emit("playerMoved", players[socket.id]);
    }
  });
});

console.log("Socket.IO server running on port 3001");