import { QRCodeSVG } from "qrcode.react";
import { normalizarColegio } from "../utils/colegios";

export default function QRPoster({ sala }) {
  const colegio = normalizarColegio(sala.colegio) || "Sin colegio asignado";
  const url = new URL("/salas/" + encodeURIComponent(sala.id), "https://iddp-andes.vercel.app").href;
  return (
    <article className="qr-poster" aria-label={"QR de " + sala.nombre + ", " + colegio}>
      <header className="qr-poster-brand">
        <span className="qr-poster-monogram">IDDP<span>LOS ANDES</span></span>
        <span className="qr-poster-event">CONVENCIÓN<br />DE JÓVENES</span>
      </header>
      <div className="qr-poster-heading">
        <p className="qr-poster-eyebrow">ALOJAMIENTO · IDENTIFICACIÓN DE SALA</p>
        <h2>{sala.nombre || "Sala sin nombre"}</h2>
        <p className="qr-poster-school">{colegio}</p>
      </div>
      <div className="qr-poster-code">
        <QRCodeSVG value={url} size={400} level="M" marginSize={4} title={"Abrir " + sala.nombre} />
      </div>
      <div className="qr-poster-instructions">
        <h3>Tu sala, a un escaneo.</h3>
        <p>Abre la cámara de tu celular y apunta al código<br />para consultar la información de esta sala.</p>
      </div>
      <footer className="qr-poster-footer"><span>BIENVENIDOS</span><span>IDDP · LOS ANDES</span></footer>
    </article>
  );
}
