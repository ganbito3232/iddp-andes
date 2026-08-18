import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthRedirect() {
  const [loading, setLoading] = useState(true);
  const [sesion, setSesion] = useState(null);

  useEffect(() => {
    let mounted = true;

    const revisarSesion = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSesion(session);
      setLoading(false);
    };

    revisarSesion();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

          <p className="mt-3 text-sm text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si está logueado → Dashboard
  if (sesion) {
    return <Navigate to="/" replace />;
  }

  // Si NO está logueado → Login
  return <Navigate to="/login" replace />;
}
