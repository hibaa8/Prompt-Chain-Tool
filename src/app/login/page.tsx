import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/");
  }

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          Humor Flavor Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Admin dashboard for managing humor flavor configurations
        </p>

        <a
          href={`${supabaseUrl}/auth/v1/authorize?provider=google&client_id=${googleClientId}&redirect_to=${encodeURIComponent(
            `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/callback`
          )}&response_type=code&scope=openid+email+profile`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
