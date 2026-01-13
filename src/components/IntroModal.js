'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ConnectWalletButton from './ConnectWalletButton';

export default function IntroModal({ onComplete }) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState('welcome'); // 'welcome' | 'setup'
  const [username, setUsername] = useState('');
  const [pubkey, setPubkey] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mountAnim, setMountAnim] = useState(false);

  // Subscribe to Phantom provider connection events
  useEffect(() => {
    const provider = typeof window !== 'undefined' ? window.solana : null;
    const handleConnect = (publicKey) => {
      const key = publicKey?.toString?.() ?? provider?.publicKey?.toString?.() ?? null;
      setPubkey(key);
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      setPubkey(null);
      setIsConnected(false);
    };

    if (provider) {
      // Attempt trusted connect to populate state if already authorized
      provider.connect?.({ onlyIfTrusted: true }).then((res) => {
        const key = res?.publicKey?.toString?.() ?? provider.publicKey?.toString?.() ?? null;
        if (key) {
          setPubkey(key);
          setIsConnected(true);
        }
      }).catch(() => {});

      provider.on?.('connect', handleConnect);
      provider.on?.('disconnect', handleDisconnect);
    }
    return () => {
      provider?.off?.('connect', handleConnect);
      provider?.off?.('disconnect', handleDisconnect);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMountAnim(true), 20);
    return () => clearTimeout(t);
  }, []);

  const start = useCallback(() => {
    setStep('setup');
  }, []);

  const canContinue = useMemo(() => {
    return username.trim().length > 0 && isConnected;
  }, [username, isConnected]);

  const finish = useCallback(() => {
    if (!canContinue) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pixel-nexus-username', username.trim());
        if (pubkey) localStorage.setItem('pixel-nexus-pubkey', pubkey);
      }
    } catch {}
    setOpen(false);
    onComplete?.({ username: username.trim(), pubkey });
  }, [canContinue, onComplete, pubkey, username]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-md transition-opacity duration-300 ${mountAnim ? 'opacity-100' : 'opacity-0'}`} />

      {/* Modal card */}
      <div className={`relative w-[92%] max-w-xl rounded-2xl border border-white/10 bg-zinc-900/90 p-0 text-zinc-100 shadow-2xl ring-1 ring-white/5 transition-all duration-300 ${mountAnim ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl bg-zinc-950/70 px-6 py-5">
          <span className="text-2xl">🌐</span>
          <h2 className="text-2xl font-extrabold tracking-wide">PIXEL NEXUS</h2>
        </div>

        {/* Divider */}
        <div className="mx-6 h-[2px] rounded-full bg-white/10" />

        <div className="px-6 py-5">
          {step === 'welcome' ? (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-zinc-300">
                  Welcome to our journey in <span className="font-semibold text-white">PIXEL NEXUS</span> — a retro-futuristic grid where every move leaves a trace.
                </p>
              </div>

              <div className="space-y-4 text-zinc-200">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🧩</span>
                  <div>
                    <p className="font-semibold">Forge Your Identity</p>
                    <p className="text-zinc-400">Claim a unique username. This is how the grid will know you.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔗</span>
                  <div>
                    <p className="font-semibold">Connect to the Network</p>
                    <p className="text-zinc-400">Link your wallet to enable on-chain progression and ownership.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🎮</span>
                  <div>
                    <p className="font-semibold">Enter the Grid</p>
                    <p className="text-zinc-400">Move with arrow keys. Collaborate, compete, and shape the Nexus.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm text-zinc-300">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. neon-runner"
                  className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-zinc-300">Wallet</label>
                <ConnectWalletButton style={{ marginTop: 4 }} />
                {isConnected && (
                  <p className="text-sm text-emerald-400">Connected: {pubkey?.slice(0, 4)}...{pubkey?.slice(-4)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA footer */}
        <div className="rounded-b-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-1">
          {step === 'welcome' ? (
            <button
              onClick={start}
              className="block w-full rounded-b-2xl bg-transparent px-6 py-4 text-center text-base font-extrabold tracking-wide text-white"
            >
              ENTER THE NEXUS ✨
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={!canContinue}
              className="block w-full rounded-b-2xl bg-transparent px-6 py-4 text-center text-base font-extrabold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              START JOURNEY 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
