"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  BarChart3, 
  LayoutDashboard, 
  Receipt, 
  Tags, 
  LineChart, 
  FileDown, 
  ShieldAlert
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const links = user?.role === "admin"
    ? [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Admin Panel", href: "/admin", icon: ShieldAlert },
      ]
    : [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Expenses", href: "/expenses", icon: Receipt },
        { name: "Categories", href: "/categories", icon: Tags },
        { name: "Analysis", href: "/analysis", icon: LineChart },
        { name: "Reports", href: "/reports", icon: FileDown },
      ];

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b bg-white top-0 sticky z-30 w-full">
      <div className="flex items-center md:hidden">
        <Sheet>
          <SheetTrigger 
            render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            } 
          />
          <SheetContent side="left" className="w-64 p-0">
            <div className="h-16 flex items-center px-6 border-b">
              <Link href="/dashboard" className="flex items-center text-blue-600">
                <BarChart3 className="h-6 w-6 mr-2" />
                <span className="font-bold text-xl tracking-tight">FinHealth</span>
              </Link>
            </div>
            <nav className="py-6 px-4 space-y-1">
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
          </SheetContent>
        </Sheet>
        
        <Link href="/dashboard" className="flex items-center text-blue-600 ml-4">
          <BarChart3 className="h-6 w-6 mr-2" />
          <span className="font-bold text-lg tracking-tight">FinHealth</span>
        </Link>
      </div>

      <div className="ml-auto w-full max-w-sm px-4 md:px-0 md:max-w-none flex justify-end">
        {/* Placeholder for future search or filters if needed */}
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger 
              render={
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              } 
            />
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.full_name}</p>
                    <p className="text-xs leading-none text-slate-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
