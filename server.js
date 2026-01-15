const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

// Gunakan PORT dari environment variable jika ada (untuk deployment), atau 3001 untuk lokal
const PORT = process.env.PORT || 3001;

const io = new Server(PORT, {
  cors: {
    origin: "*", // Izinkan koneksi dari mana saja (sesuaikan untuk production)
  },
});

// --- DATABASE SETUP ---
const DB_FILE = path.join(__dirname, "database.json");
let db = {};

// 1. Cek dan Buat Database jika belum ada
if (!fs.existsSync(DB_FILE)) {
  console.log("⚠️ database.json tidak ditemukan. Membuat database baru...");
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
    console.log("✅ database.json berhasil dibuat.");
  } catch (e) {
    console.error("❌ Gagal membuat database.json:", e);
  }
}

// 2. Load Database
try {
  const data = fs.readFileSync(DB_FILE, "utf8");
  db = JSON.parse(data);
  console.log(`📂 Database dimuat. Total player terdaftar: ${Object.keys(db).length}`);
} catch (e) {
  console.error("❌ Error membaca database:", e);
  db = {};
}

// Helper: Simpan DB
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    // console.log("💾 Database disimpan."); // Uncomment untuk debug
  } catch (e) {
    console.error("❌ Gagal menyimpan database:", e);
  }
}
// ----------------------

let players = {};

io.on("connection", (socket) => {
  console.log("🔌 User connected: " + socket.id);

  socket.on("joinGame", ({ walletAddress, username, character }) => {
    let playerData;

    console.log(`👤 Join Request - Wallet: ${walletAddress || "Guest"}, User: ${username}`);

    // Jika user login dengan wallet
    if (walletAddress && db[walletAddress]) {
      // A. LOAD PROGRESS (User Lama)
      console.log(`🔄 Memuat progress untuk wallet: ${walletAddress}`);
      playerData = { ...db[walletAddress] };
      playerData.playerId = socket.id; // Update socket ID session ini
      
      // Opsional: Update username jika berbeda (misal user ganti nama di intro tapi pakai wallet lama)
      if (!playerData.username) playerData.username = username;

    } else {
      // B. NEW GAME (User Baru / Guest)
      playerData = {
        x: 400,
        y: 300,
        playerId: socket.id,
        rotation: 0,
        username: username || "Player",
        character: character || "dude",
        walletAddress: walletAddress || null, // Simpan wallet jika ada
      };

      // SAVE IMMEDIATELY: Jika user login dengan wallet, langsung simpan ke DB
      // agar ID wallet mereka tercatat meskipun belum bergerak.
      if (walletAddress) {
        console.log(`🆕 Mendaftarkan wallet baru: ${walletAddress}`);
        db[walletAddress] = {
          x: playerData.x,
          y: playerData.y,
          rotation: playerData.rotation,
          username: playerData.username,
          character: playerData.character,
          walletAddress: walletAddress
        };
        saveDB();
      }
    }

    // Simpan ke session memory
    players[socket.id] = playerData;

    // SINGLE PLAYER MODE:
    // Hanya kirim data pemain ini sendiri. Tidak perlu kirim list semua pemain.
    // Kita bungkus dalam object agar formatnya sesuai dengan yang diharapkan client.
    const response = {};
    response[socket.id] = playerData;
    socket.emit("currentPlayers", response);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected: " + socket.id);
    delete players[socket.id];
  });

  socket.on("playerMovement", (movementData) => {
    if (players[socket.id]) {
      const p = players[socket.id];
      
      p.x = movementData.x;
      p.y = movementData.y;
      p.rotation = movementData.rotation;
      if (movementData.username) p.username = movementData.username;
      if (movementData.character) p.character = movementData.character;

      // Auto-save ke database jika pemain punya wallet
      if (p.walletAddress) {
        // Update data di objek db
        db[p.walletAddress] = {
          x: p.x,
          y: p.y,
          rotation: p.rotation,
          username: p.username,
          character: p.character,
          walletAddress: p.walletAddress
        };
        saveDB(); // Tulis ke file
      }
    }
  });

  // Check if profile exists (for intro flow)
  socket.on("checkProfile", ({ walletAddress }) => {
    if (walletAddress && db[walletAddress]) {
      socket.emit("profileCheckResult", { exists: true, username: db[walletAddress].username });
    } else {
      socket.emit("profileCheckResult", { exists: false });
    }
  });

  socket.on("updateProfile", ({ username }) => {
    if (players[socket.id]) {
      const p = players[socket.id];
      p.username = username;
      
      // Save DB akan ter-trigger di event playerMovement berikutnya atau bisa dipanggil manual di sini
      if (p.walletAddress) {
        db[p.walletAddress].username = username;
        saveDB();
      }
    }
  });
});

console.log(`🚀 Socket.IO server running on port ${PORT}`);