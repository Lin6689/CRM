import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{user?.businessName || "Mini CRM"}</h1>
            <p className="text-xs text-gray-500">{user?.name} • {user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Logout
          </button>
        </div>
        <nav className="max-w-6xl mx-auto px-4 flex gap-4">
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `pb-2 text-sm font-medium border-b-2 ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`
            }
          >
            Customers
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `pb-2 text-sm font-medium border-b-2 ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`
            }
          >
            Products
          </NavLink>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
