import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function Dashboard() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: flavors, error } = await supabase
    .from("humor_flavors")
    .select("*")
    .order("created_datetime_utc", { ascending: false });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          Error loading flavors: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Humor Flavors
        </h1>
        <Link
          href="/humor-flavors/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Create New Flavor
        </Link>
      </div>

      {flavors && flavors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flavors.map((flavor: any) => (
            <div
              key={flavor.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition"
            >
              <Link href={`/humor-flavors/${flavor.id}/captions`} className="block">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {flavor.name || flavor.slug || `Flavor #${flavor.id}`}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  {flavor.description || "No description"}
                </p>
              </Link>
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={`/humor-flavors/${flavor.id}`}
                  className="flex-1 min-w-[4rem] bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-center transition text-sm"
                >
                  Edit
                </Link>
                <Link
                  href={`/humor-flavors/${flavor.id}/test`}
                  className="flex-1 min-w-[4rem] bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded text-center transition text-sm"
                >
                  Test
                </Link>
                <Link
                  href={`/humor-flavors/${flavor.id}/duplicate`}
                  className="flex-1 min-w-[4rem] bg-violet-600 hover:bg-violet-700 text-white font-bold py-1.5 px-3 rounded text-center transition text-sm"
                >
                  Duplicate
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No humor flavors yet. Create one to get started!
          </p>
          <Link
            href="/humor-flavors/new"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Create First Flavor
          </Link>
        </div>
      )}
    </div>
  );
}
