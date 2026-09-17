-- Ejecutar en Supabase > SQL Editor.
-- Las políticas existentes autorizaban únicamente al rol anon.
-- La aplicación requiere sesión: permitir las escrituras a authenticated.
-- Conserva RLS y las políticas de lectura existentes.
begin;

alter policy "Agregar fotos salas"
on public.sala_fotos
to authenticated
with check (true);

alter policy "Eliminar fotos salas"
on public.sala_fotos
to authenticated
using (true);

commit;

-- Verificar que INSERT y DELETE muestran {authenticated}.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'sala_fotos'
order by policyname;
