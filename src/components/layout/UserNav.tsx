"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Badge } from "@/components/ui/badge";
import { LogOut, ShieldCheck, UserCheck, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function UserNav() {
  const { data: session } = useSession();
  const user = session?.user;

  const role = (user as any)?.role || "ADMIN";
  const name = user?.name || "Demo User";
  const email = user?.email || "admin@schoolpay.demo";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleQuickSwitch = async (targetEmail: string, pass: string, roleName: string) => {
    toast.loading(`Switching persona to ${roleName}...`);
    await signIn("credentials", {
      email: targetEmail,
      password: pass,
      redirect: false,
    });
    toast.dismiss();
    toast.success(`Logged in as ${roleName}`);
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-2.5 gap-2 border hover:bg-accent">
          <Avatar className="h-7 w-7">
            <AvatarImage src={(user as any)?.avatar || ""} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left text-xs">
            <span className="font-semibold max-w-[120px] truncate leading-tight">{name}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {role}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold leading-none">{name}</p>
              <Badge
                variant={role === "ADMIN" ? "default" : role === "ACCOUNTANT" ? "info" : "secondary"}
                className="text-[10px]"
              >
                {role}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Switch Demo Role</span>
          </div>
          <DropdownMenuItem
            onClick={() => handleQuickSwitch("admin@schoolpay.demo", "admin123", "Admin / MD")}
            className="cursor-pointer"
          >
            <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
            <span>Admin / MD</span>
            {role === "ADMIN" && <span className="ml-auto text-xs text-muted-foreground">●</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickSwitch("accountant@schoolpay.demo", "account123", "Accountant")}
            className="cursor-pointer"
          >
            <UserCheck className="mr-2 h-4 w-4 text-blue-500" />
            <span>Accountant</span>
            {role === "ACCOUNTANT" && <span className="ml-auto text-xs text-muted-foreground">●</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickSwitch("viewer@schoolpay.demo", "viewer123", "Auditor (Viewer)")}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4 text-slate-500" />
            <span>Viewer / Auditor</span>
            {role === "VIEWER" && <span className="ml-auto text-xs text-muted-foreground">●</span>}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
