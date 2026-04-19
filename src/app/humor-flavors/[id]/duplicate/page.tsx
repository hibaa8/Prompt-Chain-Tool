"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

export default function DuplicateFlavorPage() {
  const params = useParams();
  const router = useRouter();
  const [sourceLabel, setSourceLabel] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/humor-flavors/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        const { data } = await res.json();
        const label = data.name || data.slug || `Flavor #${data.id}`;
        setSourceLabel(label);
        setNewName(`Copy of ${label}`);
      } catch {
        toast.error("Could not load flavor to duplicate");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Enter a name for the duplicate");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/humor-flavors/${params.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(payload.error || "Duplicate failed");
        return;
      }

      toast.success("Flavor duplicated!");
      const newId = payload.data?.id;
      if (newId) {
        router.push(`/humor-flavors/${newId}`);
      } else {
        router.push("/");
      }
    } catch {
      toast.error("Duplicate failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Duplicate flavor
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
        Source: <span className="font-semibold text-gray-900 dark:text-white">{sourceLabel}</span>
        . All steps will be copied. Choose a new name that is not already used.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800"
      >
        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
          New flavor name
        </label>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          className="w-full px-4 py-2 mb-6 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          placeholder="Unique name"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {submitting ? "Duplicating…" : "Create duplicate"}
          </button>
          <Link
            href={`/humor-flavors/${params.id}`}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
