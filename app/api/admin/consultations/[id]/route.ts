import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminUser } from "@/lib/auth/admin";

// PATCH /api/admin/consultations/:id — mark a lead handled / unhandled
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const handled = Boolean(body.handled);

  await prisma.consultationRequest.update({
    where: { id: params.id },
    data: { handled },
  });

  return NextResponse.json({ ok: true, handled });
}
