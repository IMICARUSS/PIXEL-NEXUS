"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Lazy import Phaser only on client to avoid SSR issues
let PhaserLib = null;

export default function GameCanvas({ width = 800, height = 600, username = "Player", character = "dude", walletAddress = null }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

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
          this.otherPlayers = null; // Phaser physics group for other players
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

          // Group for other players
          this.otherPlayers = this.physics.add.group();

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
              
              // JOIN GAME: Kirim identitas kita (termasuk wallet untuk load save data)
              this.socket.emit("joinGame", {
                walletAddress: walletAddress,
                username: username,
                character: character,
                x: this.player.x,
                y: this.player.y,
              });
            });

            // Current players data received on connect
            this.socket.on("currentPlayers", (players) => {
              // If server already knows about us, update our pos to stay consistent
              const self = players[this.socket.id];
              if (self && this.player) {
                // LOAD SAVE DATA: Update posisi dan karakter lokal sesuai database server
                this.player.setPosition(self.x, self.y);
                // Jika karakter di save data berbeda dengan default, kita bisa update animasinya di sini
                // (Opsional: memerlukan logika ganti tekstur dinamis jika karakter berubah)
                if (self.username) this.playerNameText.setText(self.username);
              }
              // Add others
              Object.keys(players).forEach((id) => {
                if (id === this.socket.id) return; // skip ourselves
                const p = players[id];
                // Only add if not already present
                const exists = this.otherPlayers.getChildren().some((o) => o.playerId === p.playerId);
                if (!exists) this.addOtherPlayer(p);
              });
            });

            // A new player joined
            this.socket.on("newPlayer", (playerInfo) => {
              if (playerInfo.playerId !== this.socket.id) {
                const exists = this.otherPlayers.getChildren().some((o) => o.playerId === playerInfo.playerId);
                if (!exists) this.addOtherPlayer(playerInfo);
              }
            });

            // A player disconnected
            this.socket.on("disconnect", (playerId) => {
              // Find in group and remove
              this.otherPlayers.getChildren().forEach((other) => {
                if (other.playerId === playerId) {
                  if (other.nameText) other.nameText.destroy();
                  other.destroy();
                }
              });
            });

            // Another player moved
            this.socket.on("playerMoved", (playerInfo) => {
              this.otherPlayers.getChildren().forEach((other) => {
                if (other.playerId === playerInfo.playerId) {
                  other.setPosition(playerInfo.x, playerInfo.y);
                  if (typeof playerInfo.rotation === "number") {
                    other.rotation = playerInfo.rotation;
                  }
                  // Update text position
                  if (other.nameText) {
                    other.nameText.setPosition(other.x, other.y - 50);
                  }
                  // Update username text if not exists (for late joiners)
                  if (playerInfo.username && !other.nameText) {
                    const otherText = this.add.text(other.x, other.y - 50, playerInfo.username, {
                      fontSize: "14px",
                      fill: "#ffffff",
                      stroke: "#000000",
                      strokeThickness: 3,
                      align: "center",
                    }).setOrigin(0.5);
                    other.nameText = otherText;
                  }
                }
              });
            });

            // Cleanup socket when scene shuts down/restarts
            this.events.once(PhaserLib.Scenes.Events.SHUTDOWN, () => {
              try {
                this.socket && this.socket.disconnect();
              } catch (_) {}
            });
          }
        }

        // Helper: add other player sprite (red tint)
        addOtherPlayer(playerInfo) {
          const spriteKey = playerInfo.character || "dude"; // Fallback ke dude jika tidak ada info
          const other = this.physics.add.sprite(playerInfo.x, playerInfo.y, spriteKey);
          other.setScale(2);
          other.playerId = playerInfo.playerId;
          other.setImmovable(true);
          other.body.allowGravity = false;
          this.otherPlayers.add(other);

          // Add username text for other players
          if (playerInfo.username) {
            const otherText = this.add.text(other.x, other.y - 50, playerInfo.username, {
              fontSize: "14px",
              fill: "#ffffff",
              stroke: "#000000",
              strokeThickness: 3,
              align: "center",
            }).setOrigin(0.5);
            other.nameText = otherText;
          }
          return other;
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
          if (this.playerNameText.text !== username) {
             this.playerNameText.setText(username);
             // Emit update to server
             if (this.socket) this.socket.emit("updateProfile", { username });
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
  }, [width, height, username, character, walletAddress]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        display: "inline-block",
        lineHeight: 0,
      }}
    />
  );
}
