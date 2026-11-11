'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  User,
  Shield,
  Download,
  Trash2,
  Lock,
  AlertTriangle,
  ExternalLink,
  Check,
  FileText,
  Mail,
  Home,
  ShieldAlert,
} from 'lucide-react';
import { apiFetch, getToken } from '@/lib/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  household: any;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  household,
}: UserProfileModalProps) {
  const router = useRouter();

  // Estados de exportación y eliminación
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleExportData = async () => {
    setExporting(true);
    setError(null);
    try {
      const data = await apiFetch('/api/auth/export-data');
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `hogariq-datos-financieros-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || 'Error al exportar los datos.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordConfirm.trim()) {
      setError('Debes ingresar tu contraseña para confirmar la eliminación.');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const res = await apiFetch('/api/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ passwordConfirm }),
      });

      // Limpiar sesión completa
      localStorage.removeItem('hogariq_token');
      localStorage.removeItem('hogariq_user');
      localStorage.removeItem('hogariq_household');

      onClose();
      router.push('/login?deleted=true');
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la baja de la cuenta. Verifica tu contraseña.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-lg p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Mi Cuenta y Privacidad</h3>
              <p className="text-[11px] text-slate-400">
                Gestión de perfil, portabilidad y derechos de protección de datos
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              setPasswordConfirm('');
              setError(null);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Tarjeta de Información de Usuario */}
          <div className="p-4 rounded-2xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-100">{user.fullName || 'Usuario'}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user.email}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {household?.role || 'Miembro'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#1E2B4D]/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-emerald-400" />
                Hogar: <strong className="text-slate-200">{household?.name || 'Hogar'}</strong>
              </span>
              <span className="text-slate-500 text-[10px]">
                ID: {user.id ? `${user.id.slice(0, 8)}...` : ''}
              </span>
            </div>
          </div>

          {/* Sección de Portabilidad y Políticas de Privacidad */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Soberanía y Portabilidad de Datos
            </h4>

            <div className="p-3.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Conforme al principio de transparencia y regulaciones internacionales de privacidad (GDPR / ARCO), puedes descargar una copia completa de tus registros financieros en cualquier momento.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={exporting}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exporting ? 'Generando copia...' : 'Descargar mis Datos (JSON)'}</span>
                </button>

                <Link
                  href="/privacy"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 hover:text-white border border-[#1E2B4D] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ver Políticas de Privacidad</span>
                </Link>
              </div>

              {exportSuccess && (
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copia de seguridad descargada exitosamente en tu dispositivo.</span>
                </div>
              )}
            </div>
          </div>

          {/* Sección de Zona de Peligro: Darse de Baja y Eliminación de Datos */}
          <div className="space-y-2.5 pt-2 border-t border-[#1E2B4D]">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Zona de Peligro: Darse de Baja
            </h4>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-100">
                  Eliminación Definitiva de Cuenta y Datos
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Si deseas dejar de utilizar HogarIQ, puedes darte de baja. Se destruirán permanentemente tu cuenta, contraseñas y datos personales de acuerdo a tu Derecho al Olvido. Si eres el único integrante de tu hogar, todas las cuentas y transacciones quedarán purgadas.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Darse de Baja y Eliminar mis Datos</span>
                </button>
              ) : (
                <form onSubmit={handleDeleteAccount} className="pt-2 border-t border-rose-500/20 space-y-3">
                  <div className="p-2.5 rounded-xl bg-[#0A1128] border border-rose-500/30 text-rose-200 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Acción irreversible:</strong> Esta operación no se puede deshacer. Confirma tu contraseña para proceder con la eliminación definitiva.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                      Confirma tu Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Ingresa tu contraseña actual"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#0A1128] border border-rose-500/40 text-slate-100 text-xs focus:outline-none focus:border-rose-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setPasswordConfirm('');
                        setError(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-white transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={deleting}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deleting ? 'Eliminando datos...' : 'Confirmar Eliminación Definitiva'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-5 border-t border-[#1E2B4D]">
          <button
            type="button"
            onClick={() => {
              setShowDeleteConfirm(false);
              setPasswordConfirm('');
              setError(null);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
