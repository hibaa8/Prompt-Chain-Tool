"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface SelectOption {
  id: number;
  slug?: string;
  name?: string;
  description?: string;
}

interface StepRecord {
  id: number;
  order_by: number;
  description?: string;
  llm_system_prompt?: string;
  llm_user_prompt?: string;
  llm_temperature?: number;
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  humor_flavor_step_type_id: number;
}

export const dynamic = "force-dynamic";

export default function EditStepPage() {
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState<StepRecord | null>(null);
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [orderBy, setOrderBy] = useState(0);
  const [llmModelId, setLlmModelId] = useState<number | null>(null);
  const [llmInputTypeId, setLlmInputTypeId] = useState<number | null>(null);
  const [llmOutputTypeId, setLlmOutputTypeId] = useState<number | null>(null);
  const [stepTypeId, setStepTypeId] = useState<number | null>(null);
  const [models, setModels] = useState<SelectOption[]>([]);
  const [inputTypes, setInputTypes] = useState<SelectOption[]>([]);
  const [outputTypes, setOutputTypes] = useState<SelectOption[]>([]);
  const [stepTypes, setStepTypes] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [stepRes, optsRes] = await Promise.all([
          fetch(`/api/humor-flavor-steps/${params.stepId}`),
          fetch("/api/humor-flavor-steps/options"),
        ]);

        if (!stepRes.ok || !optsRes.ok) throw new Error("Failed to load");

        const { data: stepData } = await stepRes.json();
        const optionsPayload = await optsRes.json();
        setStep(stepData);

        setDescription(stepData.description ?? "");
        setSystemPrompt(stepData.llm_system_prompt ?? "");
        setUserPrompt(stepData.llm_user_prompt ?? "");
        setTemperature(stepData.llm_temperature ?? 0.7);
        setOrderBy(stepData.order_by);
        setLlmModelId(stepData.llm_model_id);
        setLlmInputTypeId(stepData.llm_input_type_id);
        setLlmOutputTypeId(stepData.llm_output_type_id);
        setStepTypeId(stepData.humor_flavor_step_type_id);

        setModels(optionsPayload?.data?.llm_models ?? []);
        setInputTypes(optionsPayload?.data?.llm_input_types ?? []);
        setOutputTypes(optionsPayload?.data?.llm_output_types ?? []);
        setStepTypes(optionsPayload?.data?.humor_flavor_step_types ?? []);
      } catch {
        toast.error("Failed to load step");
        router.push(`/humor-flavors/${params.id}`);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [params.id, params.stepId, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/humor-flavor-steps/${params.stepId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_by: orderBy,
          description,
          llm_system_prompt: systemPrompt,
          llm_user_prompt: userPrompt,
          llm_temperature: temperature,
          llm_model_id: llmModelId,
          llm_input_type_id: llmInputTypeId,
          llm_output_type_id: llmOutputTypeId,
          humor_flavor_step_type_id: stepTypeId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        toast.error(payload.error || "Failed to save step");
        return;
      }

      toast.success("Step updated!");
      router.push(`/humor-flavors/${params.id}`);
    } catch {
      toast.error("Error updating step");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this step?")) return;
    try {
      const response = await fetch(`/api/humor-flavor-steps/${params.stepId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json();
        toast.error(payload.error || "Failed to delete step");
        return;
      }
      toast.success("Step deleted");
      router.push(`/humor-flavors/${params.id}`);
    } catch {
      toast.error("Error deleting step");
    }
  };

  if (loading || !step) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Edit Step</h1>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Step Order</label>
          <input
            type="number"
            min={0}
            value={orderBy}
            onChange={(e) => setOrderBy(parseInt(e.target.value || "0", 10))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">LLM Model</label>
          <select value={llmModelId ?? ""} onChange={(e) => setLlmModelId(Number(e.target.value))} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name ?? `Model ${model.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Input Type</label>
          <select value={llmInputTypeId ?? ""} onChange={(e) => setLlmInputTypeId(Number(e.target.value))} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
            {inputTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.slug ?? option.description ?? `Input ${option.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Output Type</label>
          <select value={llmOutputTypeId ?? ""} onChange={(e) => setLlmOutputTypeId(Number(e.target.value))} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
            {outputTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.slug ?? option.description ?? `Output ${option.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Step Type</label>
          <select value={stepTypeId ?? ""} onChange={(e) => setStepTypeId(Number(e.target.value))} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
            {stepTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.slug ?? option.description ?? `Step Type ${option.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">User Prompt</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Temperature ({temperature})</label>
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

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition">
            {saving ? "Saving..." : "Save Step"}
          </button>
          <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">
            Delete
          </button>
          <Link href={`/humor-flavors/${params.id}`} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
