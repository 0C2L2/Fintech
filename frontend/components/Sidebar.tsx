import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  LayoutDashboard, 
  Receipt, 
  Tags, 
  LineChart, 
  FileDown, 
  ShieldAlert,
  Banknote,
  Database,
  FlaskConical
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const links = user?.role === "admin"
    ? [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "R Plots", href: "/admin/plots", icon: FlaskConical },
        { name: "Admin Panel", href: "/admin", icon: ShieldAlert },
        { name: "Database Explorer", href: "/admin/database", icon: Database },
      ]
    : [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Income", href: "/income", icon: Banknote },
        { name: "Expenses", href: "/expenses", icon: Receipt },
        { name: "Categories", href: "/categories", icon: Tags },
        { name: "Analysis", href: "/analysis", icon: LineChart },
        { name: "Reports", href: "/reports", icon: FileDown },
      ];

  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col border-r bg-white h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center text-blue-600">
          <BarChart3 className="h-6 w-6 mr-2" />
          <span className="font-bold text-xl tracking-tight">FinHealth</span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <link.icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
