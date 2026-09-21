"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { mergeGuestCartInto } from "@/lib/cart";
import { db } from "@/lib/db";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "confirm", string>>;
  values?: { name?: string; email?: string };
};

// Only same-site relative paths, so the post-login redirect can't be pointed elsewhere.
function safeCallback(raw: FormDataEntryValue | null) {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallback(formData.get("callbackUrl"));

  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: { email } };

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) return { error: "That email and password don’t match an account.", values: { email } };
    throw err;
  }
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (user) await mergeGuestCartInto(user.id);
  redirect(callbackUrl);
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const callbackUrl = safeCallback(formData.get("callbackUrl"));
  const values = { name, email };

  const fieldErrors: AuthFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Enter your name.";
  else if (name.length > 80) fieldErrors.name = "Keep your name under 80 characters.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";
  else if (password.length > 128) fieldErrors.password = "Use 128 characters or fewer.";
  if (confirm !== password) fieldErrors.confirm = "Passwords don’t match.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  if ((await db.user.findUnique({ where: { email }, select: { id: true } }))) {
    return { fieldErrors: { email: "An account with this email already exists. Sign in instead." }, values };
  }

  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
    select: { id: true },
  });
  await signIn("credentials", { email, password, redirect: false });
  await mergeGuestCartInto(user.id);
  redirect(callbackUrl);
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
