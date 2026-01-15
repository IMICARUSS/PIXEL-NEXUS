"use client";

import { useState } from "react";
import ConnectWalletButton from "../src/components/ConnectWalletButton";
import IntroModal from "../src/components/IntroModal";
import GameCanvas from "../src/components/GameCanvas.js";

export default function Home() {
  const [introCompleted, setIntroCompleted] = useState(false);
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [character, setCharacter] = useState("dude");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      {!introCompleted ? (
        <IntroModal
          onComplete={(data: any) => {
            // IntroModal mengembalikan object { username, pubkey }, kita ambil username-nya saja
            if (typeof data === "object" && data !== null && data.username) {
              setUsername(data.username);
              if (data.pubkey) {
                setWalletAddress(data.pubkey);
              }
            } else {
              setUsername(data);
            }

            // Randomize character: dude, Elvis, or Elton
            const chars = ["dude", "Elvis", "Elton"];
            const randomChar = chars[Math.floor(Math.random() * chars.length)];
            setCharacter(randomChar);
            setIntroCompleted(true);
          }}
        />
      ) : (
        <>
          <div className="flex items-start gap-8">
            {/* Game Canvas (Left) */}
            <div className="border-4 border-white shadow-lg shadow-purple-500/50">
              <GameCanvas width={800} height={600} username={username} character={character} />
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
                      <div className="mb-2 border-b border-gray-600/50 pb-2">
                        <span className="text-xl font-black text-white tracking-wide drop-shadow-md">{username}</span>
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