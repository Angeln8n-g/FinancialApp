'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { ShieldCheck, CheckCircle2, Users, Sparkles, Lock } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDeleted = searchParams.get('deleted') === 'true';

  const [isRegister, setIsRegister] = useState(false);
  const [isChildAccount, setIsChildAccount] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [email, setEmail] = useState('angellafraga@gmail.con');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister && isChildAccount) {
      if (!parentEmail.trim() || !parentEmail.includes('@')) {
        setError('Debes ingresar el correo electrónico del padre o tutor que tendrá el control parental.');
        return;
      }
      if (parentEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
        setError('El correo del padre o tutor debe ser diferente al correo de la cuenta de niño.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? {
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            isChildAccount,
            ...(isChildAccount ? { parentEmail: parentEmail.trim().toLowerCase() } : {}),
          }
        : { email: email.trim(), password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(msg || 'Error en la solicitud');
      }

      localStorage.setItem('hogariq_token', data.accessToken);
      localStorage.setItem('hogariq_user', JSON.stringify(data.user));
      localStorage.setItem('hogariq_household', JSON.stringify(data.household));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mint-card p-8 shadow-2xl relative overflow-hidden border border-[#1E2B4D]">
        {/* Subtle ambient light */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center justify-center text-center mb-6">
          <Logo size="xl" showTagline={false} className="mb-3" />
          <p className="text-sm text-slate-400 mt-1">
            {isRegister
              ? isChildAccount
                ? 'Crear Cuenta de Niño con Control Parental'
                : 'Crea la cuenta para tu hogar'
              : 'Asistente Financiero Familiar'}
          </p>
        </div>

        {/* Banner de cuenta eliminada exitosamente */}
        {isDeleted && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-300">Cuenta y datos eliminados con éxito</p>
              <p className="text-[11px] text-emerald-200/80 mt-1 leading-relaxed">
                Tu cuenta de usuario, membresía y todos los registros financieros han sido purgados de forma permanente de acuerdo con nuestras políticas de privacidad y soberanía de datos.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              {/* Selector: ¿Es una cuenta para niño? */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">
                  ¿Qué tipo de cuenta deseas crear?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsChildAccount(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      !isChildAccount
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-[#0A1128] border-[#1E2B4D] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Users className="w-4 h-4 text-emerald-400" />
                      {!isChildAccount && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold text-slate-100 mt-0.5">Cuenta Adulto</span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      Control total del hogar y finanzas
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsChildAccount(true);
                      if (email === 'angellafraga@gmail.con') {
                        setParentEmail('angellafraga@gmail.con');
                        setEmail('');
                        setPassword('');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isChildAccount
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                        : 'bg-[#0A1128] border-[#1E2B4D] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      {isChildAccount && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <span className="text-xs font-bold text-slate-100 mt-0.5">Cuenta para Niño</span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      Solo acceso infantil con control parental
                    </span>
                  </button>
                </div>
              </div>

              {/* Si es cuenta para niño: Solicitar correo del padre y explicar enlace automático */}
              {isChildAccount && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-200/90 leading-relaxed">
                      <strong className="text-amber-300 block">Control Parental y Enlace Automático</strong>
                      Esta cuenta solo tendrá acceso a su propia <strong>Cuenta de Niño</strong> (alcancía, mesada y misiones) y quedará enlazada automáticamente al padre o tutor indicado.
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                      Correo del Padre / Tutor (Control Parental) *
                    </label>
                    <input
                      type="email"
                      required={isChildAccount}
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="padre.tutor@ejemplo.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-amber-500/40 text-slate-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  {isChildAccount ? 'Nombre del Niño / Hijo(a)' : 'Nombre Completo'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isChildAccount ? 'Ej. Mateo Fraga' : 'Ej. Tu nombre'}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
              {isRegister && isChildAccount ? 'Correo de la Cuenta del Niño' : 'Correo Electrónico'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRegister && isChildAccount ? 'nino@ejemplo.com' : 'correo@ejemplo.com'}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50 mt-6 shadow-sm ${
              isRegister && isChildAccount
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {loading
              ? 'Procesando...'
              : isRegister
              ? isChildAccount
                ? 'Crear Cuenta de Niño y Enlazar Padre'
                : 'Crear Cuenta e Iniciar'
              : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegister ? (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setIsChildAccount(false);
                }}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Inicia Sesión
              </button>
            </p>
          ) : (
            <p>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="text-emerald-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Regístrate aquí
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Footer link to Privacy Policy */}
      <div className="mt-6 text-center">
        <Link
          href="/privacy"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors py-1 px-3 rounded-lg hover:bg-[#101A36]/50"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Políticas de Privacidad & Soberanía de Datos</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A1128] text-slate-100">
      <Suspense fallback={<div className="text-slate-400 text-xs">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
