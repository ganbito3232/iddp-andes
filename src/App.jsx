import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import DetalleSala from "./pages/DetalleSala";
import Dashboard from "./pages/Dashboard";
import Salas from "./pages/Salas";
import NuevaSala from "./pages/NuevaSala";
import EditarSala from "./pages/EditarSala";
import QRSala from "./pages/QRSala";
import Iglesias from "./pages/Iglesias";
import NuevaIglesia from "./pages/NuevaIglesia";
import EditarIglesia from "./pages/EditarIglesia";
import DetalleIglesia from "./pages/DetalleIglesia";
import Inventario from "./pages/Inventario";
import GaleriaSala from "./pages/GaleriaSala";

function Placeholder({ title }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/iglesias" element={<Iglesias />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/iglesias/nueva" element={<NuevaIglesia />} />

          <Route path="/iglesias/:id/editar" element={<EditarIglesia />} />
          <Route path="/salas/:id/galeria" element={<GaleriaSala />} />
          <Route path="/iglesias/:id" element={<DetalleIglesia />} />
          <Route path="/salas" element={<Salas />} />
          <Route path="/salas/:id/qr" element={<QRSala />} />
          <Route path="/salas/nueva" element={<NuevaSala />} />
          <Route path="/salas/:id" element={<DetalleSala />} />
          <Route path="/iglesias" element={<Placeholder title="Iglesias" />} />
          <Route path="/salas/:id/editar" element={<EditarSala />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
