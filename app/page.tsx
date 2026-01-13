"use client";

import { useState } from "react";
import ConnectWalletButton from "../src/components/ConnectWalletButton";
import IntroModal from "../src/components/IntroModal";
import GameCanvas from "../src/components/GameCanvas.js";

export default function Home() {
  const [introCompleted, setIntroCompleted] = useState(false);
  const [username, setUsername] = useState("");

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

          <div className="border-4 border-white shadow-lg shadow-purple-500/50">
            <GameCanvas width={1200} height={600} username={username} />
          </div>
        </>
      )}
    </main>
  );
}