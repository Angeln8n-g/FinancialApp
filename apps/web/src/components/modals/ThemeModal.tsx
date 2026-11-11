'use client';

import React from 'react';
import { X, Palette, Check, Sun, Moon, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTheme, ThemeId, THEMES } from '../ThemeProvider';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { theme, currentTheme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="mint-card w-full max-w-xl p-5 sm:p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl border flex items-center justify-center transition-colors"
              style={{
                backgroundColor: 'var(--primary-muted)',
                borderColor: 'var(--primary-border)',
                color: 'var(--primary)',
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Temas y Paletas de Colores</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: 'var(--primary-muted)',
                    borderColor: 'var(--primary-border)',
                    color: 'var(--primary-text)',
                  }}
                >
                  {currentTheme.badge}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Selecciona la armonía cromática adaptada a tu iluminación, descanso visual y preferencia
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

        {/* Lista de Temas */}
        <div className="space-y-3">
          {THEMES.map((t) => {
            const isSelected = theme === t.id;

            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  borderColor: isSelected ? t.accentHex : undefined,
                  boxShadow: isSelected ? `0 0 0 1px ${t.accentHex}40, 0 4px 20px -2px rgba(0, 0, 0, 0.35)` : undefined,
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 group ${
                  isSelected
                    ? 'bg-[#162347]/95 shadow-lg'
                    : 'border-[#1E2B4D] bg-[#101A36]/75 hover:bg-[#162347]/70 hover:border-[#2D3E6B]'
                }`}
              >
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                      {t.name}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors"
                      style={{
                        backgroundColor: isSelected ? `${t.accentHex}20` : undefined,
                        borderColor: isSelected ? `${t.accentHex}50` : undefined,
                        color: isSelected ? t.accentHex : undefined,
                      }}
                    >
                      {t.badge}
                    </span>
                    {t.isLight ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500">
                        <Sun className="w-3.5 h-3.5" />
                        <span>Modo Claro</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                        <Moon className="w-3.5 h-3.5" />
                        <span>Modo Oscuro</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-tight">
                    {t.subtitle}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {t.description}
                  </p>
                </div>

                {/* Swatches de Muestra Cromática */}
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

                  {/* Indicador de Selección con Acento Propio */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'font-bold shadow-xs'
                        : 'border-[#1E2B4D] text-transparent group-hover:border-slate-500'
                    }`}
                    style={{
                      backgroundColor: isSelected ? t.accentHex : undefined,
                      borderColor: isSelected ? t.accentHex : undefined,
                      color: isSelected ? (t.isLight ? '#FFFFFF' : '#0F120F') : undefined,
                    }}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer con Botón Armónico */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1E2B4D]">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: currentTheme.accentHex }} />
            <span>El tema seleccionado se guarda automáticamente en tu navegador</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all cursor-pointer hover:opacity-90"
            style={{ backgroundColor: currentTheme.accentHex }}
          >
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
