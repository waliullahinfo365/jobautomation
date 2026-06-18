/**
 * Promote a user to Owner (full workspace super-admin) by email.
 *
 * Usage:
 *   dotenv -e .env -- tsx apps/api/src/scripts/promote-user-role.ts info@benjaminkueper.com
 */
import { connectDatabase, disconnectDatabase } from "@jobflow/database";
import { UserModel } from "@jobflow/database/models";

async function main() {
  const rawEmail = process.argv[2]?.trim();
  if (!rawEmail) {
    console.error("Usage: tsx apps/api/src/scripts/promote-user-role.ts <email>");
    process.exit(1);
  }

  const email = rawEmail.toLowerCase();
  await connectDatabase();

  const user = (await UserModel.findOne({ email }).lean()) as {
    _id?: unknown;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    tenantId?: string;
  } | null;

  if (!user) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  const before = { role: user.role, status: user.status };
  await UserModel.updateOne(
    { _id: user._id },
    {
      $set: {
        role: "Owner",
        status: "Active",
        "preferences.isSuperAdmin": true,
      },
    }
  );

  const updated = (await UserModel.findById(user._id).lean()) as {
    _id?: unknown;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    tenantId?: string;
    preferences?: { isSuperAdmin?: boolean };
  } | null;

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: String(updated?._id ?? user._id),
        email: updated?.email ?? email,
        name: updated?.name ?? user.name,
        tenantId: updated?.tenantId ?? user.tenantId,
        before,
        after: {
          role: updated?.role,
          status: updated?.status,
          isSuperAdmin: updated?.preferences?.isSuperAdmin ?? true,
        },
      },
      null,
      2
    )
  );

  await disconnectDatabase();
  process.exit(0);
}

main().catch(async (error) => {
  console.error(error);
  try {
    await disconnectDatabase();
  } catch {
    // ignore
  }
  process.exit(1);
});
