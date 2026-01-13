'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import GameCanvas from '../components/GameCanvas.js';

export default function Page() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b0b0b',
        padding: '16px',
      }}
    >
      <WalletMultiButton style={{ marginBottom: 16 }} />

      <div
        style={{
          border: '4px solid #ffffff',
          boxShadow: '0 0 24px rgba(168, 85, 247, 0.5)',
        }}
      >
        <GameCanvas width={800} height={600} />
      </div>
    </main>
  );
}
