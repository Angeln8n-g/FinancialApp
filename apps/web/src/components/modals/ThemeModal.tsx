'use client';

import React from 'react';
import { X, Palette, Check, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme, ThemeId, THEMES } from '../ThemeProvider';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-xl p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Temas y Paletas de Colores</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Cálidos & Profesionales
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Elige el estilo visual que mejor se adapte a tu comodidad, luz ambiental y preferencia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {THEMES.map((t) => {
            const isSelected = theme === t.id;

            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 group ${
                  isSelected
                    ? 'border-amber-500/60 bg-[#162347]/90 shadow-lg ring-1 ring-amber-500/30'
                    : 'border-[#1E2B4D] bg-[#101A36]/70 hover:bg-[#162347]/60 hover:border-[#2D3E6B]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                      {t.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#162347] text-slate-400 border-[#1E2B4D]'
                      }`}
                    >
                      {t.badge}
                    </span>
                    {t.isLight ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">
                    {t.subtitle}
                  </p>
                </div>

                {/* Swatches de Colores */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="flex items-center -space-x-1 p-1.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: t.bgHex }}
                      title={`Fondo: ${t.bgHex}`}
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: t.surfaceHex }}
                      title={`Superficie: ${t.surfaceHex}`}
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: t.borderHex }}
                      title={`Borde: ${t.borderHex}`}
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: t.accentHex }}
                      title={`Acento Primario: ${t.accentHex}`}
                    />
                  </div>

                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-[#0A1128] border-amber-400 font-bold'
                        : 'border-[#1E2B4D] text-transparent group-hover:border-slate-500'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-[#1E2B4D]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
