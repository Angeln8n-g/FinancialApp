'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Copy, Check, ExternalLink, X, Zap, Sparkles } from 'lucide-react';

interface TelegramBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TelegramBotModal({ isOpen, onClose }: TelegramBotModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLink = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/quick-entry/telegram-link`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Error cargando enlace de Telegram:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#101A36] border border-[#1E2B4D] w-full max-w-lg rounded-2xl p-6 relative shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bot de Telegram HogarIQ</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Express ⚡
                </span>
              </h3>
              <p className="text-xs text-slate-400">Registra gastos al instante sin abrir la aplicación.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Pasos de Conexión */}
            <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Paso 1: Abre el Bot y Vincula tu Hogar
              </span>

              {data?.deepLink && (
                <a
                  href={data.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Bot className="w-4 h-4" />
                  <span>Abrir @{data.botUsername} en Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400">o envía manualmente este comando en el chat:</span>
                <div className="mt-1 flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-sky-300">
                  <span className="truncate flex-1">/start {data?.token}</span>
                  <button
                    onClick={() => handleCopy(`/start ${data?.token}`)}
                    className="text-slate-400 hover:text-white shrink-0 p-1 rounded hover:bg-slate-800"
                    title="Copiar comando"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Ejemplos de Lenguaje Natural */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>¿Cómo escribirle al Bot?</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="font-semibold text-emerald-300">"Almuerzo 12.50 tarjeta"</p>
                  <span className="text-[10px] text-slate-400">Detecta comida, monto y cuenta tarjeta.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="font-semibold text-emerald-300">"Supermercado 85 compartido"</p>
                  <span className="text-[10px] text-slate-400">Se divide 50/50 automáticamente con tu pareja.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="font-semibold text-emerald-300">"Gasolina 45"</p>
                  <span className="text-[10px] text-slate-400">Categoría transporte asignada de inmediato.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="font-semibold text-emerald-300">"Sueldo 1500 en banco"</p>
                  <span className="text-[10px] text-slate-400">Suma a tus ingresos y balance de cuenta.</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
