'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

export default function ConnectWalletButton({ style, onWalletConnected }) {
  const [hasPhantom, setHasPhantom] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pubkey, setPubkey] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const provider = useMemo(() => (typeof window !== 'undefined' ? window.solana : null), []);

  useEffect(() => {
    if (!provider) {
      console.warn('[Phantom] window.solana provider not detected');
      setHasPhantom(false);
      return;
    }

    const isPhantom = !!provider?.isPhantom;
    setHasPhantom(isPhantom);
    console.log('[Phantom] provider detected. isPhantom =', isPhantom);

    // Try auto-connect if already authorized
    provider
      ?.connect?.({ onlyIfTrusted: true })
      .then((res) => {
        const key = res?.publicKey?.toString?.() ?? provider?.publicKey?.toString?.();
        if (key) {
          console.log('[Phantom] auto-connected with key:', key);
          setPubkey(key);
          if (onWalletConnected) onWalletConnected(key);
        }
      })
      .catch((e) => console.log('[Phantom] auto-connect skipped:', e?.message ?? e));

    const onConnect = (pk) => {
      const key = pk?.toString?.() ?? provider?.publicKey?.toString?.() ?? null;
      console.log('[Phantom] connect event received:', key);
      setPubkey(key);
      setConnecting(false);
      setShowHint(false);
      if (onWalletConnected) onWalletConnected(key);
    };

    const onDisconnect = () => {
      console.log('[Phantom] disconnect event received');
      setPubkey(null);
      setConnecting(false);
      setShowHint(false);
      if (onWalletConnected) onWalletConnected(null);
    };

    const onAccountChanged = (newPk) => {
      const key = newPk ? newPk.toString() : null;
      console.log('[Phantom] accountChanged:', key);
      setPubkey(key);
      if (onWalletConnected) onWalletConnected(key);
    };

    provider?.on?.('connect', onConnect);
    provider?.on?.('disconnect', onDisconnect);
    provider?.on?.('accountChanged', onAccountChanged);

    return () => {
      provider?.off?.('connect', onConnect);
      provider?.off?.('disconnect', onDisconnect);
      provider?.off?.('accountChanged', onAccountChanged);
    };
  }, [provider, onWalletConnected]);

  // Show a hint if connecting takes more than 5s
  useEffect(() => {
    if (!connecting) {
      setShowHint(false);
      return;
    }
    const t = setTimeout(() => setShowHint(true), 5000);
    return () => clearTimeout(t);
  }, [connecting]);

  const onConnect = useCallback(async () => {
    if (!provider || !provider.isPhantom) {
      console.warn('[Phantom] provider not available or not Phantom');
      return;
    }
    try {
      console.log('[Phantom] calling provider.connect()');
      setConnecting(true);
      const res = await provider.connect();
      const key = res?.publicKey?.toString?.() ?? provider?.publicKey?.toString?.() ?? null;
      console.log('[Phantom] connect resolved with key:', key);
      setPubkey(key);
      setConnecting(false);
      setShowHint(false);
      if (onWalletConnected) onWalletConnected(key);
    } catch (e) {
      console.error('[Phantom] connect error:', e);
      setConnecting(false);
      setShowHint(false);
      alert('Phantom connect error: ' + (e?.message ?? e));
    }
  }, [provider]);

  const onDisconnect = useCallback(async () => {
    if (!provider || !provider.isPhantom) return;
    try {
      console.log('[Phantom] calling provider.disconnect()');
      await provider.disconnect();
      console.log('[Phantom] disconnect resolved');
      setPubkey(null);
      if (onWalletConnected) onWalletConnected(null);
    } catch (e) {
      console.error('[Phantom] disconnect error:', e);
      alert('Phantom disconnect error: ' + (e?.message ?? e));
    }
  }, [provider]);

  if (!hasPhantom) {
    return (
      <a
        href="https://phantom.app/"
        target="_blank"
        rel="noreferrer"
        style={{
          color: '#fff',
          background: '#6d28d9',
          border: 'none',
          borderRadius: 8,
          padding: '10px 16px',
          cursor: 'pointer',
          textDecoration: 'none',
          ...style,
        }}
      >
        Install Phantom Wallet
      </a>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {pubkey ? (
        <button
          onClick={onDisconnect}
          style={{
            color: '#111827',
            background: '#a78bfa',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            cursor: 'pointer',
            ...style,
          }}
          title={pubkey}
        >
          Disconnect ({pubkey.slice(0, 4)}...{pubkey.slice(-4)})
        </button>
      ) : (
        <button
          onClick={onConnect}
          disabled={connecting}
          style={{
            color: '#fff',
            background: connecting ? '#4c1d95' : '#6d28d9',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            cursor: connecting ? 'not-allowed' : 'pointer',
            ...style,
          }}
        >
          {connecting ? 'Connecting…' : 'Connect Phantom Wallet'}
        </button>
      )}

      {connecting && showHint && (
        <div style={{ marginTop: 8, maxWidth: 420, color: '#d1d5db', fontSize: 12, textAlign: 'center' }}>
          If no Phantom prompt appears, click the Phantom extension icon in your browser toolbar to approve the connection.
          You may also need to enable the extension in this window or exit Private/Incognito mode.
        </div>
      )}
    </div>
  );
}
