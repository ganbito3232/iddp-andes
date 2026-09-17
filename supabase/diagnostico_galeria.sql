-- Ejecutar en Supabase > SQL Editor. Solo consulta la configuración;
-- no modifica datos ni permisos. Compartir los resultados para preparar
-- una corrección que respete las restricciones actuales de cada sala.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('sala_fotos', 'salas')
order by tablename, policyname;

select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('sala_fotos', 'salas')
order by table_name, ordinal_position;
