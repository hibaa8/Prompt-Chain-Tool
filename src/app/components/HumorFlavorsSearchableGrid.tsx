"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface DashboardFlavorRow {
  id: number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
}

function flavorLabel(f: DashboardFlavorRow): string {
  return (f.name || f.slug || `Flavor #${f.id}`).trim();
}

function matchesQuery(f: DashboardFlavorRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const name = (f.name ?? "").toLowerCase();
  const slug = (f.slug ?? "").toLowerCase();
  return name.includes(needle) || slug.includes(needle);
}

export default function HumorFlavorsSearchableGrid({
  flavors,
}: {
  flavors: DashboardFlavorRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => flavors.filter((f) => matchesQuery(f, query)),
    [flavors, query]
  );

  return (
    <div>
      <label htmlFor="flavor-search" className="sr-only">
        Search humor flavors by name
      </label>
      <div className="mb-6">
        <input
          id="flavor-search"
          type="search"
          autoComplete="off"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {query.trim()
            ? `${filtered.length} of ${flavors.length} flavor${flavors.length === 1 ? "" : "s"}`
            : `${flavors.length} flavor${flavors.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((flavor) => (
            <div
              key={flavor.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition"
            >
              <Link href={`/humor-flavors/${flavor.id}/captions`} className="block">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {flavorLabel(flavor)}
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
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-800">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No flavors match &ldquo;{query.trim()}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
