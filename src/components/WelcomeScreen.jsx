import { useState } from "react";
import { generateToken } from "../utils/id.js";
import { initWorkspace } from "../api/client.js";

export function WelcomeScreen({ onLogin, theme = "light" }) {
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
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-gray-50 text-gray-900"}`}
    >
      <div
        className={`max-w-md w-full p-10 border shadow-xl ${theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200"}`}
      >
        <h1 className="text-2xl font-light tracking-tight mb-6 text-center">
          Redlineshift
        </h1>

        {/* New Workspace */}
        <div
          className={`p-5 border mb-6 ${theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-gray-50 border-gray-200"}`}
        >
          <label
            className={`block text-xs uppercase tracking-widest font-bold mb-4 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}
          >
            New Workspace
          </label>
          <input
            type="password"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateNew()}
            placeholder="Set a Passkey (e.g. PIN)"
            className={`w-full p-3 font-mono text-sm focus:outline-none transition-colors mb-4 ${theme === "dark" ? "bg-zinc-950 border border-zinc-700 text-zinc-100 focus:border-zinc-200" : "bg-white border border-gray-300 text-gray-900 focus:border-black"}`}
          />
          <button
            onClick={handleCreateNew}
            disabled={!passkey.trim()}
            className="w-full bg-black text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200 font-bold"
          >
            Create
          </button>
        </div>

        <div className="relative flex py-4 items-center mb-6">
          <div
            className={
              theme === "dark"
                ? "grow border-t border-zinc-800"
                : "grow border-t border-gray-200"
            }
          ></div>
          <span
            className={`shrink-0 mx-4 text-[10px] uppercase tracking-widest ${theme === "dark" ? "text-zinc-500" : "text-gray-400"}`}
          >
            Or Access Existing
          </span>
          <div
            className={
              theme === "dark"
                ? "grow border-t border-zinc-800"
                : "grow border-t border-gray-200"
            }
          ></div>
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
            className={`w-full p-4 font-mono text-xs focus:outline-none transition-colors ${theme === "dark" ? "bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-zinc-200" : "bg-gray-50 border border-gray-300 text-gray-900 focus:border-black"}`}
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
