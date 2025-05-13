"use server"

import { cookies } from "next/headers"

export async function login(username: string, password: string) {
  try {
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
        sameSite: "lax",
      });
      return true
    }

    return false
  } catch (error) {
    console.error("Login error:", error)
    return false
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("session")
  } catch (error) {
    console.error("Logout error:", error)
  }
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get("session")
    return session?.value === "authenticated" ? session : null
  } catch (error) {
    console.error("Get session error:", error)
    return null
  }
}
