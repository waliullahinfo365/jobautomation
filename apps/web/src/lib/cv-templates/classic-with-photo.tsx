import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { CvTemplateData } from "./types";

const C = {
  accent:  "#1f2d5c",
  text1:   "#111827",
  text2:   "#374151",
  text3:   "#6b7280",
  white:   "#ffffff",
  divider: "#d1d5db",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text2,
    backgroundColor: C.white,
    padding: "32 44",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, borderBottom: `2 solid ${C.accent}`, paddingBottom: 12 },
  headerLeft: { flex: 1 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.accent, letterSpacing: 0.5 },
  headline: { fontSize: 10, color: C.accent, marginTop: 2 },
  contactRow: { flexDirection: "row", gap: 12, marginTop: 6, flexWrap: "wrap" },
  contactItem: { fontSize: 8, color: C.text3 },

  photo: { width: 72, height: 72, borderRadius: 36, border: `2 solid ${C.accent}`, marginLeft: 16 },
  photoPlaceholder: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
    border: `2 solid ${C.accent}`,
  },
  photoPlaceholderText: { color: C.accent, fontSize: 7, textAlign: "center" },

  section: { marginBottom: 11 },
  sectionHeader: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    borderBottom: `0.5 solid ${C.divider}`,
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
  bulletDot: { color: C.accent, marginRight: 5 },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.45 },

  twoCol: { flexDirection: "row", gap: 20 },
  eduBlock: { marginBottom: 5 },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.text1 },
  eduSub: { fontSize: 8, color: C.text3 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillItem: { fontSize: 8.5, color: C.text2 },
  skillSep: { fontSize: 8.5, color: C.text3 },
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

export function ClassicWithPhotoCv({ data }: { data: CvTemplateData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{data.fullName}</Text>
            <Text style={styles.headline}>{data.headline}</Text>
            <View style={styles.contactRow}>
              {data.email    && <Text style={styles.contactItem}>{data.email}</Text>}
              {data.phone    && <Text style={styles.contactItem}>{data.phone}</Text>}
              {data.location && <Text style={styles.contactItem}>{data.location}</Text>}
              {data.linkedIn && <Text style={styles.contactItem}>{data.linkedIn}</Text>}
            </View>
          </View>
          {data.photoUrl ? (
            <Image src={data.photoUrl} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>PHOTO</Text>
            </View>
          )}
        </View>

        {data.summary && (
          <Section title="Profile">
            <Text style={styles.summary}>{data.summary}</Text>
          </Section>
        )}

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

        <View style={styles.twoCol}>
          {data.skills && data.skills.length > 0 && (
            <Section title="Skills">
              <View style={styles.skillsRow}>
                {data.skills.map((s, i) => (
                  <React.Fragment key={i}>
                    <Text style={styles.skillItem}>{s}</Text>
                    {i < data.skills!.length - 1 && <Text style={styles.skillSep}>·</Text>}
                  </React.Fragment>
                ))}
              </View>
            </Section>
          )}
          {data.languages && data.languages.length > 0 && (
            <Section title="Languages">
              {data.languages.map((l, i) => (
                <View key={i} style={styles.langRow}>
                  <Text style={styles.langName}>{l.name}</Text>
                  {l.level && <Text style={styles.langLevel}>{l.level}</Text>}
                </View>
              ))}
            </Section>
          )}
        </View>

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
      </Page>
    </Document>
  );
}
