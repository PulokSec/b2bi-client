import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form"
import { getSession } from "@/lib/auth"

export default async function Home() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
