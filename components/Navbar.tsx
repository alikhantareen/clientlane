"use client";
import { Bell, User, Menu } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/lib/contexts/UserContext";

interface NavbarProps {
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title?: string;
}

export default function Navbar({ setSidebarOpen, title = "Dashboard" }: NavbarProps) {
  const { user } = useUser();

  return (
    <header className="h-16 bg-black border-b border-gray-200 flex items-center px-6 justify-between lg:justify-end">
      <div className="flex items-center gap-2 md:gap-4 lg:hidden">
        <button
          className="p-2 rounded-md bg-black/80 text-white hover:bg-gray-800 focus:outline-none transition-colors md:block"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="md:inline text-2xl font-bold tracking-tight">Clientlane</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || "Profile"}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>
    </header>
  );
} 