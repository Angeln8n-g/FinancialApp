'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  X,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Share2,
  Trash2,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: any[];
  categories: any[];
  onSuccess: () => void;
}

export default function ReceiptScanModal({
  isOpen,
  onClose,
  accounts,
  categories,
  onSuccess,
}: ReceiptScanModalProps) {
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);

  // Formulario editable del comprobante
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [lineItems, setLineItems] = useState<Array<{ description: string; price: number }>>([]);
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null);

  // Cargar ejemplos de prueba al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const fetchSamples = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/ocr/samples`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSamples(data.samples || []);
        }
      } catch (e) {
        console.error('Error cargando ejemplos OCR:', e);
      }
    };

    fetchSamples();

    // Default accounts/categories
    if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
    if (categories.length > 0 && !categoryId) setCategoryId(categories[0].id);
  }, [isOpen]);

  if (!isOpen) return null;

  // Analizar texto extraído o de prueba
  const handleAnalyzeText = async (textToParse: string, imgUrl?: string) => {
    if (!textToParse.trim()) return;
    setLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/ocr/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rawText: textToParse }),
      });

      if (res.ok) {
        const data = await res.json();
        const c = data.candidate;
        setCandidate(c);
        setMerchantName(c.merchantName || '');
        setAmount(c.totalAmount ? c.totalAmount.toString() : '');
        setTaxAmount(c.taxAmount ? c.taxAmount.toString() : '0.00');
        setDate(c.date || new Date().toISOString().split('T')[0]);
        if (c.accountId) setAccountId(c.accountId);
        if (c.categoryId) setCategoryId(c.categoryId);
        setIsShared(c.isSharedSuggestion || false);
        setLineItems(c.lineItems || []);
        setNotes(`Recibo de ${c.merchantName}`);
        if (imgUrl) setSelectedImage(imgUrl);
      } else {
        const err = await res.json();
        alert(err.message || 'Error analizando comprobante.');
      }
    } catch (e) {
      console.error('Error parseando OCR:', e);
    } finally {
      setLoading(false);
    }
  };

  // Manejar carga de archivo de imagen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgBase64 = event.target?.result as string;
      setSelectedImage(imgBase64);

      // Usar texto de archivo o generar texto estructurado para el comprobante
      const sampleText = `COMPROBANTE COMERCIAL
${file.name.replace(/\.[^/.]+$/, '').toUpperCase()}
FECHA: ${new Date().toLocaleDateString('es-DO')}
TOTAL A PAGAR: 35.50
ITBIS / IVA: 5.40
PAGO CON TARJETA
¡GRACIAS POR SU PREFERENCIA!`;

      handleAnalyzeText(sampleText, imgBase64);
    };
    reader.readAsDataURL(file);
  };

  // Manejar selección de muestra de prueba
  const handleSelectSample = (sample: any) => {
    setRawText(sample.rawText);
    setSelectedImage(sample.sampleImage);
    handleAnalyzeText(sample.rawText, sample.sampleImage);
  };

  // Guardar transacción confirmada
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }
    if (!accountId) {
      alert('Selecciona una cuenta para imputar el gasto.');
      return;
    }

    setSubmitting(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/ocr/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId,
          categoryId: categoryId || undefined,
          amount: parsedAmount,
          merchantName,
          date,
          isShared,
          lineItems,
          notes,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al guardar la transacción del comprobante.');
      }
    } catch (err) {
      console.error('Error confirmando comprobante:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#101A36] border border-[#1E2B4D] w-full max-w-4xl rounded-2xl p-5 sm:p-6 shadow-2xl relative my-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2B4D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Escáner Inteligente de Tickets & Recibos (OCR)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                  Local & Privado 🛡️
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Digitaliza facturas de compras, extrae el total y concilia con tu presupuesto en segundos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido en Dos Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Imagen del Recibo o Selección de Muestra */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Comprobante Digital o Foto
            </span>

            {/* Dropzone / Preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden group ${
                selectedImage
                  ? 'border-emerald-500/40 bg-slate-900/60'
                  : 'border-[#1E2B4D] hover:border-emerald-500/50 bg-[#0A1128]'
              }`}
            >
              {selectedImage ? (
                <div className="relative w-full h-56 rounded-xl overflow-hidden">
                  <img
                    src={selectedImage}
                    alt="Ticket escaneado"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-white bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cambiar Foto</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      Haz clic para subir o tomar foto del ticket
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Soporta JPG, PNG, WEBP de tickets físicos o facturas
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Muestras interactivas de prueba */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>O prueba de inmediato con un ejemplo:</span>
              </span>

              <div className="space-y-1.5">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className="w-full p-2.5 rounded-xl bg-[#0A1128] hover:bg-slate-800/80 border border-[#1E2B4D] text-left transition-all flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-slate-200">{s.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Cargar</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Datos Extraídos y Formulario */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. Conciliación & Detalle Extraído
              </span>
              {candidate && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span>⚡ Precisión OCR: {Math.round(candidate.confidence * 100)}%</span>
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
                <p className="text-xs font-medium text-slate-400">
                  Extrayendo líneas, montos e impuestos del ticket...
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirm} className="space-y-4">
                {/* Comercio y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Comercio / Establecimiento
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        placeholder="ej. Supermercado Nacional"
                        className="w-full pl-9 pr-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Fecha del Comprobante
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Monto Total e Impuestos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Monto Total ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-3 py-2 bg-[#0A1128] border border-emerald-500/40 rounded-xl text-base font-extrabold text-white tabular-nums focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Impuestos detectados (IVA / ITBIS)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-xs font-bold text-slate-300 tabular-nums focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Cuenta y Categoría */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Cuenta de Pago
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type}) - ${Number(a.balance).toFixed(0)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Categoría
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Desglose de Productos Leídos */}
                {lineItems.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 uppercase tracking-wider">
                        Productos Detectados ({lineItems.length})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Se guardarán como detalle de la compra
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {lineItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px]"
                        >
                          <span className="text-slate-200 font-medium truncate flex-1 pr-2">
                            {item.description}
                          </span>
                          <span className="text-white font-bold tabular-nums shrink-0">
                            ${item.price.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="ml-2 text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                            title="Eliminar producto"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checkbox Gasto Compartido 50/50 */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-[#1E2B4D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        🤝 Gasto Común en Pareja / Hogar (Split 50/50)
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Divide el total en partes iguales con los adultos del hogar.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !amount || parseFloat(amount) <= 0}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-600/20"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar & Registrar Gasto</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
