import { useState } from "react";
import { generateToken } from "../utils/id.js";
import { initWorkspace } from "../api/client.js";

export function WelcomeScreen({ onLogin }) {
  const [inputToken, setInputToken] = useState("");
  const [passkey, setPasskey] = useState("");

  const handleCreateNew = async () => {
    if (!passkey.trim()) return;
    const newToken = generateToken();
    try {
      await initWorkspace(newToken, passkey.trim());
      onLogin(newToken);
    } catch {
      console.error("Failed to initialize workspace");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-12 border border-gray-200 shadow-xl">
        <h1 className="text-2xl font-light tracking-tight mb-8 text-center">
          Redlineshift
        </h1>

        {/* New Workspace */}
        <div className="bg-gray-50 p-6 border border-gray-200 mb-8">
          <label className="block text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">
            New Workspace
          </label>
          <input
            type="password"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
            placeholder="Set a Passkey (e.g. PIN)"
            className="w-full bg-white border border-gray-300 p-3 font-mono text-sm focus:outline-none focus:border-black transition-colors mb-4"
          />
          <button
            onClick={handleCreateNew}
            disabled={!passkey.trim()}
            className="w-full bg-black text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200 font-bold"
          >
            Create
          </button>
        </div>

        <div className="relative flex py-4 items-center mb-8">
          <div className="grow border-t border-gray-200"></div>
          <span className="shrink-0 mx-4 text-gray-400 text-[10px] uppercase tracking-widest">
            Or Access Existing
          </span>
          <div className="grow border-t border-gray-200"></div>
        </div>

        {/* Existing Workspace */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              inputToken.trim() &&
              onLogin(inputToken.trim())
            }
            placeholder="Paste your access token..."
            className="w-full bg-gray-50 border border-gray-300 p-4 font-mono text-xs focus:outline-none focus:border-black transition-colors"
          />
          <button
            onClick={() => inputToken.trim() && onLogin(inputToken.trim())}
            disabled={!inputToken.trim()}
            className="w-full border border-black text-black px-6 py-3 text-xs uppercase tracking-widest hover:bg-gray-100 disabled:opacity-30 transition-colors duration-200 font-bold"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
