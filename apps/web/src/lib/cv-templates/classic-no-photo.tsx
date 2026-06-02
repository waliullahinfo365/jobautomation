import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CvTemplateData } from "./types";

const C = {
  accent: "#1f2d5c",
  rule:   "#1f2d5c",
  text1:  "#111827",
  text2:  "#374151",
  text3:  "#6b7280",
  white:  "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text2,
    backgroundColor: C.white,
    padding: "32 44",
  },
  header: { marginBottom: 16, borderBottom: `2 solid ${C.rule}`, paddingBottom: 10 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.accent, letterSpacing: 0.5 },
  headline: { fontSize: 10, color: C.accent, marginTop: 2 },
  contactRow: { flexDirection: "row", gap: 14, marginTop: 6, flexWrap: "wrap" },
  contactItem: { fontSize: 8, color: C.text3 },

  section: { marginBottom: 12 },
  sectionHeader: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    borderBottom: `0.5 solid ${C.rule}`,
    paddingBottom: 2,
    marginBottom: 6,
  },
  summary: { fontSize: 9, lineHeight: 1.6, color: C.text2 },

  expBlock: { marginBottom: 7 },
  expHeader: { flexDirection: "row", justifyContent: "space-between" },
  expRole: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: C.text1 },
  expCompany: { fontSize: 8.5, color: C.accent, marginTop: 1 },
  expPeriod: { fontSize: 8, color: C.text3 },
  bullet: { flexDirection: "row", marginBottom: 2, marginTop: 1 },
  bulletDot: { color: C.accent, marginRight: 5, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.45, color: C.text2 },

  eduBlock: { marginBottom: 5 },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.text1 },
  eduSub: { fontSize: 8, color: C.text3 },

  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillItem: { fontSize: 8.5, color: C.text2 },
  skillSep: { fontSize: 8.5, color: C.text3 },

  twoCol: { flexDirection: "row", gap: 20 },
  twoColLeft: { flex: 1 },
  twoColRight: { flex: 1 },

  langRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  langName: { fontSize: 8.5, color: C.text1 },
  langLevel: { fontSize: 8, color: C.text3 },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title}</Text>
      {children}
    </View>
  );
}

export function ClassicNoPhotoCv({ data }: { data: CvTemplateData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.fullName}</Text>
          <Text style={styles.headline}>{data.headline}</Text>
          <View style={styles.contactRow}>
            {data.email    && <Text style={styles.contactItem}>{data.email}</Text>}
            {data.phone    && <Text style={styles.contactItem}>{data.phone}</Text>}
            {data.location && <Text style={styles.contactItem}>{data.location}</Text>}
            {data.linkedIn && <Text style={styles.contactItem}>{data.linkedIn}</Text>}
          </View>
        </View>

        {/* Summary */}
        {data.summary && (
          <Section title="Profile">
            <Text style={styles.summary}>{data.summary}</Text>
          </Section>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <Section title="Experience">
            {data.experience.map((exp, i) => (
              <View key={i} style={styles.expBlock}>
                <View style={styles.expHeader}>
                  <View>
                    <Text style={styles.expRole}>{exp.role}</Text>
                    <Text style={styles.expCompany}>{exp.company}</Text>
                  </View>
                  {exp.period && <Text style={styles.expPeriod}>{exp.period}</Text>}
                </View>
                {(exp.bullets ?? []).map((b, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>–</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </Section>
        )}

        {/* Skills + Languages in 2 columns */}
        <View style={styles.twoCol}>
          {data.skills && data.skills.length > 0 && (
            <View style={styles.twoColLeft}>
              <Section title="Key Skills">
                <View style={styles.skillsRow}>
                  {data.skills.map((s, i) => (
                    <React.Fragment key={i}>
                      <Text style={styles.skillItem}>{s}</Text>
                      {i < data.skills!.length - 1 && <Text style={styles.skillSep}>·</Text>}
                    </React.Fragment>
                  ))}
                </View>
              </Section>
            </View>
          )}

          {data.languages && data.languages.length > 0 && (
            <View style={styles.twoColRight}>
              <Section title="Languages">
                {data.languages.map((l, i) => (
                  <View key={i} style={styles.langRow}>
                    <Text style={styles.langName}>{l.name}</Text>
                    {l.level && <Text style={styles.langLevel}>{l.level}</Text>}
                  </View>
                ))}
              </Section>
            </View>
          )}
        </View>

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <Section title="Education">
            {data.education.map((edu, i) => (
              <View key={i} style={styles.eduBlock}>
                <Text style={styles.eduDegree}>{edu.degree}</Text>
                <Text style={styles.eduSub}>{edu.institution}{edu.year ? ` · ${edu.year}` : ""}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <Section title="Certifications">
            {data.certifications.map((c, i) => (
              <Text key={i} style={styles.bulletText}>• {c}</Text>
            ))}
          </Section>
        )}
      </Page>
    </Document>
  );
}
