import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { SCHOOL_NAME, SESSION_CODE, SCHOOL_CONFIG } from "@/lib/config";
import { formatINR, amountInWordsINR, formatDate, formatDateTime } from "@/lib/formatters";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  schoolAddress: {
    fontSize: 8,
    color: "#64748b",
  },
  receiptBadge: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 4,
  },
  receiptMeta: {
    fontSize: 8,
    color: "#475569",
    textAlign: "right",
  },
  infoGrid: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    color: "#64748b",
    width: 75,
  },
  infoValue: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  table: {
    width: "100%",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontWeight: "bold",
    fontSize: 8,
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8,
  },
  colIdx: { width: "8%" },
  colDesc: { width: "42%" },
  colAmount: { width: "16%", textAlign: "right" },
  colFine: { width: "16%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right", fontWeight: "bold" },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontWeight: "bold",
  },
  wordsBox: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    paddingVertical: 4,
    marginBottom: 8,
    fontSize: 8,
  },
  paymentSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    paddingVertical: 4,
  },
  statusBadge: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerNote: {
    fontSize: 7,
    color: "#94a3b8",
    width: "60%",
    fontStyle: "italic",
  },
  signatureBlock: {
    textAlign: "center",
    width: "30%",
  },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#64748b",
    height: 20,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#334155",
    textTransform: "uppercase",
  },
});

export interface ReceiptPDFProps {
  receiptNo: string;
  paymentDate: Date | string;
  amountPaise: number;
  mode: string;
  method?: string | null;
  txnRef?: string | null;
  remarks?: string | null;
  student: {
    admissionNo: string;
    name: string;
    class: { name: string };
    guardianName: string;
    guardianPhone: string;
  };
  collectedBy?: { name: string } | null;
  allocations: {
    amountPaise: number;
    finePaidPaise: number;
    installment: {
      title: string;
      monthName: string;
    };
  }[];
}

export function ReceiptDocument({ data }: { data: ReceiptPDFProps }) {
  const totalFinePaise = data.allocations.reduce((sum, a) => sum + a.finePaidPaise, 0);

  return (
    <Document title={`Fee-Receipt-${data.receiptNo}`} author={SCHOOL_NAME}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: "60%" }}>
            <Text style={styles.schoolName}>{SCHOOL_NAME}</Text>
            <Text style={styles.schoolAddress}>{SCHOOL_CONFIG.address}</Text>
            <Text style={styles.schoolAddress}>Ph: {SCHOOL_CONFIG.phone} • {SCHOOL_CONFIG.affiliation}</Text>
          </View>
          <View style={{ width: "38%", alignItems: "flex-end" }}>
            <Text style={styles.receiptBadge}>FEE RECEIPT (PAID)</Text>
            <Text style={styles.receiptMeta}>Receipt No: {data.receiptNo}</Text>
            <Text style={styles.receiptMeta}>Date: {formatDateTime(data.paymentDate)}</Text>
            <Text style={styles.receiptMeta}>Session: {SESSION_CODE}</Text>
          </View>
        </View>

        {/* Student & Guardian Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student Name:</Text>
              <Text style={styles.infoValue}>{data.student.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Admission No:</Text>
              <Text style={styles.infoValue}>{data.student.admissionNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Class:</Text>
              <Text style={styles.infoValue}>{data.student.class.name}</Text>
            </View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Guardian Name:</Text>
              <Text style={styles.infoValue}>{data.student.guardianName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Guardian Phone:</Text>
              <Text style={styles.infoValue}>{data.student.guardianPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Status:</Text>
              <Text style={styles.statusBadge}>PAID (SUCCESSFUL)</Text>
            </View>
          </View>
        </View>

        {/* Table of Breakdown */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colIdx}>#</Text>
            <Text style={styles.colDesc}>Particulars</Text>
            <Text style={styles.colAmount}>Fee (Rs.)</Text>
            <Text style={styles.colFine}>Late Fine (Rs.)</Text>
            <Text style={styles.colTotal}>Total (Rs.)</Text>
          </View>

          {data.allocations.length > 0 ? (
            data.allocations.map((alloc, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colIdx}>{idx + 1}</Text>
                <Text style={styles.colDesc}>
                  {alloc.installment.title || `${alloc.installment.monthName} Installment`}
                </Text>
                <Text style={styles.colAmount}>{formatINR(alloc.amountPaise).replace("₹", "")}</Text>
                <Text style={styles.colFine}>
                  {alloc.finePaidPaise > 0 ? formatINR(alloc.finePaidPaise).replace("₹", "") : "-"}
                </Text>
                <Text style={styles.colTotal}>
                  {formatINR(alloc.amountPaise + alloc.finePaidPaise).replace("₹", "")}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.colIdx}>1</Text>
              <Text style={styles.colDesc}>School Fee Payment ({data.remarks || "General Fee"})</Text>
              <Text style={styles.colAmount}>{formatINR(data.amountPaise).replace("₹", "")}</Text>
              <Text style={styles.colFine}>-</Text>
              <Text style={styles.colTotal}>{formatINR(data.amountPaise).replace("₹", "")}</Text>
            </View>
          )}

          {/* Table Footer */}
          <View style={styles.totalRow}>
            <Text style={{ width: "66%", textAlign: "right", paddingRight: 8 }}>GRAND TOTAL PAID:</Text>
            <Text style={styles.colFine}>{totalFinePaise > 0 ? formatINR(totalFinePaise).replace("₹", "") : "-"}</Text>
            <Text style={{ width: "18%", textAlign: "right", color: "#1e3a8a", fontSize: 10 }}>
              {formatINR(data.amountPaise)}
            </Text>
          </View>
        </View>

        {/* Amount in words */}
        <View style={styles.wordsBox}>
          <Text>
            <Text style={{ color: "#64748b" }}>Amount in Words: </Text>
            <Text style={{ fontWeight: "bold", fontStyle: "italic" }}>
              {amountInWordsINR(data.amountPaise)}
            </Text>
          </Text>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentSummary}>
          <View>
            <Text>
              <Text style={{ color: "#64748b" }}>Payment Method: </Text>
              <Text style={{ fontWeight: "bold" }}>{data.method || data.mode}</Text>
              {data.txnRef ? <Text style={{ color: "#475569" }}> (Ref: {data.txnRef})</Text> : null}
            </Text>
          </View>
          <View>
            <Text>
              <Text style={{ color: "#64748b" }}>Processed By: </Text>
              <Text style={{ fontWeight: "bold" }}>
                {data.collectedBy?.name || "Online Payment Gateway (Razorpay)"}
              </Text>
            </Text>
          </View>
        </View>

        {/* Footer & Signatures */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            * This is a computer-generated digital receipt and requires no physical signature.
            Fees once deposited are non-refundable. Please keep this receipt for future reference.
          </Text>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
