import { cn } from "@/lib/utils";
import {
  Play,
  List,
  Lightbulb,
  Upload,
  Edit,
  Settings,
  LogOut,
  Moon,
  User,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Watch Videos", href: "/", icon: Play },
  { name: "My Lists", href: "/lists", icon: List },
  { name: "Recommendations", href: "/recommendations", icon: Lightbulb },
  { name: "Upload Videos", href: "/upload", icon: Upload },
  { name: "Edit Videos", href: "/edit", icon: Edit },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            </div>
          </div>
          <span className="font-semibold text-lg">IncluVid</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t space-y-4">
        <Link
          to="/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>

        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center space-x-3">
            <Moon className="h-5 w-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Dark Mode</span>
          </div>
          <Switch />
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="Martin Muller" />
            <AvatarFallback>MM</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium text-gray-900">Martin Muller</div>
            <div className="text-gray-500 text-xs">martin123@gmail.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
