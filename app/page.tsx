"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ConnectWalletButton from "../src/components/ConnectWalletButton";
import GameCanvas from "../src/components/GameCanvas.js";
import { io } from "socket.io-client";

export default function Home() {
  const [introCompleted, setIntroCompleted] = useState(false);
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [character, setCharacter] = useState("dude");
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Intro Flow State
  // 0: Connect Wallet
  // 1: Checking Profile (Loading)
  // 2: New Player (Input Username)
  // 3: Registered Player (Ready to Enter)
  const [introStep, setIntroStep] = useState(0);

  // Callback untuk sinkronisasi data dari server (savegame) ke UI
  const handlePlayerDataLoaded = useCallback((data: { username?: string; character?: string }) => {
    if (data.username) setUsername(data.username);
    if (data.character) setCharacter(data.character);
  }, []);

  // Handle wallet connection during intro
  useEffect(() => {
    if (!introCompleted && walletAddress) {
      setIntroStep(1); // Move to checking
      
      // Connect temp socket to check profile
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
      const tempSocket = io(socketUrl);

      tempSocket.on("connect", () => {
        tempSocket.emit("checkProfile", { walletAddress });
      });

      tempSocket.on("profileCheckResult", (data: { exists: boolean, username?: string }) => {
        if (data.exists && data.username) {
          // Registered Player
          setUsername(data.username);
          setIntroStep(3); // Go to "Enter Nexus" directly
        } else {
          // New Player
          setIntroStep(2); // Go to "Input Username"
        }
        tempSocket.disconnect();
      });

      return () => {
        tempSocket.disconnect();
      };
    } else if (!walletAddress && !introCompleted) {
      setIntroStep(0); // Reset if wallet disconnected
    }
  }, [walletAddress, introCompleted]);

  const handleEnterNexus = () => {
    if (!username.trim()) return alert("Please enter a username");
    
    // Randomize character for new session if not loaded from DB yet
    // (GameCanvas will overwrite this if save data exists, but good for initial render)
    const chars = ["dude", "Elvis", "Elton"];
    const randomChar = chars[Math.floor(Math.random() * chars.length)];
    setCharacter(randomChar);
    
    setIntroCompleted(true);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      {!introCompleted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border-4 border-purple-500 bg-gray-900 p-8 shadow-[0_0_50px_rgba(168,85,247,0.5)] text-center">
            <h1 className="mb-8 text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-sm uppercase">
              PIXEL NEXUS
            </h1>

            {introStep === 0 && (
              <div className="space-y-6">
                <p className="text-gray-300">Connect your wallet to begin your journey.</p>
                <ConnectWalletButton style={{ width: "100%" }} onWalletConnected={setWalletAddress} />
              </div>
            )}

            {introStep === 1 && (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
                <p className="text-purple-300 font-bold animate-pulse">Checking Identity...</p>
              </div>
            )}

            {introStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-left">
                  <label className="mb-2 block text-sm font-bold text-purple-300">NEW IDENTITY DETECTED</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username..."
                    className="w-full rounded-lg border-2 border-purple-500 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                    maxLength={15}
                  />
                </div>
                <button
                  onClick={handleEnterNexus}
                  className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:shadow-purple-500/50 active:scale-95"
                >
                  ENTER THE NEXUS
                </button>
              </div>
            )}

            {introStep === 3 && (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="rounded-lg bg-purple-900/30 border border-purple-500/30 p-4">
                  <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Welcome Back</p>
                  <p className="text-2xl font-black text-white drop-shadow-md">{username}</p>
                </div>
                <button
                  onClick={handleEnterNexus}
                  className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:shadow-green-500/50 active:scale-95"
                >
                  CONTINUE TO NEXUS
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-8">
            {/* Game Canvas (Left) */}
            <div className="border-4 border-white shadow-lg shadow-purple-500/50">
              <GameCanvas 
                width={800} 
                height={600} 
                username={username} 
                character={character} 
                walletAddress={walletAddress}
                onPlayerDataLoaded={handlePlayerDataLoaded}
              />
            </div>

            {/* Right Side: Token Ownership UI */}
            <div className="flex h-[600px] w-[450px] flex-col rounded-xl border-4 border-purple-500 bg-gray-800/90 p-6 shadow-lg shadow-purple-500/50 backdrop-blur-sm">
              <h2 className="mb-6 text-center text-2xl font-black tracking-wider text-purple-300 uppercase drop-shadow-md">
                My Holdings
              </h2>

              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4">
                  {walletAddress ? (
                    <div className="flex flex-col gap-2 rounded-lg bg-gray-700/50 p-3 border border-gray-600 shadow-inner hover:border-purple-400 transition-colors">
                      {/* Username Display */}
                      <div className="mb-2 border-b border-gray-600/50 pb-2 flex justify-between items-center">
                        {isEditingName ? (
                          <div className="flex gap-2 w-full">
                            <input 
                              type="text" 
                              value={username} 
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-purple-500 focus:outline-none"
                              autoFocus
                            />
                            <button 
                              onClick={() => setIsEditingName(false)}
                              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xl font-black text-white tracking-wide drop-shadow-md truncate max-w-[200px]">{username}</span>
                            <button onClick={() => setIsEditingName(true)} className="text-xs text-gray-400 hover:text-white underline">Edit</button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">My Wallet</span>
                          <span className="font-mono text-sm font-bold text-white drop-shadow-sm">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Holdex</span>
                          {/* Dummy amount for now */}
                          <span className="font-mono text-green-400 font-bold drop-shadow-sm">1,000</span>
                        </div>
                      </div>
                      
                      {/* EXP Bar Style */}
                      <div className="relative w-full mt-1">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1 px-0.5">
                          <span className="font-bold text-blue-400">EXP</span>
                          <span>20%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-900 border border-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                            style={{ width: `20%` }}
                          />
                        </div>
                      </div>

                      {/* Character Info Section */}
                      <div className="mt-3 flex items-center gap-3 border-t border-gray-600/50 pt-3">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-900 border border-gray-600 shadow-inner overflow-hidden">
                          <div
                            style={{
                              width: "32px",
                              height: "48px",
                              backgroundImage: `url('/${character}.png')`,
                              backgroundPosition: "-128px 0", // Frame 4 (Idle Front)
                              imageRendering: "pixelated",
                              transform: "scale(1.2)",
                            }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Active Character</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-white capitalize tracking-wide leading-none">{character}</span>
                            <span className="text-xs font-bold text-yellow-500 drop-shadow-sm">LVL 1</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 mt-10 text-sm italic">
                      Connect wallet to view holdings
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Management Footer */}
              <div className="mt-4 border-t border-gray-700 pt-4 flex justify-center">
                <ConnectWalletButton style={{ width: "100%" }} onWalletConnected={setWalletAddress} />
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}