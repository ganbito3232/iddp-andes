import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Check, CircleHelp, Info, X } from "lucide-react";
import { obtenerAviso, responderAviso, suscribirAvisos } from "../services/avisos";

const estilos = {
  error: { titulo: "No pudimos completar la acción", Icono: AlertCircle },
  success: { titulo: "¡Todo listo!", Icono: Check },
  warning: { titulo: "Revisa este detalle", Icono: Info },
  confirmacion: { titulo: "Antes de continuar", Icono: CircleHelp },
};

function Mensaje({ aviso }) {
  const dialogo = useRef(null);
  const { titulo, Icono } = estilos[aviso.tipo] || estilos.error;

  useEffect(() => {
    const elemento = dialogo.current;
    const focoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    elemento.showModal();
    elemento.querySelector(".aviso-secundario, .aviso-primario")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      elemento.close();
      if (focoAnterior?.isConnected) focoAnterior.focus();
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  const responder = (valor) => responderAviso(aviso.id, valor);
  return (
    <dialog
      ref={dialogo}
      className="aviso-dialogo"
      data-tipo={aviso.tipo}
      aria-labelledby="aviso-titulo"
      aria-describedby="aviso-mensaje"
      onCancel={(evento) => { evento.preventDefault(); responder(false); }}
    >
      <div className="aviso-contenido">
        <div className="aviso-cabecera">
          <div className="aviso-icono"><Icono size={27} strokeWidth={1.7} aria-hidden="true" /></div>
          <button type="button" className="aviso-cerrar" aria-label="Cerrar mensaje" onClick={() => responder(false)}><X size={20} /></button>
        </div>
        <p className="aviso-etiqueta">IDDP · LOS ANDES</p>
        <h2 id="aviso-titulo">{titulo}</h2>
        <p id="aviso-mensaje">{aviso.mensaje}</p>
      </div>
      <div className="aviso-acciones">
        {aviso.confirmacion && <button type="button" className="aviso-secundario" onClick={() => responder(false)}>Cancelar</button>}
        <button type="button" className="aviso-primario" onClick={() => responder(true)}>{aviso.confirmacion ? "Sí, continuar" : "Entendido"}</button>
      </div>
    </dialog>
  );
}

export default function Avisos() {
  const aviso = useSyncExternalStore(suscribirAvisos, obtenerAviso, () => null);
  return aviso ? createPortal(<Mensaje key={aviso.id} aviso={aviso} />, document.body) : null;
}
