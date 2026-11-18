import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Auth from "./components/Auth";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Customers from "./components/Customers";
import Products from "./components/Products";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/customers" />} />
          <Route path="customers" element={<Customers />} />
          <Route path="products" element={<Products />} />
        </Route>
        <Route path="*" element={<Navigate to="/customers" />} />
      </Routes>
    </BrowserRouter>
  );
}
