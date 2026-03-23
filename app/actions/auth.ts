"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth";

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const password = formData.get("password") as string;
  if (password !== process.env.APP_PASSWORD) {
    return { error: "Fel lösenord. Försök igen." };
  }
  await createSession();
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
