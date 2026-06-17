import { connectDatabase } from "@jobflow/database";
import { TenantModel, UserModel, JobModel } from "@jobflow/database/models";

type JobRow = { _id?: unknown; pipelineStage?: string; company?: string; position?: string };

async function main() {
  await connectDatabase();
  const tenant = (await TenantModel.findOne({ slug: "demo-jobflow-ai-workspace" }).lean() ??
    (await TenantModel.findOne().sort({ createdAt: 1 }).lean())) as { _id?: unknown } | null;
  if (!tenant) {
    console.error("No tenant found");
    process.exit(1);
  }
  const tenantId = String(tenant._id);
  const user = (await UserModel.findOne({ tenantId, role: "Owner" }).lean()) as { _id?: unknown } | null;
  let job = (await JobModel.findOne({ tenantId }).select("_id pipelineStage company position").lean()) as JobRow | null;
  if (!job) {
    const created = await JobModel.create({
      tenantId,
      createdBy: String(user?._id ?? tenantId),
      company: "Phase0 Verify Co",
      position: "Verify Engineer",
      status: "Ready to Apply",
      pipelineStage: "Ready",
      source: "verification-script",
    });
    job = {
      _id: created._id,
      pipelineStage: created.pipelineStage,
      company: created.company,
      position: created.position,
    };
  }
  console.log(
    JSON.stringify(
      {
        tenantId,
        userId: user?._id ? String(user._id) : null,
        jobId: job?._id ? String(job._id) : null,
        pipelineStage: job?.pipelineStage ?? null,
      },
      null,
      2
    )
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
