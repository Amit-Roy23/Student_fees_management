"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR, formatDateTime, formatPhone } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BellRing,
  MessageSquare,
  Search,
  CheckCircle2,
  Languages,
  Plus,
  Send,
  Clock,
} from "lucide-react";

export function RemindersListClient({
  logs,
  templates,
}: {
  logs: any[];
  templates: any[];
}) {
  const [search, setSearch] = React.useState("");

  const filteredLogs = React.useMemo(() => {
    return logs.filter((l) => {
      return (
        !search ||
        l.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        l.recipientPhone.includes(search) ||
        l.student.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
        `${l.student.firstName} ${l.student.lastName}`.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [logs, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parent Reminders & Notification Logs</h1>
          <p className="text-sm text-muted-foreground">
            Multi-lingual WhatsApp & SMS notification delivery history and template management.
          </p>
        </div>

        <Link href="/dues">
          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <Send className="h-4 w-4" />
            <span>Send New Reminders</span>
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="logs">Sent Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        {/* 1. Logs Tab */}
        <TabsContent value="logs" className="space-y-4 pt-2">
          <Card className="border shadow-xs">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reminder logs by student, parent name, or mobile..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Sent Timestamp</th>
                    <th className="py-2.5 px-3 text-left">Student & Admission</th>
                    <th className="py-2.5 px-3 text-left">Recipient Guardian</th>
                    <th className="py-2.5 px-3 text-left">Channel & Template</th>
                    <th className="py-2.5 px-3 text-left">Delivered Message</th>
                    <th className="py-2.5 px-3 text-right">Amount Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/30">
                        <td className="py-3 px-3 font-mono text-muted-foreground">
                          {formatDateTime(l.createdAt)}
                        </td>
                        <td className="py-3 px-3">
                          <Link
                            href={`/students/${l.studentId}`}
                            className="font-bold text-foreground hover:underline"
                          >
                            {l.student.firstName} {l.student.lastName}
                          </Link>
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            {l.student.admissionNo} ({l.student.class.name})
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-foreground">{l.recipientName}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {formatPhone(l.recipientPhone)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {l.channel}
                          </Badge>
                          <span className="block text-[10px] text-muted-foreground truncate max-w-[120px] mt-0.5">
                            {l.templateName || "Default Template"}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-sm text-foreground">
                          <p className="line-clamp-2 text-[11px] leading-relaxed bg-muted/20 p-1.5 rounded border border-border/50">
                            {l.messageContent}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                          {formatINR(l.amountDuePaise)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="success" className="text-[10px]">
                            {l.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No reminder logs match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 2. Templates Tab */}
        <TabsContent value="templates" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((t) => (
              <Card key={t.id} className="border shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={t.isDefault ? "default" : "outline"} className="text-[10px]">
                      {t.language === "BN" ? "🇮🇳 বাংলা (Bengali)" : t.language === "HI" ? "🇮🇳 हिंदी (Hindi)" : "🇬🇧 English"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {t.channel}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold mt-2">{t.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground italic bg-muted/20 p-3 mx-4 rounded border">
                  "{t.content}"
                </CardContent>
                <CardFooter className="pt-3 text-[10px] text-muted-foreground border-t mt-4 flex justify-between">
                  <span>Placeholders: {'{student}'}, {'{amount}'}, {'{due_date}'}</span>
                  {t.isDefault && <span className="font-bold text-primary">Default Template</span>}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
