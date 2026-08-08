import { supabase } from "../lib/supabase";

export const obtenerSalas = async () => {
  const { data, error } = await supabase
    .from("salas")
    .select("*")
    .eq("activo", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Error obteniendo salas:", error);
    throw error;
  }

  return data;
};
