import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-10 w-full" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </Button>

        <Button variant="ghost" size="sm">
          <User className="h-5 w-5" />
        </Button>

        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" alt="Maria Miller" />
            <AvatarFallback>MM</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium">Maria Miller</div>
            <div className="text-gray-500 text-xs">Customer</div>
          </div>
        </div>
      </div>
    </header>
  );
}
