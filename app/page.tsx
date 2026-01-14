"use client";

import { useState } from "react";
import ConnectWalletButton from "../src/components/ConnectWalletButton";
import IntroModal from "../src/components/IntroModal";
import GameCanvas from "../src/components/GameCanvas.js";

export default function Home() {
  const [introCompleted, setIntroCompleted] = useState(false);
  const [username, setUsername] = useState("");
  const [character, setCharacter] = useState("dude");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      {!introCompleted ? (
        <IntroModal
          onComplete={(data: any) => {
            // IntroModal mengembalikan object { username, pubkey }, kita ambil username-nya saja
            if (typeof data === "object" && data !== null && data.username) {
              setUsername(data.username);
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
          <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
            <div className="rounded-lg border border-purple-500 bg-gray-800 px-4 py-2 text-xl font-bold text-white shadow-lg shadow-purple-500/20">
              {username}
            </div>
            <ConnectWalletButton style={{}} />
          </div>

          <div className="flex items-start gap-8">
            {/* Game Canvas (Left) */}
            <div className="border-4 border-white shadow-lg shadow-purple-500/50">
              <GameCanvas width={1000} height={600} username={username} character={character} />
            </div>

            {/* Right Side: Token Ownership UI */}
            <div className="flex h-[600px] w-80 flex-col rounded-xl border-4 border-purple-500 bg-gray-800/90 p-6 shadow-lg shadow-purple-500/50 backdrop-blur-sm">
              <h2 className="mb-6 text-center text-2xl font-black tracking-wider text-purple-300 uppercase drop-shadow-md">
                Token Holders
              </h2>

              <div className="flex-1 overflow-y-auto pr-2">
                {/* Placeholder for token ownership list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-700/50 p-3 border border-gray-600">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">Wallet</span>
                      <span className="font-mono text-sm font-bold text-white">0x12...34</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-gray-400">Owned</span>
                      <span className="font-mono text-green-400 font-bold">1,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}