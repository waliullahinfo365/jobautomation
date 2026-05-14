"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactsIcon, DownloadIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import type { Contact, ContactRelationship, ContactTab } from "@/types/contact";
import { useContactsApi } from "@/hooks/api/useContactsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { getResourceId, normalizeContactsForUi } from "@/lib/utils/resource";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { DEMO_TENANT_ID, DEMO_USER_ID } from "@/config/env";
import { ContactStatsCards } from "./ContactStatsCards";
import { ContactTabs } from "./ContactTabs";
import { ContactFilters, type ContactFilterState } from "./ContactFilters";
import { ContactsTable } from "./ContactsTable";
import { ContactDetailPanel } from "./ContactDetailPanel";
import { FollowUpsDueSection } from "./FollowUpsDueSection";
import { ImportContactsModal } from "./ImportContactsModal";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/i18n/useTranslation";
import { contactRelationshipLabelKey } from "./contact-labels";

const initialFilters: ContactFilterState = {
  query: "",
  relationship: "All",
  followUpStatus: "All",
  relatedJob: "All Jobs",
};

const CREATE_RELATIONSHIP_OPTIONS: ContactRelationship[] = [
  "Recruiter",
  "Hiring Manager",
  "Referral",
  "Employee",
  "Networking",
  "Other",
];

function buildLocalContact(input: {
  name: string;
  company: string;
  role: string;
  relationship: ContactRelationship;
  email: string;
}): Contact {
  const id = `local_${Date.now()}`;
  const name = input.name.trim();
  const parts = name.split(/\s+/);
  const now = new Date().toISOString();
  return {
    id,
    _id: id,
    name,
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" ") ?? "",
    fullName: name,
    company: input.company.trim(),
    role: input.role.trim(),
    title: input.role.trim(),
    relationship: input.relationship,
    type: input.relationship,
    email: input.email.trim(),
    location: "",
    source: "Manual",
    followUpStatus: "Not Needed",
    reminderEnabled: false,
    relatedJobs: [],
    jobIds: [],
    communicationHistory: [],
    automationLogs: [],
    notes: "",
    lastContacted: now,
    lastContactedAt: now,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function ContactsPageClient() {
  const { t } = useTranslation();
  const contactsApi = useContactsApi({ fallbackToMock: false });

  const [tab, setTab] = useState<ContactTab>("all");
  const [filters, setFilters] = useState<ContactFilterState>(initialFilters);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [fallbackEdits, setFallbackEdits] = useState<Record<string, Partial<Contact>>>({});
  const [localNewContacts, setLocalNewContacts] = useState<Contact[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    company: "",
    role: "",
    relationship: "Recruiter" as ContactRelationship,
    email: "",
  });

  const baseContacts = useMemo(() => {
    const raw = normalizeListResponse<unknown>(contactsApi.data);
    return normalizeContactsForUi(raw);
  }, [contactsApi.data]);

  useEffect(() => {
    if (!contactsApi.isUsingFallback) {
      setFallbackEdits({});
      setLocalNewContacts([]);
    }
  }, [contactsApi.isUsingFallback]);

  const contacts = useMemo(() => {
    const merged = baseContacts.map((c) => {
      const id = getResourceId(c);
      const ed = fallbackEdits[id];
      return ed ? ({ ...c, ...ed } as Contact) : c;
    });
    if (!contactsApi.isUsingFallback) return merged;
    return [...merged, ...localNewContacts];
  }, [baseContacts, contactsApi.isUsingFallback, fallbackEdits, localNewContacts]);

  useEffect(() => {
    if (!selectedContact) return;
    const sid = getResourceId(selectedContact);
    const fresh = contacts.find((c) => getResourceId(c) === sid);
    if (!fresh) return;
    if (
      fresh.updatedAt !== selectedContact.updatedAt ||
      fresh.followUpStatus !== selectedContact.followUpStatus
    ) {
      setSelectedContact(fresh);
    }
  }, [contacts, selectedContact]);

  const stats = useMemo(
    () => ({
      totalContacts: contacts.length,
      recruiters: contacts.filter((c) => c.relationship === "Recruiter").length,
      referrals: contacts.filter((c) => c.relationship === "Referral").length,
      followUpsDue: contacts.filter((c) => c.followUpStatus === "Due Today" || c.followUpStatus === "Overdue").length,
      activeConversations: contacts.filter((c) => c.communicationHistory.length > 1).length,
      interviewsLinked: contacts.filter((c) => c.relatedJobs.some((j) => j.status === "Interview")).length,
    }),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesTab =
        tab === "all"
          ? true
          : tab === "followUpsDue"
            ? c.followUpStatus === "Due Today" || c.followUpStatus === "Overdue"
            : tab === "recruiters"
              ? c.relationship === "Recruiter"
              : tab === "referrals"
                ? c.relationship === "Referral"
                : tab === "hiringManagers"
                  ? c.relationship === "Hiring Manager"
                  : c.archived;

      const search = `${c.name} ${c.company} ${c.role} ${c.email} ${c.linkedInUrl || ""}`.toLowerCase();
      const matchesQuery = !filters.query || search.includes(filters.query.toLowerCase());
      const matchesRelationship = filters.relationship === "All" ? true : c.relationship === filters.relationship;
      const matchesFollowUp = filters.followUpStatus === "All" ? true : c.followUpStatus === filters.followUpStatus;

      return matchesTab && matchesQuery && matchesRelationship && matchesFollowUp;
    });
  }, [contacts, tab, filters]);

  const dueContacts = useMemo(
    () => contacts.filter((c) => c.followUpStatus === "Due Today" || c.followUpStatus === "Overdue").slice(0, 6),
    [contacts]
  );

  const handleMarkFollowedUp = useCallback(
    async (contactId: string) => {
      if (contactsApi.isUsingFallback) {
        setFallbackEdits((prev) => ({
          ...prev,
          [contactId]: {
            ...prev[contactId],
            followUpStatus: "Completed",
            nextFollowUpDate: undefined,
            updatedAt: new Date().toISOString(),
          },
        }));
        showInfo(t("contacts.toast.apiOfflineDemo"));
        showSuccess(t("contacts.toast.markedFollowedUp"));
        return;
      }
      try {
        await contactsApi.markFollowedUp(contactId);
        showSuccess(t("contacts.toast.markedFollowedUp"));
        await contactsApi.refetch();
      } catch {
        showError(t("contacts.toast.failedUpdateContact"));
      }
    },
    [contactsApi, t]
  );

  const submitCreateContact = async () => {
    if (!createForm.name.trim()) {
      showError(t("contacts.toast.nameRequired"));
      return;
    }
    const body = {
      tenantId: DEMO_TENANT_ID,
      createdBy: DEMO_USER_ID,
      name: createForm.name.trim(),
      relationship: createForm.relationship,
      email: createForm.email.trim() || undefined,
      followUpStatus: "Not Needed" as const,
    };

    if (contactsApi.isUsingFallback) {
      const row = buildLocalContact({
        name: createForm.name,
        company: createForm.company,
        role: createForm.role,
        relationship: createForm.relationship,
        email: createForm.email,
      });
      setLocalNewContacts((prev) => [...prev, row]);
      showInfo(t("contacts.toast.apiOfflineDemo"));
      showSuccess(t("contacts.toast.contactAddedDemo"));
      setCreateOpen(false);
      setCreateForm({ name: "", company: "", role: "", relationship: "Recruiter", email: "" });
      return;
    }

    try {
      await contactsApi.createContact(body);
      showSuccess(t("contacts.toast.contactCreated"));
      await contactsApi.refetch();
      setCreateOpen(false);
      setCreateForm({ name: "", company: "", role: "", relationship: "Recruiter", email: "" });
    } catch {
      showError(t("contacts.toast.couldNotCreate"));
    }
  };

  async function handleImportContacts(rows: Array<{ name: string; email?: string; company?: string; role?: string }>) {
    if (contactsApi.isUsingFallback) {
      const additions = rows.map((r) =>
        buildLocalContact({
          name: r.name,
          email: r.email ?? "",
          company: r.company ?? "",
          role: r.role ?? "",
          relationship: "Recruiter",
        })
      );
      setLocalNewContacts((prev) => [...prev, ...additions]);
      showInfo(t("contacts.toast.apiOfflineDemo"));
      showSuccess(t("contacts.toast.importedCount").replace("{{count}}", String(additions.length)));
      setImportOpen(false);
      return;
    }

    let imported = 0;
    for (const row of rows) {
      try {
        await contactsApi.createContact({
          tenantId: DEMO_TENANT_ID,
          createdBy: DEMO_USER_ID,
          name: row.name,
          relationship: "Recruiter",
          email: row.email,
          company: row.company,
          role: row.role,
          followUpStatus: "Not Needed",
        });
        imported += 1;
      } catch {
        /* skip bad rows, continue import */
      }
    }
    if (imported === 0) {
      showError(t("contacts.toast.noImported"));
      return;
    }
    await contactsApi.refetch();
    showSuccess(t("contacts.toast.importedCount").replace("{{count}}", String(imported)));
    setImportOpen(false);
  }

  const isInitialLoading = contactsApi.loading && contactsApi.data === undefined;

  const headerActions = (
    <>
      <Button variant="outline" type="button" onClick={() => setImportOpen(true)}>
        <DownloadIcon size={16} className="mr-2" />
        {t("contacts.importContacts")}
      </Button>
      <Button type="button" onClick={() => setCreateOpen(true)}>
        <PlusIcon size={16} className="mr-2" />
        {t("contacts.addContact")}
      </Button>
    </>
  );

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={ContactsIcon}
          eyebrow={t("contacts.pageEyebrow")}
          title={t("contacts.title")}
          description={t("contacts.pageDescription")}
          actions={headerActions}
        />
        <LoadingState title={t("contacts.loadingTitle")} description={t("contacts.loadingNetworkDesc")} />
      </div>
    );
  }

  const emptyAll = contacts.length === 0;
  const emptyFiltered = !emptyAll && filteredContacts.length === 0;

  const relationshipSelectOptions = CREATE_RELATIONSHIP_OPTIONS.map((rel) => ({
    label: t(contactRelationshipLabelKey(rel)),
    value: rel,
  }));

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          icon={ContactsIcon}
          eyebrow={t("contacts.pageEyebrow")}
          title={t("contacts.title")}
          description={t("contacts.pageDescription")}
          actions={headerActions}
        />

        <ContactStatsCards stats={stats} />
        <ContactTabs value={tab} onChange={setTab} />

        <ContactFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(initialFilters)}
          aside={contactsApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
        />

        {emptyAll ? (
          <EmptyState
            title={t("contacts.noContactsTitle")}
            description={t("contacts.noContactsDesc")}
            actionLabel={t("contacts.addContact")}
            onAction={() => setCreateOpen(true)}
          />
        ) : emptyFiltered ? (
          <EmptyState
            title={t("contacts.noMatchingTitle")}
            description={t("contacts.noMatchingDesc")}
            actionLabel={t("contacts.clearFilters")}
            onAction={() => setFilters(initialFilters)}
          />
        ) : tab === "followUpsDue" ? (
          <FollowUpsDueSection contacts={dueContacts} onMarkDone={(id) => void handleMarkFollowedUp(id)} />
        ) : (
          <ContactsTable
            contacts={filteredContacts}
            onView={(c) => {
              setSelectedContact(c);
              setPanelOpen(true);
            }}
            onMarkFollowedUp={(id) => void handleMarkFollowedUp(id)}
          />
        )}
      </div>

      <ContactDetailPanel contact={selectedContact} open={panelOpen} onClose={() => setPanelOpen(false)} />
      <ImportContactsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportContacts}
        loading={contactsApi.mutations.createLoading}
      />

      <AnimatePresence>
        {createOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setCreateOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-foreground">{t("contacts.createModal.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("contacts.createModal.subtitle")}</p>
              <div className="mt-4 grid gap-3">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("contacts.createModal.nameRequired")}
                  <Input
                    className="mt-1"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("contacts.createModal.company")}
                  <Input
                    className="mt-1"
                    value={createForm.company}
                    onChange={(e) => setCreateForm((s) => ({ ...s, company: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("contacts.createModal.role")}
                  <Input
                    className="mt-1"
                    value={createForm.role}
                    onChange={(e) => setCreateForm((s) => ({ ...s, role: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("contacts.createModal.relationship")}
                  <Select
                    className="mt-1"
                    value={createForm.relationship}
                    onChange={(e) =>
                      setCreateForm((s) => ({ ...s, relationship: e.target.value as ContactRelationship }))
                    }
                    options={relationshipSelectOptions}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("contacts.createModal.email")}
                  <Input
                    className="mt-1"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  {t("contacts.createModal.cancel")}
                </Button>
                <Button type="button" onClick={() => void submitCreateContact()}>
                  {t("contacts.createModal.save")}
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
