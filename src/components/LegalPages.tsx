import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { 
  ShieldCheck, 
  FileText, 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Globe, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface LegalProps {
  lang: Language;
  onNavigate: (route: string) => void;
}

export const PrivacyPage: React.FC<LegalProps> = ({ lang, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {getTranslation(lang, 'privacy')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Última actualización: Marzo de 2026</p>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-6">
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
          <h3 className="font-bold text-base mb-1">
            {lang === 'es' ? 'Principio Fundamental: Procesamiento en el Cliente' : 'Core Principle: Client-Side Processing'}
          </h3>
          <p className="text-xs leading-relaxed">
            {lang === 'es'
              ? 'En ToolBox World priorizamos la privacidad absoluta. Las herramientas de PDF, optimización de imágenes, códigos QR, textos y conversiones se ejecutan directamente en tu navegador web. Tus archivos nunca se envían a nuestros servidores.'
              : 'At ToolBox World we prioritize total privacy. PDF processing, image optimization, QR generation, text analysis, and conversions run directly in your browser. Your files are never transmitted to our servers.'}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Datos que no recopilamos</h2>
          <p>
            No solicitamos registro obligatorio para utilizar nuestras herramientas. No almacenamos copias de tus documentos PDF, imágenes o contraseñas generadas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Publicidad y Google AdSense</h2>
          <p>
            Para mantener esta plataforma abierta y gratuita para todo el mundo, utilizamos servicios publicitarios de terceros, incluyendo Google AdSense. Estos proveedores pueden usar cookies para mostrar anuncios basados en visitas anteriores a este o a otros sitios web. Los usuarios pueden inhabilitar la publicidad personalizada a través de la Configuración de anuncios de Google o mediante nuestro panel de cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Cookies técnicas y analítica anónima</h2>
          <p>
            Utilizamos almacenamiento local (LocalStorage) exclusivamente para recordar tus preferencias de interfaz: selección de idioma (español, inglés, etc.) y modo de color (claro u oscuro).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Ejercicio de derechos RGPD / CCPA</h2>
          <p>
            Cualquier consulta sobre la gestión de datos puede ser dirigida a través de nuestro formulario de contacto oficial.
          </p>
        </section>
      </div>
    </div>
  );
};

export const TermsPage: React.FC<LegalProps> = ({ lang }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {getTranslation(lang, 'terms')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Vigentes a partir de Marzo de 2026</p>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Aceptación de los términos</h2>
          <p>
            Al acceder y utilizar ToolBox World, el usuario acepta de forma plena y sin reservas los presentes Términos y Condiciones de Uso. Si no está de acuerdo con alguno de ellos, debe abstenerse de utilizar el servicio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Uso legítimo</h2>
          <p>
            El usuario se compromete a no utilizar las herramientas digitales provistas para actividades ilícitas, fraudulentas, difamatorias o que atenten contra los derechos de propiedad intelectual de terceros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Exclusión de garantías</h2>
          <p>
            ToolBox World proporciona sus herramientas "tal cual" y "según disponibilidad". Aunque nos esforzamos por garantizar la máxima precisión y rendimiento, no nos hacemos responsables de posibles pérdidas de datos o incompatibilidades resultantes del uso de las utilidades.
          </p>
        </section>
      </div>
    </div>
  );
};

export const CookiesPage: React.FC<LegalProps> = ({ lang }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
        {getTranslation(lang, 'cookies')}
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
        En ToolBox World somos transparentes sobre el uso de tecnologías de rastreo y almacenamiento web.
      </p>

      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-base mb-1">Cookies técnicas necesarias</h3>
          <p className="text-xs text-slate-500">
            Imprescindibles para recordar si elegiste tema oscuro/claro y tu idioma preferido. No pueden ser desactivadas.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-base mb-1">Cookies publicitarias (Google AdSense)</h3>
          <p className="text-xs text-slate-500">
            Utilizadas por Google para servir anuncios relevantes y limitar la frecuencia de repetición. Puedes gestionarlas con el botón inferior.
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('toolbox_cookie_consent');
            window.location.reload();
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
        >
          {lang === 'es' ? 'Restablecer preferencias de cookies' : 'Reset cookie preferences'}
        </button>
      </div>
    </div>
  );
};

export const AboutPage: React.FC<LegalProps> = ({ lang }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
          {getTranslation(lang, 'about')}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          {lang === 'es'
            ? 'ToolBox World nace con una misión clara: devolver a internet herramientas digitales útiles, rápidas y verdaderamente respetuosas con la privacidad.'
            : 'ToolBox World was founded with a single mission: to bring back digital tools that are genuinely fast, useful, and privacy-respecting.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">100% Procesamiento Local</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Aprovechamos las capacidades modernas de tu navegador (WebAssembly, Canvas, WebCrypto) para procesar tus archivos en tu máquina.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Sin trucos ni engaños</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nunca colocamos botones falsos de descarga ni descargamos programas no solicitados. El botón de descarga entrega tu archivo real.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Global y Multilingüe</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Diseñado para personas de todo el mundo, estudiantes, autónomos, desarrolladores y pymes.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <h4 className="font-bold text-slate-900 dark:text-white mb-1">Declaración de Independencia</h4>
        <p>
          ToolBox World es una plataforma independiente de utilidades digitales. No estamos asociados, respaldados ni afiliados a Adobe Inc, Microsoft Corporation, Alphabet Inc (Google) u otras marcas registradas. Todas las marcas pertenecen a sus respectivos titulares.
        </p>
      </div>
    </div>
  );
};

export const ContactPage: React.FC<LegalProps> = ({ lang }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot spam field
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Silent bot drop

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(lang === 'es' ? 'Por favor completa todos los campos requeridos.' : 'Please fill in all fields.');
      return;
    }

    if (!email.includes('@')) {
      setError(lang === 'es' ? 'Introduce una dirección de correo válida.' : 'Please provide a valid email.');
      return;
    }

    setError(null);
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          {getTranslation(lang, 'contact')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {lang === 'es'
            ? '¿Tienes una sugerencia para una nueva herramienta o un reporte técnico? Escríbenos.'
            : 'Have a feature suggestion or found an issue? Send us a message.'}
        </p>
      </div>

      {submitted ? (
        <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {lang === 'es' ? '¡Mensaje recibido!' : 'Message Received!'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {lang === 'es'
              ? 'Gracias por contactarnos. Revisamos cada mensaje para seguir mejorando ToolBox World.'
              : 'Thank you for reaching out. We review every message to keep improving ToolBox World.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Hidden honeypot for anti-spam */}
          <div className="hidden" aria-hidden="true">
            <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'es' ? 'Tu nombre:' : 'Your Name:'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'es' ? 'Correo electrónico:' : 'Email Address:'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'es' ? 'Motivo del contacto:' : 'Subject:'}
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="suggestion">{lang === 'es' ? 'Sugerencia de nueva herramienta' : 'New tool suggestion'}</option>
              <option value="bug">{lang === 'es' ? 'Reporte de error técnico' : 'Bug report'}</option>
              <option value="partnership">{lang === 'es' ? 'Colaboración o propuesta' : 'Partnership inquiry'}</option>
              <option value="privacy">{lang === 'es' ? 'Privacidad o datos' : 'Privacy inquiry'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'es' ? 'Mensaje:' : 'Message:'}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={lang === 'es' ? 'Escribe aquí los detalles...' : 'Tell us what you have in mind...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{lang === 'es' ? 'Enviar mensaje' : 'Send Message'}</span>
          </button>
        </form>
      )}
    </div>
  );
};

export const DisclaimerPage: React.FC<LegalProps> = ({ lang }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
        {getTranslation(lang, 'disclaimer')}
      </h1>
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <p>
          Las marcas comerciales, logotipos, nombres de formatos o nombres de productos citados en ToolBox World (tales como Adobe, PDF, Word, Excel, JPG, PNG, Google, Apple) se mencionan exclusivamente con fines descriptivos para identificar la compatibilidad técnica de los archivos y formatos tratados.
        </p>
        <p>
          ToolBox World no reclama ninguna propiedad sobre dichas marcas, ni existe relación de patrocinio, afiliación comercial o asociación directa con sus propietarios legítimos.
        </p>
      </div>
    </div>
  );
};
