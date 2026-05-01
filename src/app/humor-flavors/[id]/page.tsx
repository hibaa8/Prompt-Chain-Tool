"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

interface HumorFlavorStep {
  id: number;
  humor_flavor_id: number;
  order_by: number;
  description?: string;
  llm_system_prompt?: string;
  llm_user_prompt?: string;
}

interface HumorFlavor {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  humor_flavor_steps: HumorFlavorStep[];
}

export default function EditFlavorPage() {
  const params = useParams();
  const router = useRouter();
  const [flavor, setFlavor] = useState<HumorFlavor | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchFlavor = async () => {
    const response = await fetch(`/api/humor-flavors/${params.id}`);
    if (!response.ok) throw new Error("Failed to fetch");
    const { data } = await response.json();
    setFlavor(data);
    setName(data.name || data.slug || "");
    setDescription(data.description || "");
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchFlavor();
      } catch (err) {
        toast.error("Failed to load flavor");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/humor-flavors/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to save");
        return;
      }

      toast.success("Flavor saved successfully!");
    } catch (err) {
      toast.error("Error saving flavor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this flavor?")) return;

    try {
      const response = await fetch(`/api/humor-flavors/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Flavor deleted!");
      router.push("/");
    } catch (err) {
      toast.error("Error deleting flavor");
    }
  };

  const handleReorderStep = async (stepId: number, fromOrder: number, toOrder: number) => {
    try {
      const response = await fetch(`/api/humor-flavor-steps/${stepId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_order: fromOrder, to_order: toOrder }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to reorder step");
        return;
      }

      await fetchFlavor();
      toast.success("Step order updated");
    } catch {
      toast.error("Error reordering step");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!flavor) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <p className="text-gray-600 dark:text-gray-400">Flavor not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Edit Humor Flavor
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Edit Form */}
        <form onSubmit={handleSave} className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2 flex-col">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/humor-flavors/${params.id}/test`}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition text-center"
            >
              Test
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Delete Flavor
            </button>
            <Link
              href={`/humor-flavors/${params.id}/duplicate`}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg transition text-center"
            >
              Duplicate…
            </Link>
            <Link
              href="/"
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition text-center"
            >
              Back
            </Link>
          </div>
        </form>

        {/* Steps List */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Steps
            </h2>
            <Link
              href={`/humor-flavors/${params.id}/steps/new`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Add Step
            </Link>
          </div>

          {flavor.humor_flavor_steps && flavor.humor_flavor_steps.length > 0 ? (
            <div className="space-y-4">
              {flavor.humor_flavor_steps
                .sort((a, b) => a.order_by - b.order_by)
                .map((step, index, sortedSteps) => (
                  <div
                    key={step.id}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">
                          Step {step.order_by + 1}
                        </p>
                        <p className="text-gray-900 dark:text-white">
                          {step.description || "No description"}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            handleReorderStep(
                              step.id,
                              step.order_by,
                              sortedSteps[index - 1].order_by
                            )
                          }
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          disabled={index === sortedSteps.length - 1}
                          onClick={() =>
                            handleReorderStep(
                              step.id,
                              step.order_by,
                              sortedSteps[index + 1].order_by
                            )
                          }
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                        >
                          Down
                        </button>
                        <Link
                          href={`/humor-flavors/${params.id}/steps/${step.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 font-bold"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No steps yet. Add one to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
