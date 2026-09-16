import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            LOGIN
        ===================================================== */}

        <Route path="/login" element={<Login />} />

        {/* =====================================================
            APLICACIÓN PROTEGIDA
        ===================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* DASHBOARD */}

          <Route path="/" element={<Dashboard />} />

          {/* IGLESIAS */}

          <Route path="/iglesias" element={<Iglesias />} />

          <Route path="/iglesias/nueva" element={<NuevaIglesia />} />

          <Route path="/iglesias/:id" element={<DetalleIglesia />} />

          <Route path="/iglesias/:id/editar" element={<EditarIglesia />} />

          {/* SALAS */}

          <Route path="/salas" element={<Salas />} />
          <Route path="/salas/qr" element={<QRSala />} />

          <Route path="/salas/nueva" element={<NuevaSala />} />

          <Route path="/salas/:id" element={<DetalleSala />} />

          <Route path="/salas/:id/editar" element={<EditarSala />} />

          <Route path="/salas/:id/qr" element={<QRSala />} />

          <Route path="/salas/:id/galeria" element={<GaleriaSala />} />

          {/* INVENTARIO */}

          <Route path="/inventario" element={<Inventario />} />
        </Route>

        {/* =====================================================
            CUALQUIER RUTA QUE NO EXISTA
        ===================================================== */}

        <Route path="*" element={<AuthRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
