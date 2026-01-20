import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { type: 'input', text: 'ralph run' },
  { type: 'info', text: '▶️ Running task: fix-auth-bug.md' },
  { type: 'ai', text: '🤖 AI Proposing fix for JWT expiration...' },
  { type: 'cmd', text: '🔍 Running validation: npm test src/auth.test.js' },
  { type: 'error', text: '❌ 1 test failed: Token should last 1 hour, but lasted 5 mins' },
  { type: 'ai', text: "💡 \"I'm helping!\" Retrying with corrected constant..." },
  { type: 'cmd', text: '🔍 Running validation: npm test src/auth.test.js' },
  { type: 'success', text: '✅ All tests passed!' },
  { type: 'commit', text: '📦 fix(AUTH-123): corrected JWT expiration constant' },
];

export const TerminalSimulator = () => {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleSteps((prev) => (prev < steps.length ? prev + 1 : 0));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#1e1e1e] rounded-lg shadow-2xl overflow-hidden font-mono text-sm border border-white/10 w-full max-w-2xl mx-auto h-[320px]">
      <div className="bg-[#333] px-4 py-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        <span className="text-gray-400 text-xs ml-2">ralph — bash</span>
      </div>
      <div className="p-4 space-y-2">
        <AnimatePresence>
          {steps.slice(0, visibleSteps).map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={
                `
                ${step.type === 'input' ? 'text-white' : ''}
                ${step.type === 'info' ? 'text-blue-400' : ''}
                ${step.type === 'ai' ? 'text-yellow-300' : ''}
                ${step.type === 'cmd' ? 'text-gray-400' : ''}
                ${step.type === 'error' ? 'text-red-400' : ''}
                ${step.type === 'success' ? 'text-green-400 font-bold' : ''}
                ${step.type === 'commit' ? 'text-purple-400' : ''}
              `}
            >
              {step.type === 'input' && <span className="text-green-500 mr-2">$</span>}
              {step.text}
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.div
          animate={{ opacity: [0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-4 bg-gray-400 align-middle"
        />
      </div>
    </div>
  );
};
