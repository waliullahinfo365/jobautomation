import { Router } from "express";
import { documentCreateSchema, documentUpdateSchema } from "@jobflow/shared/schemas";
import {
  createDocument,
  downloadDocumentText,
  exportPdf,
  getDocumentById,
  listDocuments,
  routeCv,
  updateDocument,
} from "../controllers/document.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.middleware";
import { routeCvBodySchema } from "../validators/ai-processing.validator";
import { documentIdParamSchema, listQuerySchema } from "../validators/common.validator";

export const documentRoutes = Router();

documentRoutes.get("/", requirePermission("documents.read"), validateQuery(listQuerySchema), listDocuments);
documentRoutes.post("/", requirePermission("documents.create"), validateBody(documentCreateSchema), createDocument);
documentRoutes.get(
  "/:id/download-text",
  requirePermission("documents.read"),
  validateParams(documentIdParamSchema),
  downloadDocumentText
);
documentRoutes.get("/:id", requirePermission("documents.read"), validateParams(documentIdParamSchema), getDocumentById);
documentRoutes.patch(
  "/:id",
  requirePermission("documents.update"),
  validateParams(documentIdParamSchema),
  validateBody(documentUpdateSchema),
  updateDocument
);
documentRoutes.post(
  "/:id/route-cv",
  requirePermission("documents.update"),
  validateParams(documentIdParamSchema),
  validateBody(routeCvBodySchema),
  routeCv
);
documentRoutes.post("/:id/export-pdf", requirePermission("documents.update"), validateParams(documentIdParamSchema), exportPdf);
