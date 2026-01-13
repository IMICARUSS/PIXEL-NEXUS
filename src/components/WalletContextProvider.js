'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Import default styles for wallet modal UI
// Using require as requested
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('@solana/wallet-adapter-react-ui/styles.css');

export default function WalletContextProvider({ children }) {
  // Memoize endpoint for Solana devnet
  const endpoint = useMemo(() => 'https://api.devnet.solana.com', []);

  // Initialize Phantom wallet adapter and memoize the array
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
