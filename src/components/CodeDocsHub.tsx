import React, { useState } from 'react';
import {
  Code,
  FileCode,
  Copy,
  Check,
  Smartphone,
  Globe,
  Database,
  ShieldCheck,
  BookOpen,
  Download,
  FolderGit2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface CodeFile {
  name: string;
  language: string;
  category: 'web' | 'android' | 'firebase' | 'guide';
  description: string;
  code: string;
}

interface CodeDocsHubProps {
  files: CodeFile[];
}

export const CodeDocsHub: React.FC<CodeDocsHubProps> = ({ files }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'web' | 'android' | 'firebase' | 'guide'>('all');
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const filteredFiles = selectedCategory === 'all'
    ? files
    : files.filter((f) => f.category === selectedCategory);

  const currentFile = filteredFiles[selectedFileIndex] || filteredFiles[0] || files[0];

  const handleCopy = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (currentFile) {
      const blob = new Blob([currentFile.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFile.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Top Filter Bar */}
      <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedFileIndex(0); }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Semua File ({files.length})
          </button>
          <button
            onClick={() => { setSelectedCategory('web'); setSelectedFileIndex(0); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === 'web'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Pelanggan (React)</span>
          </button>
          <button
            onClick={() => { setSelectedCategory('android'); setSelectedFileIndex(0); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === 'android'
                ? 'bg-blue-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Driver (Kotlin)</span>
          </button>
          <button
            onClick={() => { setSelectedCategory('firebase'); setSelectedFileIndex(0); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === 'firebase'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Firebase Rules & Schema</span>
          </button>
          <button
            onClick={() => { setSelectedCategory('guide'); setSelectedFileIndex(0); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedCategory === 'guide'
                ? 'bg-purple-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan & GitHub</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            title="Download File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </button>
        </div>
      </div>

      {/* Main Code View Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sub-file List */}
        <div className="w-full md:w-64 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-2 overflow-y-auto shrink-0 max-h-48 md:max-h-full">
          <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
            Daftar File ({filteredFiles.length})
          </div>
          <div className="space-y-1 mt-1">
            {filteredFiles.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  (filteredFiles[selectedFileIndex]?.name === file.name)
                    ? 'bg-slate-800 text-emerald-300 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Code Content */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* File Meta Info Bar */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-mono font-bold text-slate-100">{currentFile?.name}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentFile?.description}</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
              {currentFile?.language.toUpperCase()}
            </span>
          </div>

          {/* Source Code Box */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 selection:bg-emerald-600 selection:text-white leading-relaxed">
            <pre className="whitespace-pre">
              <code>{currentFile?.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
