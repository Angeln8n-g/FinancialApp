'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  FileText,
  EyeOff,
  UserCheck,
  Server,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Sparkles,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Header Superior */}
      <header className="border-b border-[#1E2B4D] bg-[#0A1128]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href={token ? '/dashboard' : '/login'} className="flex items-center gap-2">
            <Logo size="md" showText={true} />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={token ? '/dashboard' : '/login'}
              className="px-3.5 py-1.5 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 hover:text-white border border-[#1E2B4D] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{token ? 'Volver al Dashboard' : 'Iniciar Sesión'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
        {/* Banner de Presentación */}
        <div className="text-center space-y-3 pb-6 border-b border-[#1E2B4D]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Soberanía de Datos & Privacidad Garantizada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Políticas de Privacidad y Protección de Datos
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            En <strong>HogarIQ</strong>, la gestión financiera familiar se rige por un principio absoluto: tus datos financieros te pertenecen exclusivamente a ti y a tu familia.
          </p>
          <div className="text-[11px] text-slate-500 font-medium">
            Última actualización: Noviembre 2026 • Vigencia para versión 2.0 y posteriores
          </div>
        </div>

        {/* Resumen de Principios Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="mint-card p-4 space-y-2 border border-[#1E2B4D]">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-100">Cero Comercialización</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              No vendemos, no monetizamos ni compartimos tus números o compras con anunciantes ni burós de crédito.
            </p>
          </div>

          <div className="mint-card p-4 space-y-2 border border-[#1E2B4D]">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-100">Cifrado de Alto Nivel</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Contraseñas protegidas mediante algoritmos criptográficos seguros (PBKDF2/SHA-512) y tráfico cifrado TLS.
            </p>
          </div>

          <div className="mint-card p-4 space-y-2 border border-[#1E2B4D]">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-100">Derecho al Olvido</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Puedes darte de baja en 1 clic y purgar tu cuenta y registros financieros definitivamente sin obstáculos.
            </p>
          </div>
        </div>

        {/* Secciones Legales y Operativas */}
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Sección 1 */}
          <section className="mint-card p-6 space-y-3 border border-[#1E2B4D]">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#162347] border border-[#1E2B4D] flex items-center justify-center text-emerald-400 text-xs">
                1
              </span>
              Compromiso y Filosofía "Family-First"
            </h2>
            <p>
              HogarIQ fue diseñada desde cero para transformar la administración del hogar sin poner en riesgo la intimidad de las familias. Nos comprometemos a que el usuario mantenga soberanía total sobre su información patrimonial, presupuestaria y de consumo. Ningún algoritmo de terceros rastrea la actividad de tu hogar con fines comerciales.
            </p>
          </section>

          {/* Sección 2 */}
          <section className="mint-card p-6 space-y-3 border border-[#1E2B4D]">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#162347] border border-[#1E2B4D] flex items-center justify-center text-emerald-400 text-xs">
                2
              </span>
              Información que Tratamos y Finalidad
            </h2>
            <p>Tratamos exclusivamente la información necesaria para el funcionamiento contable de tu hogar:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong>Datos de Identidad y Autenticación:</strong> Correo electrónico, nombre completo o alias y contraseña cifrada unidireccionalmente.
              </li>
              <li>
                <strong>Registros Financieros Familiares:</strong> Cuentas bancarias, saldos, categorías, gastos, ingresos, transferencias, metas de ahorro, presupuestos periódicos y deudas/tarjetas de crédito registradas por los integrantes.
              </li>
              <li>
                <strong>Comprobantes y Facturas (OCR):</strong> Fotografías de recibos escaneados para lectura óptica. Los datos extraídos (total, fecha, concepto) se almacenan en tus transacciones; la imagen no se vende ni se comparte.
              </li>
              <li>
                <strong>Auditoría Interna Familiar:</strong> Registro interno de ediciones y anulaciones de movimientos para que los miembros del hogar mantengan total transparencia mutua.
              </li>
            </ul>
          </section>

          {/* Sección 3 */}
          <section className="mint-card p-6 space-y-3 border border-[#1E2B4D]">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#162347] border border-[#1E2B4D] flex items-center justify-center text-emerald-400 text-xs">
                3
              </span>
              Inteligencia Artificial Privada
            </h2>
            <p>
              Los servicios de inteligencia artificial incorporados en HogarIQ (como el asistente por Telegram, categorización automática y lectura de recibos) operan bajo entornos dedicados y efímeros. Ningún dato sensible de tu familia se comparte con plataformas de entrenamiento públicas ni se utiliza para retroalimentar modelos colectivos de IA.
            </p>
          </section>

          {/* Sección 4 */}
          <section className="mint-card p-6 space-y-3 border border-[#1E2B4D]">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#162347] border border-[#1E2B4D] flex items-center justify-center text-emerald-400 text-xs">
                4
              </span>
              Tus Derechos: Portabilidad y Descarga de Datos (GDPR / ARCO)
            </h2>
            <p>
              Tienes el derecho inalienable de acceder y solicitar una copia completa de tu información financiera en cualquier momento. A través de la opción <strong>"Descargar Copia de mis Datos"</strong> en el panel de usuario, puedes obtener un archivo estructurado en formato universal JSON que incluye todos tus movimientos, cuentas y presupuestos para tu custodia personal.
            </p>
          </section>

          {/* Sección 5: Procedimiento de Darse de Baja */}
          <section className="mint-card p-6 space-y-4 border border-rose-500/30 bg-gradient-to-br from-[#101A36] to-rose-950/15">
            <div className="flex items-center gap-2 text-rose-300">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <h2 className="text-sm font-bold text-slate-100">
                5. Procedimiento para Darse de Baja y Eliminar tus Datos Definitivamente
              </h2>
            </div>
            <p className="text-slate-200">
              Cumpliendo con los más altos estándares de protección de datos personales y el <strong>Derecho al Olvido</strong>, cualquier usuario puede solicitar la baja voluntaria y la supresión completa de sus datos sin necesidad de trámites complejos ni justificaciones:
            </p>

            <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-2 text-[11px]">
              <p className="font-semibold text-slate-200">¿Cómo darte de baja desde la aplicación?</p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                <li>Inicia sesión con tu cuenta de HogarIQ.</li>
                <li>Haz clic en tu nombre o perfil en la barra superior de navegación.</li>
                <li>Desplázate a la sección <strong>"Zona de Peligro / Darse de Baja"</strong>.</li>
                <li>Presiona el botón <strong>"Eliminar mi Cuenta y Datos Definitivamente"</strong>.</li>
                <li>Ingresa tu contraseña actual como medida de confirmación y seguridad.</li>
              </ol>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p>
                <strong>¿Qué sucede cuando confirmas la eliminación?</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Tu usuario, correo electrónico, contraseñas, tokens y sesiones se eliminan irreversiblemente de la base de datos de inmediato.
                </li>
                <li>
                  Si eres el único miembro de tu hogar, el hogar y todos sus registros (cuentas bancarias, tarjetas, deudas, transacciones, presupuestos, suscripciones y recordatorios) se destruyen en cascada de forma definitiva.
                </li>
                <li>
                  Si el hogar cuenta con otros miembros de la familia registrados, se retirará tu membresía y tus datos personales sin interrumpir la operación financiera de los demás integrantes.
                </li>
              </ul>
            </div>
          </section>

          {/* Sección 6 */}
          <section className="mint-card p-6 space-y-3 border border-[#1E2B4D]">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#162347] border border-[#1E2B4D] flex items-center justify-center text-emerald-400 text-xs">
                6
              </span>
              Canal de Dudas y Privacidad
            </h2>
            <p>
              Si tienes preguntas respecto a nuestras políticas, la gestión de tu información o deseas asistencia sobre el tratamiento de tus datos personales, puedes contactarnos en cualquier momento a través del canal oficial de soporte:
            </p>
            <div className="p-3 rounded-xl bg-[#0A1128] border border-[#1E2B4D] inline-flex items-center gap-2 text-slate-200 text-xs">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>privacidad@hogariq.com</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 pb-12 border-t border-[#1E2B4D] text-xs text-slate-500 space-y-2">
          <p>© {new Date().getFullYear()} HogarIQ. Todos los derechos reservados.</p>
          <div className="flex justify-center items-center gap-4 text-emerald-400">
            <Link href={token ? '/dashboard' : '/login'} className="hover:underline">
              {token ? 'Ir al Dashboard' : 'Iniciar Sesión'}
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline font-semibold">
              Políticas de Privacidad
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
