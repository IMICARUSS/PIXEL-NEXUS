"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Lazy import Phaser only on client to avoid SSR issues
let PhaserLib = null;

/**
 * @param {Object} props
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {string} [props.username]
 * @param {string} [props.character]
 * @param {string|null} [props.walletAddress]
 * @param {function} [props.onPlayerDataLoaded]
 */
export default function GameCanvas({ width = 800, height = 600, username = "Player", character = "dude", walletAddress = null, onPlayerDataLoaded }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use ref for username to avoid game restarts on name change and handle sync properly
  const usernameRef = useRef(username);
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    let phaserGame = null;
    let destroyed = false;

    async function init() {
      // Dynamic import so Next.js doesn't try to include Phaser on the server
      if (!PhaserLib) {
        const mod = await import("phaser");
        PhaserLib = mod.default ?? mod;
      }

      if (destroyed) return;

      class BootScene extends PhaserLib.Scene {
        constructor() {
          super("boot");
          this.player = null; // our player sprite
          this.playerNameText = null; // text object for username
          this.cursors = null; // cursor keys
          this.socket = null; // socket.io client
          this.oldPosition = { x: null, y: null, rotation: null }; // track last sent position
        }

        preload() {
          // Load spritesheets for all characters
          // Pastikan file Elvis.png dan Elton.png ada di folder public dan ukurannya sesuai (misal 32x48)
          const chars = ["dude", "Elvis", "Elton"];
          chars.forEach((char) => {
            this.load.spritesheet(char, `/${char}.png`, {
              frameWidth: 32,
              frameHeight: 48,
            });
          });
        }

        create() {
          const { width: w, height: h } = this.scale;

          // Create animations for each character
          ["dude", "Elvis", "Elton"].forEach((char) => {
            if (!this.anims.get(`left-${char}`)) {
              this.anims.create({
                key: `left-${char}`,
                frames: this.anims.generateFrameNumbers(char, { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1,
              });
            }
            if (!this.anims.get(`turn-${char}`)) {
              this.anims.create({
                key: `turn-${char}`,
                frames: [{ key: char, frame: 4 }],
                frameRate: 20,
              });
            }
            if (!this.anims.get(`right-${char}`)) {
              this.anims.create({
                key: `right-${char}`,
                frames: this.anims.generateFrameNumbers(char, { start: 5, end: 8 }),
                frameRate: 10,
                repeat: -1,
              });
            }
          });

          // Capture cursor keys
          this.cursors = this.input.keyboard.createCursorKeys();

          // Always create our local player immediately so single-player works even if socket fails
          this.player = this.physics.add.sprite(w / 2, h / 2, character);
          this.player.setScale(2);
          this.player.setCollideWorldBounds(true);
          this.player.anims.play(`turn-${character}`);

          // Create username text above player
          this.playerNameText = this.add.text(this.player.x, this.player.y - 50, username, {
            fontSize: "14px",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3,
            align: "center",
          }).setOrigin(0.5);

          // Socket.io setup (best-effort)
          const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
          try {
            this.socket = io(socketUrl);
          } catch (_) {
            this.socket = null; // offline fallback
          }

          if (this.socket) {
            // On successful connection, tag our playerId
            this.socket.on("connect", () => {
              this.player.playerId = this.socket.id;
              setIsConnected(true);
              
              // JOIN GAME: Kirim identitas kita (termasuk wallet untuk load save data)
              console.log("Sending joinGame with wallet:", walletAddress); // Debug log
              this.socket.emit("joinGame", {
                walletAddress: walletAddress,
                username: username,
                character: character,
                x: this.player.x,
                y: this.player.y,
              });
            });

            this.socket.on("disconnect", () => {
              setIsConnected(false);
            });
            
            this.socket.on("connect_error", (err) => {
              console.error("Socket connection error:", err);
              setIsConnected(false);
            });

            // Current players data received on connect
            this.socket.on("currentPlayers", (players) => {
              // If server already knows about us, update our pos to stay consistent
              const self = players[this.socket.id];
              if (self && this.player) {
                // LOAD SAVE DATA: Update posisi dan karakter lokal sesuai database server
                this.player.setPosition(self.x, self.y);
                // Jika karakter di save data berbeda dengan default, kita bisa update animasinya di sini
                if (self.username) {
                  this.playerNameText.setText(self.username);
                  // Update ref immediately to prevent update() loop from reverting it
                  usernameRef.current = self.username;
                }

                // SYNC TO PARENT: Beritahu React bahwa data profil telah dimuat dari server
                if (onPlayerDataLoaded) {
                  // Kita kirim data balik agar UI (seperti panel My Holdings) terupdate
                  // dengan username/karakter yang tersimpan di database.
                  onPlayerDataLoaded({ username: self.username, character: self.character });
                }
              }
            });

            // Cleanup socket when scene shuts down/restarts
            this.events.once(PhaserLib.Scenes.Events.SHUTDOWN, () => {
              try {
                this.socket && this.socket.disconnect();
              } catch (_) {}
            });
          }
        }

        update() {
          // Movement and animation logic for our player
          if (!this.player || !this.cursors) return;

          const speedX = 160;
          const speedY = 160;

          // Reset velocity at start of frame
          this.player.setVelocity(0, 0);

          const leftDown = this.cursors.left?.isDown;
          const rightDown = this.cursors.right?.isDown;
          const upDown = this.cursors.up?.isDown;
          const downDown = this.cursors.down?.isDown;

          // Horizontal movement + animation
          if (leftDown) {
            this.player.setVelocityX(-speedX);
            this.player.anims.play(`left-${character}`, true);
          } else if (rightDown) {
            this.player.setVelocityX(speedX);
            this.player.anims.play(`right-${character}`, true);
          }

          // Vertical movement (doesn't change animation per requirement)
          if (upDown) {
            this.player.setVelocityY(-speedY);
          } else if (downDown) {
            this.player.setVelocityY(speedY);
          }

          // Idle: no keys pressed -> stop and play 'turn'
          if (!leftDown && !rightDown && !upDown && !downDown) {
            this.player.setVelocity(0, 0);
            this.player.anims.play(`turn-${character}`);
          }

          // Update username text position to follow player
          if (this.playerNameText) {
            this.playerNameText.x = this.player.x;
            this.playerNameText.y = this.player.y - 50;
          }

          // Listen to username updates from parent component (React)
          if (this.playerNameText.text !== usernameRef.current) {
             this.playerNameText.setText(usernameRef.current);
             // Emit update to server
             if (this.socket) this.socket.emit("updateProfile", { username: usernameRef.current });
          }

          // Emit player movement if changed since last frame
          if (this.socket) {
            const x = this.player.x;
            const y = this.player.y;
            const rotation = this.player.rotation || 0;
            if (
              this.oldPosition.x !== x ||
              this.oldPosition.y !== y ||
              this.oldPosition.rotation !== rotation
            ) {
              this.socket.emit("playerMovement", { x, y, rotation });
            }
            // Save old position for comparison next frame
            this.oldPosition.x = x;
            this.oldPosition.y = y;
            this.oldPosition.rotation = rotation;
          }
        }
      }

      const config = {
        type: PhaserLib.AUTO,
        width,
        height,
        parent: containerRef.current,
        backgroundColor: "#000000",
        scene: [BootScene],
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
          },
        },
        // Ensure pixel-art crisp rendering
        render: {
          pixelArt: true,
          antialias: false,
        },
        autoFocus: false,
      };

      phaserGame = new PhaserLib.Game(config);
      gameRef.current = phaserGame;
    }

    init();

    return () => {
      destroyed = true;
      // Clean up Phaser game instance to avoid memory leaks when unmounting
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true); // remove canvas from DOM
        } catch (_) {
          // no-op
        }
        gameRef.current = null;
      }
    };
  }, [width, height, character, walletAddress, onPlayerDataLoaded]); // Removed username from deps

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        display: "inline-block",
        lineHeight: 0,
      }}
    >
      {/* Connection Status Indicator */}
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        padding: "4px 8px",
        backgroundColor: isConnected ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.7)",
        color: "#fff",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
        pointerEvents: "none", // Agar klik tembus ke canvas
        zIndex: 10
      }}>
        {isConnected ? "🟢 ONLINE" : "🔴 OFFLINE (Check Server)"}
      </div>
    </div>
  );
}
