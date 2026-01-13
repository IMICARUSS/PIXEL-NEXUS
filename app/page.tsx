"use client";

import { useState } from "react";
import ConnectWalletButton from "../src/components/ConnectWalletButton";
import IntroModal from "../src/components/IntroModal";
import GameCanvas from "../src/components/GameCanvas.js";

export default function Home() {
  const [introCompleted, setIntroCompleted] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      {!introCompleted ? (
        <IntroModal onComplete={() => setIntroCompleted(true)} />
      ) : (
        <>
          <ConnectWalletButton style={{ marginBottom: 16 }} />

          <div className="border-4 border-white shadow-lg shadow-purple-500/50">
            <GameCanvas width={1200} height={800} />
          </div>
        </>
      )}
    </main>
  );
}