import { useState } from "react";

function SettingsRow({ label, description, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 border border-gray-200 hover:border-black transition-colors flex items-center justify-between group"
    >
      <div>
        <div className="font-bold text-sm">{label}</div>
        <div className="text-xs text-gray-500 mt-1">{description}</div>
      </div>
      <span className="text-gray-400 group-hover:text-black">{icon}</span>
    </button>
  );
}

export function SettingsModal({ token, onClose, onLogout, onRotate, onNuke }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-white/80 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="bg-white dark:bg-zinc-950 border border-gray-300 dark:border-zinc-800 w-full max-w-lg shadow-2xl relative flex flex-col p-8 text-gray-900 dark:text-zinc-100">
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-zinc-800 pb-4">
          <h3 className="text-lg font-light tracking-tight">
            Workspace Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-white font-bold focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Token display */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Your Access Token
          </label>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Copy and save this string safely. It&apos;s the only way to access
            this workspace from other devices.
          </p>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={token}
              className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 border-r-0 p-3 font-mono text-xs text-gray-600 dark:text-zinc-300 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="bg-black text-white px-6 font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <SettingsRow
            label="Log Out"
            description="Clear local access. Data remains in the cloud."
            onClick={onLogout}
            icon="→"
          />
          <SettingsRow
            label="Rotate Token"
            description="Requires Passkey. Generate a new key and move data."
            onClick={onRotate}
            icon="→"
          />
          <button
            onClick={onNuke}
            className="w-full text-left p-4 border border-red-200 hover:bg-red-50 hover:border-red-600 transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-sm text-red-600">
                Nuke Workspace
              </div>
              <div className="text-xs text-red-400 mt-1">
                Requires Passkey. Permanently delete all data.
              </div>
            </div>
            <span className="text-red-400 group-hover:text-red-600">☠</span>
          </button>
        </div>
      </div>
    </div>
  );
}
