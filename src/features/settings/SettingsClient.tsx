"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  School,
  Calendar,
  AlertTriangle,
  Receipt,
  Users,
  ShieldCheck,
  CheckCircle2,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export function SettingsClient({
  settings,
  sessions,
  users,
  userRole,
}: {
  settings: Record<string, string>;
  sessions: any[];
  users: any[];
  userRole: string;
}) {
  const [form, setForm] = React.useState({
    schoolName: settings.school_name || "Arohon Vidya Mandir",
    tagline: settings.school_tagline || "Excellence in Education Since 1994",
    address: settings.school_address || "Plot 14, Sector V, Salt Lake City, Kolkata - 700091",
    phone: settings.school_phone || "+91 33 2357 8900",
    email: settings.school_email || "accounts@arohonvidyamandir.edu.in",
    receiptPrefix: settings.receipt_prefix || "REC",
    receiptFooter: settings.receipt_footer_note || "This is a computer-generated fee receipt. Non-refundable.",
    graceDays: settings.fine_grace_days || "5",
    fineType: settings.fine_type || "FLAT_PER_DAY",
    fineRatePaise: String(Number(settings.fine_rate_paise || 2000) / 100),
    maxCapPaise: String(Number(settings.fine_max_cap_paise || 50000) / 100),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings updated successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings & Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Manage school master parameters, session dates, fine rules, and staff roles.
          </p>
        </div>

        <Badge variant={userRole === "ADMIN" ? "default" : "secondary"}>
          {userRole === "ADMIN" ? "Administrator Access" : "Read-Only Settings"}
        </Badge>
      </div>

      <Tabs defaultValue="school" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="school">School Profile</TabsTrigger>
          <TabsTrigger value="fines">Fine Rules</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="users">Staff Users</TabsTrigger>
        </TabsList>

        {/* 1. School Profile */}
        <TabsContent value="school" className="space-y-4 pt-2">
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <School className="h-5 w-5 text-blue-600" />
                <span>School Profile & Institutional Details</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Appears on all official fee receipts, student ledgers, and SMS templates.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">School Legal Name</label>
                    <Input
                      value={form.schoolName}
                      onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Tagline / Board Affiliation</label>
                    <Input
                      value={form.tagline}
                      onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-foreground">Campus Address</label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Phone Number</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Accounts Email</label>
                    <Input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t p-4 flex justify-end">
                <Button type="submit" disabled={userRole !== "ADMIN"} className="font-bold gap-1.5">
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* 2. Fine Rules */}
        <TabsContent value="fines" className="space-y-4 pt-2">
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Late Fine Calculation Rules</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Fine engine rules applied automatically to overdue monthly installments.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Grace Period (Days after Due Date)</label>
                    <Input
                      type="number"
                      value={form.graceDays}
                      onChange={(e) => setForm({ ...form, graceDays: e.target.value })}
                    />
                    <span className="text-[10px] text-muted-foreground">e.g. 5 days grace period</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Fine Calculation Type</label>
                    <Select
                      value={form.fineType}
                      onValueChange={(val) => setForm({ ...form, fineType: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLAT_PER_DAY">Flat Rate Per Day (₹)</SelectItem>
                        <SelectItem value="FLAT_ONE_TIME">Flat One-Time Charge (₹)</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage of Due Fee (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Rate (₹ Per Day / One-time)</label>
                    <Input
                      type="number"
                      value={form.fineRatePaise}
                      onChange={(e) => setForm({ ...form, fineRatePaise: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Maximum Fine Cap (₹)</label>
                    <Input
                      type="number"
                      value={form.maxCapPaise}
                      onChange={(e) => setForm({ ...form, maxCapPaise: e.target.value })}
                    />
                    <span className="text-[10px] text-muted-foreground">Max limit a student fine can reach</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t p-4 flex justify-end">
                <Button type="submit" disabled={userRole !== "ADMIN"} className="font-bold gap-1.5">
                  <Save className="h-4 w-4" />
                  <span>Update Fine Rules</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* 3. Receipts */}
        <TabsContent value="receipts" className="space-y-4 pt-2">
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <span>Receipt Numbering & Layout</span>
              </CardTitle>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Receipt Number Prefix</label>
                    <Input
                      value={form.receiptPrefix}
                      onChange={(e) => setForm({ ...form, receiptPrefix: e.target.value })}
                    />
                    <span className="text-[10px] text-muted-foreground">Format: {form.receiptPrefix}-2026-0001</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Receipt Disclaimer / Terms Footer</label>
                    <Input
                      value={form.receiptFooter}
                      onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t p-4 flex justify-end">
                <Button type="submit" disabled={userRole !== "ADMIN"} className="font-bold gap-1.5">
                  <Save className="h-4 w-4" />
                  <span>Save Receipt Settings</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* 4. Staff Users */}
        <TabsContent value="users" className="space-y-4 pt-2">
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span>Authorized Demo Staff Users</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Role-based access control (Admin / MD, Accountant, Viewer).
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Staff Name</th>
                    <th className="py-2.5 px-4 text-left">Email / Username</th>
                    <th className="py-2.5 px-4 text-left">Role</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-bold text-foreground">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={u.role === "ADMIN" ? "default" : u.role === "ACCOUNTANT" ? "info" : "secondary"}
                          className="text-[10px]"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
