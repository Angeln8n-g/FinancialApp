'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Copy, Check, ExternalLink, X, Zap, Sparkles, HelpCircle, Settings, ShieldCheck, ArrowRight } from 'lucide-react';

interface TelegramBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TelegramBotModal({ isOpen, onClose }: TelegramBotModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'custom' | 'examples'>('quick');

  // Custom Bot Setup state
  const [botToken, setBotToken] = useState('');
  const [settingUp, setSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<{ success: boolean; message: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null);

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

  useEffect(() => {
    if (!isOpen) return;
    fetchLink();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'start' | 'webhook') => {
    navigator.clipboard.writeText(text);
    if (type === 'start') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  const handleSetupCustomBot = async () => {
    if (!botToken.trim()) return;
    setSettingUp(true);
    setSetupResult(null);

    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/quick-entry/setup-telegram-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ botToken: botToken.trim() }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSetupResult({ success: true, message: resData.message || '¡Bot configurado con éxito!' });
        await fetchLink();
        setBotToken('');
      } else {
        setSetupResult({ success: false, message: resData.message || 'Error al configurar el bot' });
      }
    } catch (err: any) {
      setSetupResult({ success: false, message: err.message || 'Error de conexión con el servidor' });
    } finally {
      setSettingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#101A36] border border-[#1E2B4D] w-full max-w-xl rounded-2xl p-6 relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Conectar Bot de Telegram</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Guía Paso a Paso ⚡
                </span>
              </h3>
              <p className="text-xs text-slate-400">Registra tus gastos por texto o notas de voz al instante.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-[#0A1128] p-1 border border-[#1E2B4D]">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'quick'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Vinculación (@{data?.botUsername || 'HogarIQBot'})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'custom'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Crear Bot Propio
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'examples'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Ejemplos de Uso
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* TAB 1: VINCULACIÓN DIRECTA */}
            {activeTab === 'quick' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Paso 1 de 2: Abre el Bot en Telegram</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Haz clic en el botón siguiente para abrir la conversación con{' '}
                    <strong className="text-white">@{data?.botUsername || 'HogarIQBot'}</strong> en tu móvil o PC:
                  </p>

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
                </div>

                <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Paso 2 de 2: Iniciar / Vincular</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Al abrir el chat, pulsa el botón <strong>"INICIAR"</strong> o <strong>"START"</strong> abajo en Telegram.
                    Si no aparece el botón, copia y envía este comando en el chat:
                  </p>

                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-sky-300">
                    <span className="truncate flex-1">/start {data?.token}</span>
                    <button
                      onClick={() => handleCopy(`/start ${data?.token}`, 'start')}
                      className="text-slate-400 hover:text-white shrink-0 p-1.5 rounded hover:bg-slate-800 transition-colors"
                      title="Copiar comando"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copied && <p className="text-[11px] text-emerald-400 font-semibold">¡Comando copiado al portapapeles!</p>}

                  <p className="text-[11px] text-slate-400">
                    ✅ Recibirás una respuesta inmediata del bot confirmando que tu hogar ha sido enlazado.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: CONFIGURACIÓN BOT PROPIO CON BOTFATHER */}
            {activeTab === 'custom' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-4 h-4" />
                    <span>¿Deseas tener tu propio Bot Privado en Telegram?</span>
                  </span>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Si prefieres crear un bot con tu propio nombre o foto para tu familia, puedes crearlo gratis en 1 minuto:
                  </p>

                  <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 pl-1">
                    <li>
                      Abre Telegram y busca a{' '}
                      <a
                        href="https://t.me/BotFather"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline font-semibold"
                      >
                        @BotFather <ExternalLink className="inline w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      Escríbele el comando <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sky-300">/newbot</code>.
                    </li>
                    <li>Asigna el nombre que desees (ej: <em>Finanzas Familiares</em>) y un usuario (ej: <em>MiFamiliaHogarBot</em>).</li>
                    <li>
                      BotFather te entregará un <strong>HTTP API Token</strong> (ej: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300">123456789:ABCdefGhI...</code>).
                    </li>
                  </ol>
                </div>

                {/* Formulario de activación rápida */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-200 block">
                    Pega aquí el Token de @BotFather para auto-activar:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: 7123456789:AAHk..."
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="flex-1 bg-[#0A1128] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <button
                      onClick={handleSetupCustomBot}
                      disabled={settingUp || !botToken.trim()}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs disabled:opacity-50 transition-all shadow-md shrink-0 flex items-center gap-1.5"
                    >
                      {settingUp ? 'Configurando...' : 'Vincular Bot'}
                    </button>
                  </div>

                  {setupResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs font-medium ${
                        setupResult.success
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {setupResult.message}
                    </div>
                  )}

                  {/* Webhook Manual URL */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      URL del Webhook de tu servidor HogarIQ (por si configuras manualmente):
                    </span>
                    <div className="flex items-center gap-2 bg-[#0A1128] px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400">
                      <span className="truncate flex-1">{data?.webhookUrl || 'https://api-hogariq.kasino21.com/api/quick-entry/telegram-webhook'}</span>
                      <button
                        onClick={() => handleCopy(data?.webhookUrl || 'https://api-hogariq.kasino21.com/api/quick-entry/telegram-webhook', 'webhook')}
                        className="text-slate-400 hover:text-white shrink-0 p-1 rounded hover:bg-slate-800"
                      >
                        {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EJEMPLOS DE USO */}
            {activeTab === 'examples' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>¿Cómo escribirle al Bot una vez vinculado?</span>
                </div>
                <p className="text-xs text-slate-300">
                  El bot comprende lenguaje natural. Puedes especificar el concepto, el monto, la cuenta o si es compartido:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="font-bold text-emerald-300">"Almuerzo 12.50 tarjeta"</p>
                    <p className="text-[11px] text-slate-400">Gasto de $12.50, categoría Alimentación, debitado de tu cuenta Tarjeta.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="font-bold text-emerald-300">"Supermercado 85 compartido"</p>
                    <p className="text-[11px] text-slate-400">Divide 50/50 el gasto entre los miembros del hogar automáticamente.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="font-bold text-emerald-300">"Gasolina 45 efectivo"</p>
                    <p className="text-[11px] text-slate-400">Categoría Transporte de $45 restado de tu efectivo.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="font-bold text-emerald-300">"Sueldo 1500 en banco"</p>
                    <p className="text-[11px] text-slate-400">Detecta ingreso (+) y lo suma a tu cuenta bancaria.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-200">
                    <strong>¡Confirmación Instantánea!</strong> En cada mensaje, el bot te responderá confirmando el registro y la actualización del balance de tu hogar.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-[#1E2B4D]/60">
              <span className="text-[11px] text-slate-500">HogarIQ Finance Bot</span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Entendido / Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
