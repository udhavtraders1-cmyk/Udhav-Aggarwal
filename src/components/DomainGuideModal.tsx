import React, { useState } from 'react';
import { X, Globe, ExternalLink, Check, Copy, Zap, ArrowRight } from 'lucide-react';

interface DomainGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl: string;
}

export const DomainGuideModal: React.FC<DomainGuideModalProps> = ({
  isOpen,
  onClose,
  sharedUrl,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedVercel, setCopiedVercel] = useState(false);
  const [activeTab, setActiveTab] = useState<'vercel' | 'redirect'>('vercel');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, isVercel: boolean) => {
    navigator.clipboard.writeText(text);
    if (isVercel) {
      setCopiedVercel(true);
      setTimeout(() => setCopiedVercel(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#262421] border border-[#3d3a34] rounded-2xl p-6 max-w-xl w-full shadow-2xl relative animate-in zoom-in-95 text-[#c3c2c1]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#989795] hover:text-white rounded-lg bg-[#312e2b] hover:bg-[#3d3a34] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center text-[#81b64c]">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Open via</span>
              <span className="text-xs bg-[#81b64c] text-white px-2 py-0.5 rounded font-mono font-bold">
                chesskiduniyaa.vercel.app
              </span>
            </h3>
            <p className="text-xs text-[#989795]">
              Claim your free <span className="text-white font-semibold">.vercel.app</span> address in 60 seconds (100% Free)
            </p>
          </div>
        </div>

        {/* Current Live Cloud URL */}
        <div className="bg-[#1e1c19] border border-[#36322d] p-3.5 rounded-xl mb-5">
          <div className="text-[11px] font-bold text-[#989795] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Your Live App Source Address:</span>
            <span className="text-[#81b64c] font-semibold text-[10px]">● Live & Ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs text-white truncate flex-1 select-all bg-[#262421] px-3 py-1.5 rounded border border-[#3d3a34]">
              {sharedUrl || window.location.origin}
            </span>
            <button
              onClick={() => copyToClipboard(sharedUrl || window.location.origin, false)}
              className="px-3 py-1.5 bg-[#81b64c] hover:bg-[#a3d160] text-white font-bold text-xs rounded transition flex items-center space-x-1 shrink-0"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Steps to get chesskiduniyaa.vercel.app */}
        <div className="space-y-3.5 text-xs">
          <p className="text-[#989795] leading-relaxed">
            Vercel lets anyone claim any <strong className="text-white">.vercel.app</strong> name for free forever. We already included the <code className="text-[#81b64c]">vercel.json</code> config file in this app!
          </p>

          <div className="space-y-2.5">
            <div className="flex items-start space-x-2.5 bg-[#1e1c19] p-3 rounded-xl border border-[#36322d]">
              <span className="w-5 h-5 rounded-full bg-[#81b64c] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white block">Go to Vercel.com (Free)</strong>
                <span className="text-[#989795]">
                  Sign in or create a free account at{' '}
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#81b64c] underline font-semibold"
                  >
                    vercel.com
                  </a>.
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-[#1e1c19] p-3 rounded-xl border border-[#36322d]">
              <span className="w-5 h-5 rounded-full bg-[#81b64c] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white block">Create New Project & Name It</strong>
                <span className="text-[#989795]">
                  Name your project <strong className="text-white">chesskiduniyaa</strong>.
                  Vercel automatically assigns:
                </span>
                <div className="mt-1.5 font-mono text-[11px] text-[#81b64c] bg-[#262421] px-2.5 py-1 rounded border border-[#3d3a34] flex items-center justify-between">
                  <span>https://chesskiduniyaa.vercel.app</span>
                  <button
                    onClick={() => copyToClipboard('https://chesskiduniyaa.vercel.app', true)}
                    className="text-[10px] text-white bg-[#312e2b] px-2 py-0.5 rounded hover:bg-[#3d3a34]"
                  >
                    {copiedVercel ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-[#1e1c19] p-3 rounded-xl border border-[#36322d]">
              <span className="w-5 h-5 rounded-full bg-[#81b64c] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-white block">Publish / Deploy your Vercel Project</strong>
                <span className="text-[#989795]">
                  Click <strong>Deploy / Publish</strong>. (In dev/preview mode, Next.js ignores <code className="text-[#81b64c]">vercel.json</code>; it activates once published).
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-[#1e1c19] p-3 rounded-xl border border-[#36322d]">
              <span className="w-5 h-5 rounded-full bg-[#81b64c] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                4
              </span>
              <div>
                <strong className="text-white block">Type in Chrome & Play!</strong>
                <span className="text-[#989795]">
                  Whenever you or anyone visits <code className="text-white font-bold">chesskiduniyaa.vercel.app</code> in Chrome, your live Cloud Run chess game will open seamlessly.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#36322d] flex items-center justify-between">
          <a
            href={sharedUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#81b64c] hover:underline flex items-center space-x-1 font-semibold"
          >
            <span>Test Current Live Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#81b64c] hover:bg-[#a3d160] text-white font-bold text-xs rounded-lg transition"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
