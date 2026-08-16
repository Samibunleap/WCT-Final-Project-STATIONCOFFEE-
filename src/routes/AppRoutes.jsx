import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Home from "../pages/Home";
import About from "../pages/About";
import Menu from "../pages/Menu";
import Cart from "../pages/Cart";
import Contact from "../pages/Contact";
import Location from "../pages/Location";
import Register from "../pages/Register";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import Dashboard from "../pages/Dashboard";

import AdminDashboard from "../pages/admin/AdminDashboard";

import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/about"
        element={<About />}
      />

      <Route
        path="/menu"
        element={<Menu />}
      />

      <Route
        path="/contact"
        element={<Contact />}
      />

      <Route
        path="/location"
        element={<Location />}
      />

      {/* Authentication pages */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* Customer-only cart */}
      <Route
        path="/cart"
        element={
          <ProtectedRoute
            allowedRoles={["customer"]}
          >
            <Cart />
          </ProtectedRoute>
        }
      />

      {/* Customer-only dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["customer"]}
          >
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin-only dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute
            allowedRoles={["admin"]}
          >
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Unknown URL redirects to Home */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}