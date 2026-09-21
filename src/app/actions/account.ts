"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/auth";
import { readAddress, toAddressData, type AddressErrors, type AddressInput } from "@/lib/address";
import { db } from "@/lib/db";

export type SimpleState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/account");
  return user;
}

export async function updateNameAction(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { fieldErrors: { name: "Enter your name." } };
  if (name.length > 80) return { fieldErrors: { name: "Keep your name under 80 characters." } };
  await db.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/account");
  return { ok: true };
}

export async function changePasswordAction(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirmNext") ?? "");
  const fieldErrors: Record<string, string> = {};
  if (!current) fieldErrors.current = "Enter your current password.";
  if (next.length < 8) fieldErrors.next = "Use at least 8 characters.";
  else if (next.length > 128) fieldErrors.next = "Use 128 characters or fewer.";
  if (confirm !== next) fieldErrors.confirmNext = "Passwords don’t match.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const row = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await bcrypt.compare(current, row.passwordHash))) return { fieldErrors: { current: "That’s not your current password." } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true };
}

export type AddressState = { errors?: AddressErrors; values?: Partial<AddressInput>; error?: string };

async function ensureDefault(userId: string) {
  const hasDefault = await db.address.findFirst({ where: { userId, archived: false, isDefault: true }, select: { id: true } });
  if (hasDefault) return;
  const newest = await db.address.findFirst({ where: { userId, archived: false }, orderBy: { id: "desc" }, select: { id: true } });
  if (newest) await db.address.update({ where: { id: newest.id }, data: { isDefault: true } });
}

// Create, or edit in place. An address that past orders point at is never rewritten:
// it's archived and replaced, so old orders keep showing where they actually shipped.
export async function saveAddressAction(_prev: AddressState, formData: FormData): Promise<AddressState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "") || null;
  const makeDefault = formData.get("isDefault") === "on";
  const { a, errors } = readAddress(formData);
  if (Object.keys(errors).length) return { errors, values: a };

  const data = toAddressData(a);
  await db.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (!id) {
      await tx.address.create({ data: { ...data, userId: user.id, isDefault: makeDefault } });
      return;
    }
    const existing = await tx.address.findFirst({
      where: { id, userId: user.id, archived: false },
      select: { id: true, isDefault: true, _count: { select: { orders: true } } },
    });
    if (!existing) return;
    const isDefault = makeDefault || existing.isDefault;
    if (existing._count.orders > 0) {
      await tx.address.update({ where: { id }, data: { archived: true, isDefault: false } });
      await tx.address.create({ data: { ...data, userId: user.id, isDefault } });
    } else {
      await tx.address.update({ where: { id }, data: { ...data, isDefault } });
    }
  });
  await ensureDefault(user.id);
  revalidatePath("/account");
  redirect("/account#addresses");
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const existing = await db.address.findFirst({
    where: { id, userId: user.id, archived: false },
    select: { id: true, _count: { select: { orders: true } } },
  });
  if (!existing) return;
  if (existing._count.orders > 0) await db.address.update({ where: { id }, data: { archived: true, isDefault: false } });
  else await db.address.delete({ where: { id } });
  await ensureDefault(user.id);
  revalidatePath("/account");
}

export async function setDefaultAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const owned = await db.address.findFirst({ where: { id, userId: user.id, archived: false }, select: { id: true } });
  if (!owned) return;
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account");
}
