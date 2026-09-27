import React, { useState } from 'react';
import { FirebaseDatabaseSchema } from '../types';
import { Database, Copy, Check, RefreshCw, Terminal, ChevronDown, ChevronRight, Layers } from 'lucide-react';

interface FirebaseInspectorProps {
  state: FirebaseDatabaseSchema;
  onReset: () => void;
}

export const FirebaseInspector: React.FC<FirebaseInspectorProps> = ({ state, onReset }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers' | 'users' | 'all'>('orders');

  const jsonString = JSON.stringify(
    activeTab === 'all'
      ? state
      : activeTab === 'orders'
      ? state.orders
      : activeTab === 'drivers'
      ? state.drivers
      : state.users,
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ordersCount = Object.keys(state.orders).length;
  const driversCount = Object.keys(state.drivers).length;
  const usersCount = Object.keys(state.users).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Firebase Realtime Database Inspector</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h4>
            <p className="text-[10px] text-slate-400">Sinkronisasi langsung kedua aplikasi secara live</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            title="Salin JSON Database"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copied ? 'Tersalin' : 'Salin JSON'}</span>
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
            title="Reset Database ke Keadaan Awal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Path Selector Tabs */}
      <div className="flex gap-1.5 py-2.5 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-all ${
            activeTab === 'orders'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
              : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          /orders ({ordersCount})
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-all ${
            activeTab === 'drivers'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
              : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          /drivers ({driversCount})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-all ${
            activeTab === 'users'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
              : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          /users ({usersCount})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-all ${
            activeTab === 'all'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
              : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          /root (Semua)
        </button>
      </div>

      {/* Live JSON Code Block */}
      <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] overflow-auto text-emerald-400 max-h-[380px] select-text">
        <pre className="whitespace-pre">{jsonString}</pre>
      </div>

      {/* Footer Info */}
      <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Node: <code className="text-slate-300">https://ojek-mvp-default-rtdb.firebaseio.com/</code></span>
        <span className="text-emerald-400 font-semibold">● WebSocket Connected</span>
      </div>
    </div>
  );
};
