import ConnectWalletButton from "../src/components/ConnectWalletButton";
import IntroModal from "../src/components/IntroModal";
import GameCanvas from "../src/components/GameCanvas.js";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <IntroModal />

      <ConnectWalletButton style={{ marginBottom: 16 }} />

      <div className="border-4 border-white shadow-lg shadow-purple-500/50">
        <GameCanvas width={800} height={600} />
      </div>
    </main>
  );
}