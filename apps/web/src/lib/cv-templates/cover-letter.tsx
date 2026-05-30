import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface CoverLetterTemplateData {
  // Sender
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  // Recipient
  hiringManagerName?: string;
  company: string;
  position: string;
  date?: string;
  // Content
  subject?: string;
  body: string;  // plain text with \n line breaks
  // Style
  style?: "modern" | "classic";
}

const C = {
  accent:  "#1a56db",
  dark:    "#111827",
  text:    "#374151",
  muted:   "#6b7280",
  border:  "#d1d5db",
  white:   "#ffffff",
};

const modernStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
    backgroundColor: C.white,
    padding: "0",
  },
  headerBar: {
    backgroundColor: C.accent,
    padding: "24 44 20 44",
  },
  headerName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white },
  headerContact: { flexDirection: "row", gap: 16, marginTop: 6, flexWrap: "wrap" },
  headerContactItem: { fontSize: 8, color: "#c7d9ff" },
  body: { padding: "28 44" },
  dateLine: { fontSize: 9, color: C.muted, marginBottom: 16 },
  recipient: { marginBottom: 20 },
  recipientName: { fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark },
  recipientSub: { fontSize: 9, color: C.muted },
  subject: { fontFamily: "Helvetica-Bold", fontSize: 10, color: C.accent, marginBottom: 14 },
  paragraph: { lineHeight: 1.7, marginBottom: 10, fontSize: 10 },
  signature: { marginTop: 24 },
  signatureClosing: { fontSize: 10, color: C.text, marginBottom: 20 },
  signatureName: { fontFamily: "Helvetica-Bold", fontSize: 11, color: C.dark },
  signatureContact: { fontSize: 9, color: C.muted, marginTop: 2 },
  accentLine: { height: 2, backgroundColor: C.accent, marginTop: 8 },
});

const classicStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
    backgroundColor: C.white,
    padding: "36 52",
  },
  header: { borderBottom: `2 solid ${C.dark}`, paddingBottom: 10, marginBottom: 20 },
  headerName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.dark, letterSpacing: 0.5 },
  headerContact: { flexDirection: "row", gap: 16, marginTop: 4, flexWrap: "wrap" },
  headerContactItem: { fontSize: 8, color: C.muted },
  dateLine: { fontSize: 9, color: C.muted, marginBottom: 16 },
  recipient: { marginBottom: 20 },
  recipientName: { fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark },
  recipientSub: { fontSize: 9, color: C.muted },
  subject: { fontFamily: "Helvetica-Bold", fontSize: 10, color: C.dark, textDecoration: "underline", marginBottom: 14 },
  paragraph: { lineHeight: 1.7, marginBottom: 10, fontSize: 10 },
  signature: { marginTop: 24 },
  signatureClosing: { fontSize: 10, color: C.text, marginBottom: 20 },
  signatureName: { fontFamily: "Helvetica-Bold", fontSize: 11, color: C.dark },
  signatureContact: { fontSize: 9, color: C.muted, marginTop: 2 },
});

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function CoverLetterPdf({ data }: { data: CoverLetterTemplateData }) {
  const paragraphs = splitParagraphs(data.body);
  const dateStr = data.date ?? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const style = data.style ?? "modern";

  if (style === "modern") {
    return (
      <Document>
        <Page size="A4" style={modernStyles.page}>
          {/* Coloured header bar */}
          <View style={modernStyles.headerBar}>
            <Text style={modernStyles.headerName}>{data.fullName}</Text>
            <View style={modernStyles.headerContact}>
              {data.email    && <Text style={modernStyles.headerContactItem}>{data.email}</Text>}
              {data.phone    && <Text style={modernStyles.headerContactItem}>{data.phone}</Text>}
              {data.location && <Text style={modernStyles.headerContactItem}>{data.location}</Text>}
              {data.linkedIn && <Text style={modernStyles.headerContactItem}>{data.linkedIn}</Text>}
            </View>
          </View>

          <View style={modernStyles.body}>
            <Text style={modernStyles.dateLine}>{dateStr}</Text>

            {/* Recipient */}
            <View style={modernStyles.recipient}>
              {data.hiringManagerName && (
                <Text style={modernStyles.recipientName}>{data.hiringManagerName}</Text>
              )}
              <Text style={modernStyles.recipientSub}>{data.company}</Text>
              <Text style={modernStyles.recipientSub}>Re: {data.position}</Text>
            </View>

            {/* Subject */}
            {data.subject && <Text style={modernStyles.subject}>{data.subject}</Text>}

            {/* Body paragraphs */}
            {paragraphs.map((p, i) => (
              <Text key={i} style={modernStyles.paragraph}>{p}</Text>
            ))}

            {/* Signature */}
            <View style={modernStyles.signature}>
              <Text style={modernStyles.signatureClosing}>Yours sincerely,</Text>
              <View style={modernStyles.accentLine} />
              <Text style={modernStyles.signatureName}>{data.fullName}</Text>
              {data.email && <Text style={modernStyles.signatureContact}>{data.email}</Text>}
              {data.phone && <Text style={modernStyles.signatureContact}>{data.phone}</Text>}
            </View>
          </View>
        </Page>
      </Document>
    );
  }

  // Classic style
  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        <View style={classicStyles.header}>
          <Text style={classicStyles.headerName}>{data.fullName}</Text>
          <View style={classicStyles.headerContact}>
            {data.email    && <Text style={classicStyles.headerContactItem}>{data.email}</Text>}
            {data.phone    && <Text style={classicStyles.headerContactItem}>{data.phone}</Text>}
            {data.location && <Text style={classicStyles.headerContactItem}>{data.location}</Text>}
            {data.linkedIn && <Text style={classicStyles.headerContactItem}>{data.linkedIn}</Text>}
          </View>
        </View>

        <Text style={classicStyles.dateLine}>{dateStr}</Text>

        <View style={classicStyles.recipient}>
          {data.hiringManagerName && (
            <Text style={classicStyles.recipientName}>{data.hiringManagerName}</Text>
          )}
          <Text style={classicStyles.recipientSub}>{data.company}</Text>
          <Text style={classicStyles.recipientSub}>Re: {data.position}</Text>
        </View>

        {data.subject && <Text style={classicStyles.subject}>{data.subject}</Text>}

        {paragraphs.map((p, i) => (
          <Text key={i} style={classicStyles.paragraph}>{p}</Text>
        ))}

        <View style={classicStyles.signature}>
          <Text style={classicStyles.signatureClosing}>Yours sincerely,</Text>
          <Text style={classicStyles.signatureName}>{data.fullName}</Text>
          {data.email && <Text style={classicStyles.signatureContact}>{data.email}</Text>}
          {data.phone && <Text style={classicStyles.signatureContact}>{data.phone}</Text>}
        </View>
      </Page>
    </Document>
  );
}
