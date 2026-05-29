"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Wallet } from "lucide-react";
import { useWallet } from "@/components/auth/hooks";

interface WalletProviderModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletProviderModal({
  open,
  onClose,
}: WalletProviderModalProps) {
  const { providers, connectWith, isConnecting } = useWallet();

  async function handleSelect(id: string) {
    await connectWith(id);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] border border-[#262626] rounded-xl shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
                Connect Wallet
              </h2>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleSelect(provider.id)}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#262626] hover:border-[#404040] hover:bg-[#111] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="text-sm text-white">{provider.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
