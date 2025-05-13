"use server"

import { cookies } from "next/headers"

export async function login(username: string, password: string) {
  const validUsername = process.env.ADMIN_USERNAME
  const validPassword = process.env.ADMIN_PASSWORD

  if (username === validUsername && password === validPassword) {
    // Set a session cookie
    const cookieStore = await cookies();
    cookieStore.set("session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })
    return true
  }

  return false
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  return session?.value === "authenticated" ? session : null
}
