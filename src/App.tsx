import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@store/authStore";
import AppLayout from "@components/layout/AppLayout";
import Login from "@pages/Login";
import Dashboard from "@pages/Dashboard";
import Personnel from "@pages/Personnel";
import Organisation from "@pages/Organisation";
import Contrats from "@pages/Contrats";
import Conges from "@pages/Conges";
import Medical from "@pages/Medical";
import Discipline from "@pages/Discipline";
import Formation from "@pages/Formation";
import Accidents from "@pages/Accidents";
import Rapports from "@pages/Rapports";
import Notifications from "@pages/Notifications";
import Administration from "@pages/Administration";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="personnel" element={<Personnel />} />
          <Route path="organisation" element={<Organisation />} />
          <Route path="contrats" element={<Contrats />} />
          <Route path="conges" element={<Conges />} />
          <Route path="medical" element={<Medical />} />
          <Route path="discipline" element={<Discipline />} />
          <Route path="formation" element={<Formation />} />
          <Route path="accidents" element={<Accidents />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="administration" element={<Administration />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
