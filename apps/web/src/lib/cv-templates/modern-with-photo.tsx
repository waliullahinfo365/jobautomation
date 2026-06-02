import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CvTemplateData } from "./types";

const C = {
  accent:  "#1a56db",
  sidebar: "#1a56db",
  text1:   "#111827",
  text2:   "#374151",
  text3:   "#6b7280",
  white:   "#ffffff",
  light:   "#e8edff",
  border:  "#c7d3f8",
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text2,
    backgroundColor: C.white,
  },
  sidebar: {
    width: "34%",
    backgroundColor: C.sidebar,
    padding: "24 14",
    gap: 16,
  },
  main: {
    flex: 1,
    padding: "28 20 28 18",
    gap: 14,
  },

  // Photo circle
  photoWrap: { alignItems: "center", marginBottom: 4 },
  photo: { width: 80, height: 80, borderRadius: 40, border: `3 solid ${C.light}` },
  photoPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.light,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: { color: C.accent, fontSize: 8, textAlign: "center" },

  nameBlock: { gap: 4, alignItems: "center" },
  name: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.white, textAlign: "center", lineHeight: 1.2 },
  headline: { fontSize: 8.5, color: C.light, textAlign: "center", fontFamily: "Helvetica-Bold" },

  sidebarSectionHeader: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.light,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
    borderBottom: `0.5 solid ${C.border}`,
    paddingBottom: 3,
  },
  sectionHeader: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
    borderBottom: `1 solid ${C.border}`,
    paddingBottom: 3,
  },

  contactItem: { fontSize: 8, color: C.light, marginBottom: 3 },
  summary: { fontSize: 9, lineHeight: 1.55, color: C.text2 },

  skillChip: {
    backgroundColor: C.border,
    color: C.accent,
    borderRadius: 3,
    padding: "2 5",
    fontSize: 8,
    marginBottom: 3,
    marginRight: 3,
    fontFamily: "Helvetica-Bold",
  },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap" },

  expBlock: { marginBottom: 8 },
  expHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  expRole: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: C.text1 },
  expCompany: { fontSize: 8.5, color: C.accent },
  expPeriod: { fontSize: 8, color: C.text3 },
  bullet: { flexDirection: "row", marginBottom: 2.5 },
  bulletDot: { color: C.accent, marginRight: 5, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.45, color: C.text2 },

  eduBlock: { marginBottom: 6 },
  eduDegree: { fontFamily: "Helvetica-Bold", fontSize: 9, color: C.text1 },
  eduSub: { fontSize: 8, color: C.text3 },

  langRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  langName: { fontSize: 8.5, color: C.light },
  langLevel: { fontSize: 8, color: C.border },

  certItem: { fontSize: 8.5, color: C.light, marginBottom: 2 },
});

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sidebarSectionHeader}>{title}</Text>
      {children}
    </View>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionHeader}>{title}</Text>
      {children}
    </View>
  );
}

export function ModernWithPhotoCv({ data }: { data: CvTemplateData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <View style={styles.sidebar}>
          {/* Photo */}
          <View style={styles.photoWrap}>
            {data.photoUrl ? (
              <Image src={data.photoUrl} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>PHOTO</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{data.fullName}</Text>
            <Text style={styles.headline}>{data.headline}</Text>
          </View>

          {/* Contact */}
          {(data.email || data.phone || data.location || data.linkedIn) && (
            <SidebarSection title="Contact">
              {data.email    && <Text style={styles.contactItem}>{data.email}</Text>}
              {data.phone    && <Text style={styles.contactItem}>{data.phone}</Text>}
              {data.location && <Text style={styles.contactItem}>{data.location}</Text>}
              {data.linkedIn && <Text style={styles.contactItem}>{data.linkedIn}</Text>}
            </SidebarSection>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <SidebarSection title="Skills">
              <View style={styles.skillsWrap}>
                {data.skills.map((s, i) => (
                  <Text key={i} style={styles.skillChip}>{s}</Text>
                ))}
              </View>
            </SidebarSection>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <SidebarSection title="Languages">
              {data.languages.map((l, i) => (
                <View key={i} style={styles.langRow}>
                  <Text style={styles.langName}>{l.name}</Text>
                  {l.level && <Text style={styles.langLevel}>{l.level}</Text>}
                </View>
              ))}
            </SidebarSection>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <SidebarSection title="Certifications">
              {data.certifications.map((c, i) => (
                <Text key={i} style={styles.certItem}>• {c}</Text>
              ))}
            </SidebarSection>
          )}
        </View>

        {/* ── Main ─────────────────────────────────────────────────────── */}
        <View style={styles.main}>
          {data.summary && (
            <MainSection title="Professional Summary">
              <Text style={styles.summary}>{data.summary}</Text>
            </MainSection>
          )}

          {data.experience && data.experience.length > 0 && (
            <MainSection title="Professional Experience">
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
                      <Text style={styles.bulletDot}>▸</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </MainSection>
          )}

          {data.education && data.education.length > 0 && (
            <MainSection title="Education">
              {data.education.map((edu, i) => (
                <View key={i} style={styles.eduBlock}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduSub}>{edu.institution}{edu.year ? ` · ${edu.year}` : ""}</Text>
                </View>
              ))}
            </MainSection>
          )}
        </View>
      </Page>
    </Document>
  );
}
