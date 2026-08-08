import { Home, School, Church, Package } from "lucide-react";

import { NavLink } from "react-router-dom";

const menu = [
  {
    name: "Inicio",
    path: "/",
    icon: Home,
  },
  {
    name: "Salas",
    path: "/salas",
    icon: School,
  },
  {
    name: "Iglesias",
    path: "/iglesias",
    icon: Church,
  },
  {
    name: "Inventario",
    path: "/inventario",
    icon: Package,
  },
];

export default function MobileNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden">
      <div className="grid grid-cols-4">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex flex-col items-center justify-center gap-1 py-3
                text-xs
                ${isActive ? "text-slate-900" : "text-slate-400"}
                `
              }
            >
              <Icon size={20} />

              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
