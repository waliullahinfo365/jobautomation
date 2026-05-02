import { Router } from "express";
import { contactCreateSchema, contactUpdateSchema } from "@shared/schemas";
import { createContact, getContactById, listContacts, markFollowedUp, updateContact } from "../controllers/contact.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import { idParamSchema, listQuerySchema } from "../validators/common.validator";

export const contactRoutes = Router();

contactRoutes.get("/", requirePermission("contacts.read"), validateQuery(listQuerySchema), listContacts);
contactRoutes.post("/", requirePermission("contacts.create"), validateBody(contactCreateSchema), createContact);
contactRoutes.get("/:id", requirePermission("contacts.read"), validateParams(idParamSchema), getContactById);
contactRoutes.patch(
  "/:id",
  requirePermission("contacts.update"),
  validateParams(idParamSchema),
  validateBody(contactUpdateSchema),
  updateContact
);
contactRoutes.post("/:id/mark-followed-up", requirePermission("contacts.update"), validateParams(idParamSchema), markFollowedUp);
