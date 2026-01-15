'use client';

import { useState, useCallback } from 'react';

export default function ConnectWalletButton({ style, onWalletConnected }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const updateWallet = useCallback((addr) => {
    setWalletAddress(addr);
    if (onWalletConnected) onWalletConnected(addr);
  }, [onWalletConnected]);

  const connect = async (providerName) => {
    if (typeof window === 'undefined') return;

    let address = null;
    try {
      if (providerName === 'Phantom') {
        // Cek provider Phantom (support window.phantom.solana dan window.solana)
        const provider = window.phantom?.solana || window.solana;
        if (!provider) {
          window.open('https://phantom.app/', '_blank');
          return;
        }
        const resp = await provider.connect();
        address = resp.publicKey.toString();

      } else if (providerName === 'Metamask') {
        const provider = window.ethereum;
        if (!provider) {
          window.open('https://metamask.io/', '_blank');
          return;
        }
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        address = accounts[0]; // EVM address

      } else if (providerName === 'Solflare') {
        const provider = window.solflare;
        if (!provider) {
          window.open('https://solflare.com/', '_blank');
          return;
        }
        await provider.connect();
        address = provider.publicKey.toString();
      }

      if (address) {
        updateWallet(address);
        setShowOptions(false);
      }
    } catch (err) {
      console.error("Connection Error:", err);
      // Jangan tampilkan alert jika user menolak (error code 4001)
      if (err.code !== 4001) {
        alert("Failed to connect to " + providerName + ": " + (err.message || err));
      }
    }
  };

  const disconnect = useCallback(() => {
    // Attempt to disconnect if provider supports it
    try {
      if (window.solana?.isPhantom) window.solana.disconnect();
      if (window.solflare) window.solflare.disconnect();
    } catch (e) {
      // ignore errors
    }
    updateWallet(null);
  }, [updateWallet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {walletAddress ? (
        <button
          onClick={disconnect}
          style={{
            color: '#111827',
            background: '#a78bfa',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            cursor: 'pointer',
            ...style,
          }}
          title={walletAddress}
        >
          Disconnect ({walletAddress.slice(0, 4)}...{walletAddress.slice(-4)})
        </button>
      ) : (
        <>
          {!showOptions ? (
            <button
              onClick={() => setShowOptions(true)}
              style={{
                color: '#fff',
                background: '#6d28d9',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                cursor: 'pointer',
                ...style,
              }}
            >
              Connect Wallet
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <button 
                onClick={() => connect('Phantom')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#AB9FF2', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <img src="/phantom.png" alt="Phantom" width="24" height="24" />
                Phantom
              </button>
              <button 
                onClick={() => connect('Metamask')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#F6851B', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <img src="/metamask.png" alt="Metamask" width="24" height="24" />
                Metamask
              </button>
              <button 
                onClick={() => connect('Solflare')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#FC7226', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <img src="/solflare.png" alt="Solflare" width="24" height="24" />
                Solflare
              </button>
              <button 
                onClick={() => setShowOptions(false)}
                style={{ background: 'transparent', color: '#ccc', padding: '5px', border: 'none', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
