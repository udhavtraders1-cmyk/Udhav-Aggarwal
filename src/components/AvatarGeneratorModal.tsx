import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, Loader2, Check } from 'lucide-react';

interface AvatarGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetAvatar: (url: string) => void;
}

const PRESET_PROMPTS = [
  'Futuristic cybernetic chess grandmaster with glowing neon visor and obsidian armor',
  'Majestic royal lion king in ornate gold embroidered chess robes, cinematic lighting',
  'Cosmic starry galaxy queen with nebular crown and ethereal chess piece aura',
  'Renaissance marble statue of a chess master deep in meditation, moody chiaroscuro',
];

export const AvatarGeneratorModal: React.FC<AvatarGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSetAvatar,
}) => {
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0]);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9'>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setApplied(false);

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageSize,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        setError(data.error || 'Failed to generate image. Please try a different prompt.');
      }
    } catch {
      setError('Network error generating image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedImage) return;
    onSetAvatar(generatedImage);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-100">AI Chess Portrait Generator</h3>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                gemini-3-pro-image-preview
              </span>
            </div>
            <p className="text-xs text-slate-400">Craft personalized Grandmaster avatars in 1K, 2K, or 4K</p>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Portrait Prompt
          </label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none"
            placeholder="Describe your chess avatar..."
          />

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(p)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition truncate max-w-[200px]"
              >
                Idea {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Affordance (1K, 2K, 4K) */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Image Size Affordance
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['1K', '2K', '4K'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setImageSize(size)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    imageSize === size
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['1:1', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    aspectRatio === ratio
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {ratio === '1:1' ? 'Square (1:1)' : 'Banner (16:9)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Preview Area */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48 rounded-2xl bg-slate-950/60 border border-slate-800 mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
            <span className="text-xs text-slate-300 font-semibold">Generating high-fidelity portrait...</span>
            <span className="text-[11px] text-slate-500">Selected resolution: {imageSize}</span>
          </div>
        )}

        {generatedImage && !isLoading && (
          <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/50 mb-4 shadow-xl">
            <img
              src={generatedImage}
              alt="AI Generated Portrait"
              className="w-full h-56 object-cover bg-slate-950"
            />
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/80 text-[10px] font-mono text-amber-300 border border-slate-700">
              {imageSize} • {aspectRatio}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-extrabold text-xs rounded-xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Synthesizing...' : 'Generate with Gemini 3 Pro'}</span>
          </button>

          {generatedImage && (
            <button
              onClick={handleApply}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              {applied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{applied ? 'Applied!' : 'Use as Avatar'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
