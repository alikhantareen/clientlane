"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ClientData, ClientAction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Eye, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getStatusColor = (status: ClientData["status"]) => {
  switch (status) {
    case "invited":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatLastActive = (date: Date | string | null | undefined) => {
  if (!date) return "Never";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

interface ClientActionsProps {
  client: ClientData;
  onAction: (action: ClientAction, client: ClientData) => void;
}

const ClientActions: React.FC<ClientActionsProps> = ({ client, onAction }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer" onClick={() => onAction("resend-invite", client)}>
          <Send className="mr-2 h-4 w-4" />
          Resend Invite
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const createColumns = (
  onAction: (action: ClientAction, client: ClientData) => void
): ColumnDef<ClientData>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={client.image || ""} 
              alt={client.name}
            />
            <AvatarFallback>
              {client.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{client.name}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-gray-600">
          {row.original.email}
        </div>
      );
    },
  },
  {
    accessorKey: "portal_count",
    header: "Portals",
    cell: ({ row }) => {
      const count = row.original.portal_count;
      return (
        <div className="text-sm">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {count} {count === 1 ? "Portal" : "Portals"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge 
          variant="outline" 
          className={getStatusColor(status)}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "last_active",
    header: "Last Active",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="text-sm text-gray-600">
          {formatLastActive(client.last_active)}
        </div>
      );
    },
  },
  {
    accessorKey: "joined_on",
    header: "Joined On",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-gray-600">
          {formatDate(row.original.joined_on)}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return <ClientActions client={row.original} onAction={onAction} />;
    },
  },
]; 