'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Layers,
  Filter,
  Check,
  ChevronRight
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: any[];
  categories: any[];
  onImportComplete: () => Promise<void>;
}

interface ParsedTransactionRow {
  id: string;
  selected: boolean;
  date: string;
  description: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  categoryId?: string;
  isDuplicate?: boolean;
}

export default function ImportModal({
  isOpen,
  onClose,
  accounts,
  categories,
  onImportComplete,
}: ImportModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRawRows, setCsvRawRows] = useState<string[][]>([]);

  // Mapeo de columnas
  const [dateColIdx, setDateColIdx] = useState<number>(0);
  const [descColIdx, setDescColIdx] = useState<number>(1);
  const [amountColIdx, setAmountColIdx] = useState<number>(2);

  // Filas parseadas listas para previsualizar
  const [parsedRows, setParsedRows] = useState<ParsedTransactionRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sugerir categoría automáticamente por palabras clave
  const suggestCategory = (description: string): string | undefined => {
    const text = description.toLowerCase();
    for (const cat of categories) {
      const cName = cat.name.toLowerCase();
      if (text.includes(cName)) return cat.id;
    }

    if (/super|mercadona|carrefour|lidl|dia|walmart|alcampo|eroski|costco|jumbo|coto/i.test(text)) {
      const match = categories.find((c) => /super|alimentaci|comida|mercado/i.test(c.name));
      if (match) return match.id;
    }
    if (/uber|cabify|taxi|gasolina|repsol|cepsa|combustible|peaje|metro|renfe/i.test(text)) {
      const match = categories.find((c) => /transporte|gasolina|auto|vehiculo/i.test(c.name));
      if (match) return match.id;
    }
    if (/netflix|spotify|prime|hbo|disney|apple|youtube|steam|playstation/i.test(text)) {
      const match = categories.find((c) => /suscripci|ocio|entretenimiento/i.test(c.name));
      if (match) return match.id;
    }
    if (/restaurante|burger|pizza|mcdonald|starbucks|cafe|bar|tasca/i.test(text)) {
      const match = categories.find((c) => /restaurante|salidas|comida/i.test(c.name));
      if (match) return match.id;
    }
    if (/farmacia|salud|medico|hospital|dentista/i.test(text)) {
      const match = categories.find((c) => /salud|farmacia|medicina/i.test(c.name));
      if (match) return match.id;
    }
    return undefined;
  };

  // Procesar archivo cargado
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processCsvContent(content);
      }
    };
    reader.readAsText(file);
  };

  const processCsvContent = (content: string) => {
    setRawText(content);

    // Detectar delimitador más frecuente entre coma, punto y coma o tab
    const firstLines = content.split(/\r?\n/).slice(0, 5).join('\n');
    const commas = (firstLines.match(/,/g) || []).length;
    const semicolons = (firstLines.match(/;/g) || []).length;
    const tabs = (firstLines.match(/\t/g) || []).length;

    let detectedDelim: ',' | ';' | '\t' = ',';
    if (semicolons > commas && semicolons > tabs) detectedDelim = ';';
    else if (tabs > commas && tabs > semicolons) detectedDelim = '\t';

    setDelimiter(detectedDelim);

    const allLines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (allLines.length < 2) return;

    const parseLine = (line: string) => {
      // Manejar valores entre comillas simples/dobles
      const regex = new RegExp(`(?:^|${detectedDelim})(?:"([^"]*)"|'([^']*)'|([^"${detectedDelim}']*))`, 'g');
      const row: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        const val = match[1] ?? match[2] ?? match[3] ?? '';
        row.push(val.trim());
        if (regex.lastIndex === line.length) break;
      }
      return row;
    };

    const headerRow = parseLine(allLines[0]);
    const dataRows = allLines.slice(1).map(parseLine);

    setCsvHeaders(headerRow);
    setCsvRawRows(dataRows);

    // Autodetectar índices de columnas por nombre
    let dIdx = 0;
    let descIdx = 1;
    let aIdx = headerRow.length > 2 ? 2 : 1;

    headerRow.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (/fecha|date|dia|operaci|valor/i.test(lower)) dIdx = idx;
      if (/concepto|descrip|detalle|beneficiario|payee|comercio/i.test(lower)) descIdx = idx;
      if (/importe|monto|cantidad|amount|total|saldo/i.test(lower)) aIdx = idx;
    });

    setDateColIdx(dIdx);
    setDescColIdx(descIdx);
    setAmountColIdx(aIdx);
    setStep('map');
  };

  const generatePreview = () => {
    const rows: ParsedTransactionRow[] = [];

    csvRawRows.forEach((row, i) => {
      const rawDate = row[dateColIdx]?.trim() || '';
      const rawDesc = row[descColIdx]?.trim() || 'Movimiento sin concepto';
      let rawAmountStr = row[amountColIdx]?.trim() || '0';

      // Normalizar número (limpiar caracteres como $, €, espacios, y manejar comas decimales)
      rawAmountStr = rawAmountStr.replace(/[$€\s]/g, '');
      let isNegative = rawAmountStr.includes('-');

      // Reemplazar coma por punto para parseo numérico
      if (rawAmountStr.includes(',') && !rawAmountStr.includes('.')) {
        rawAmountStr = rawAmountStr.replace(',', '.');
      } else if (rawAmountStr.includes(',') && rawAmountStr.includes('.')) {
        // Formato 1.250,50 -> remover puntos y cambiar coma por punto
        rawAmountStr = rawAmountStr.replace(/\./g, '').replace(',', '.');
      }

      const numVal = Math.abs(parseFloat(rawAmountStr));
      if (isNaN(numVal) || numVal <= 0) return;

      // Intentar parsear fecha a formato ISO YYYY-MM-DD
      let parsedDate = new Date().toISOString().split('T')[0];
      if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(rawDate)) {
        const parts = rawDate.split(/[/-]/);
        if (parts.length === 3) {
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          const month = parts[1].padStart(2, '0');
          const day = parts[0].padStart(2, '0');
          parsedDate = `${year}-${month}-${day}`;
        }
      } else if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(rawDate)) {
        parsedDate = rawDate.replace(/\//g, '-');
      }

      const type: 'EXPENSE' | 'INCOME' = isNegative ? 'EXPENSE' : 'INCOME';
      const categoryId = suggestCategory(rawDesc);

      rows.push({
        id: `row-${i}-${Date.now()}`,
        selected: true,
        date: parsedDate,
        description: rawDesc,
        amount: numVal,
        type,
        categoryId,
      });
    });

    setParsedRows(rows);
    setStep('preview');
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  const toggleRow = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)),
    );
  };

  const updateRowField = (id: string, field: string, value: any) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleConfirmImport = async () => {
    const selected = parsedRows.filter((r) => r.selected);
    if (selected.length === 0) return;
    if (!selectedAccountId) return;

    setImporting(true);
    setResultMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: selectedAccountId,
          transactions: selected.map((r) => ({
            accountId: selectedAccountId,
            date: new Date(r.date).toISOString(),
            description: r.description,
            amount: r.amount,
            type: r.type,
            categoryId: r.categoryId || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResultMessage(
          `¡Éxito! Se importaron ${data.importedCount || selected.length} transacciones correctamente${
            data.skippedCount ? ` (${data.skippedCount} duplicadas omitidas)` : ''
          }.`,
        );
        setTimeout(async () => {
          await onImportComplete();
          onClose();
        }, 1500);
      } else {
        setResultMessage(`Error: ${data.message || 'No se pudo completar la importación'}`);
      }
    } catch (err: any) {
      setResultMessage(`Error de conexión: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = parsedRows.filter((r) => r.selected).length;
  const totalAmountSelected = parsedRows
    .filter((r) => r.selected)
    .reduce((sum, r) => (r.type === 'EXPENSE' ? sum - r.amount : sum + r.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#101A36] border border-[#1E2B4D] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E2B4D] bg-[#0A1128]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Importador Inteligente de Extractos Bancarios
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  CSV / Excel
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sube el archivo de tu banco para registrar meses de movimientos en segundos sin fricción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Selector de Cuenta Destino */}
          <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Cuenta Bancaria de Destino</span>
              <span className="text-[11px] text-slate-400">
                Las transacciones importadas afectarán el saldo de esta cuenta
              </span>
            </div>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs font-medium focus:outline-none focus:border-emerald-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (${Number(acc.balance || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* PASO 1: Subida de archivo */}
          {step === 'upload' && (
            <div className="space-y-4">
              <label
                htmlFor="csv-upload"
                className="border-2 border-dashed border-[#1E2B4D] hover:border-emerald-500/50 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#0A1128]/40 hover:bg-[#0A1128]/80 transition-all text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-200 block">
                    Haz clic para seleccionar o arrastra tu extracto bancario
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">
                    Archivos .CSV o .TXT descargados de BBVA, Santander, Caixa, Wise, Revolut, etc.
                  </span>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Opción de pegar texto crudo */}
              <div className="text-center">
                <span className="text-xs text-slate-500">O también puedes pegar filas copiadas de tu portal web:</span>
                <textarea
                  placeholder="2026-05-12, Supermercado Mercadona, -45.50&#10;2026-05-13, Transferencia Nómina, 2100.00"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="mt-2 w-full h-24 p-3 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                {rawText.trim().length > 0 && (
                  <button
                    onClick={() => processCsvContent(rawText)}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Procesar Texto Pegado
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: Mapeo de Columnas */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-300">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>
                  Hemos detectado las columnas automáticamente. Revisa que correspondan a tu extracto:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Columna de Fecha</label>
                  <select
                    value={dateColIdx}
                    onChange={(e) => setDateColIdx(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs font-medium"
                  >
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Columna ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-2">
                    Ej: {csvRawRows[0]?.[dateColIdx] || '-'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Columna de Concepto</label>
                  <select
                    value={descColIdx}
                    onChange={(e) => setDescColIdx(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs font-medium"
                  >
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Columna ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-2">
                    Ej: {csvRawRows[0]?.[descColIdx] || '-'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Columna de Importe</label>
                  <select
                    value={amountColIdx}
                    onChange={(e) => setAmountColIdx(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs font-medium"
                  >
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Columna ${i + 1}`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-2">
                    Ej: {csvRawRows[0]?.[amountColIdx] || '-'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-semibold hover:bg-[#1D2D5A]"
                >
                  Cambiar Archivo
                </button>
                <button
                  onClick={generatePreview}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  <span>Continuar a Previsualización</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Previsualización de Filas y Categorización */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    Seleccionar Todas
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Deseleccionar
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  <strong className="text-emerald-400">{selectedCount}</strong> de {parsedRows.length} filas
                  seleccionadas
                </span>
              </div>

              <div className="border border-[#1E2B4D] rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0A1128] text-slate-400 font-semibold border-b border-[#1E2B4D] sticky top-0">
                    <tr>
                      <th className="p-3 w-10"></th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Concepto</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Categoría Sugerida</th>
                      <th className="p-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2B4D]/60 bg-[#101A36]">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-[#162347]/50 transition-colors ${
                          !row.selected ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRow(row.id)}
                            className="rounded accent-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="p-3 font-medium text-slate-100 max-w-xs truncate">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => updateRowField(row.id, 'description', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-[#1E2B4D] focus:border-emerald-500 focus:outline-none w-full text-slate-100 text-xs"
                          />
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <select
                            value={row.type}
                            onChange={(e) => updateRowField(row.id, 'type', e.target.value)}
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                              row.type === 'EXPENSE'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            }`}
                          >
                            <option value="EXPENSE">Gasto (-)</option>
                            <option value="INCOME">Ingreso (+)</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={row.categoryId || ''}
                            onChange={(e) => updateRowField(row.id, 'categoryId', e.target.value || undefined)}
                            className="px-2 py-1 rounded bg-[#0A1128] border border-[#1E2B4D] text-slate-200 text-xs font-medium focus:outline-none"
                          >
                            <option value="">Sin Categoría</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td
                          className={`p-3 text-right font-bold tabular-nums whitespace-nowrap ${
                            row.type === 'EXPENSE' ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {row.type === 'EXPENSE' ? '-' : '+'}${row.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {resultMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    resultMessage.startsWith('¡Éxito')
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {resultMessage}
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1E2B4D]">
                <button
                  onClick={() => setStep('map')}
                  disabled={importing}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-semibold hover:bg-[#1D2D5A]"
                >
                  Volver a Mapeo
                </button>

                <button
                  onClick={handleConfirmImport}
                  disabled={importing || selectedCount === 0}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xl shadow-emerald-900/30 cursor-pointer"
                >
                  {importing ? (
                    <span>Importando {selectedCount} movimientos...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar e Importar ({selectedCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}