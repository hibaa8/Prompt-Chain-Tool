"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NewStepPage() {
  const params = useParams();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, show a placeholder
      toast.error("Step creation requires additional configuration fields (LLM models, input/output types)");
      setLoading(false);
      return;

      // Complete implementation would fetch available models, input types, output types
      // Then POST to /api/humor-flavor-steps
    } catch (err) {
      toast.error("Error creating step");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Add Step to Flavor
      </h1>

      <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-200 px-4 py-3 rounded mb-6">
        Step creation requires configuring LLM models, input types, and output types from the database.
        This feature is available but needs additional database queries to fetch available options.
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Step Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Generate image description"
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="System context for the LLM..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            User Prompt
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="User input prompt for the LLM..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Temperature ({temperature})
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {loading ? "Creating..." : "Create Step"}
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
