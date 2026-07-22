'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('angellafraga@gmail.con');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister ? { email, password, fullName } : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error en la solicitud');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a] text-slate-100">
      <div className="w-full max-w-md glass-card p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 mb-4 border border-purple-500/30">
            <span className="text-3xl font-bold">🏠</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">HogarIQ</h1>
          <p className="text-sm text-slate-400">
            {isRegister ? 'Crea la cuenta para tu hogar' : 'Asistente Financiero Inteligente'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Angela Fraga"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 glow-button font-bold text-white rounded-xl cursor-pointer disabled:opacity-50 mt-6"
          >
            {loading ? 'Procesando...' : isRegister ? 'Crear Cuenta e Iniciar' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isRegister ? (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => setIsRegister(false)} className="text-purple-400 font-semibold hover:underline cursor-pointer">
                Inicia Sesión
              </button>
            </p>
          ) : (
            <p>
              ¿No tienes cuenta?{' '}
              <button onClick={() => setIsRegister(true)} className="text-purple-400 font-semibold hover:underline cursor-pointer">
                Regístrate aquí
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
