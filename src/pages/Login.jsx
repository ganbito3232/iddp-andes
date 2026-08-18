import { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn } from "lucide-react";

import { Navigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [ingresando, setIngresando] = useState(false);

  const [sesion, setSesion] = useState(null);
  const [error, setError] = useState("");

  // =====================================================
  // COMPROBAR SESIÓN
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const revisarSesion = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSesion(session);
      } catch (error) {
        console.error("Error comprobando sesión:", error);
      } finally {
        if (mounted) {
          setCargando(false);
        }
      }
    };

    revisarSesion();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  const ingresar = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Ingresa tu usuario.");
      return;
    }

    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    try {
      setIngresando(true);

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        console.error("Error login:", loginError);

        setError("Usuario o contraseña incorrectos.");
        return;
      }

      if (!data?.session) {
        setError("No fue posible iniciar la sesión.");
        return;
      }

      /*
       * IMPORTANTE:
       *
       * No usamos navigate("/") porque queremos evitar
       * que /login quede como página anterior del historial.
       *
       * Reemplazamos directamente la URL.
       */

      window.location.replace("/");
    } catch (error) {
      console.error("Error inesperado al iniciar sesión:", error);

      setError("No fue posible iniciar sesión.");
    } finally {
      setIngresando(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

          <p className="mt-3 text-sm text-slate-500">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // SI YA ESTÁ LOGUEADO
  // =====================================================

  if (sesion) {
    return <Navigate to="/" replace />;
  }

  // =====================================================
  // LOGIN
  // =====================================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* =================================================
            ENCABEZADO
        ================================================= */}

        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <LockKeyhole size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            IDDP Los Andes
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Catastro y administración de salas
          </p>
        </div>

        {/* =================================================
            CARD LOGIN
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Iniciar sesión
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ingresa tus datos para continuar.
            </p>
          </div>

          <form onSubmit={ingresar} className="space-y-5">
            {/* =================================================
                USUARIO
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Usuario
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="admin@iddplosandes.cl"
                autoComplete="username"
                disabled={ingresando}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* =================================================
                CONTRASEÑA
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Contraseña
              </label>

              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={ingresando}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() => setMostrarPassword((prev) => !prev)}
                  disabled={ingresando}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                  aria-label={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {mostrarPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* =================================================
                BOTÓN
            ================================================= */}

            <button
              type="submit"
              disabled={ingresando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogIn size={18} />

              {ingresando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <p className="mt-6 text-center text-xs text-slate-400">
          Sistema de administración · IDDP Los Andes
        </p>
      </div>
    </div>
  );
}
