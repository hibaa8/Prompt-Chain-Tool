"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useEffect } from "react";

export const dynamic = "force-dynamic";

interface SelectOption {
  id: number;
  slug?: string;
  name?: string;
  description?: string;
}

export default function NewStepPage() {
  const params = useParams();
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
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [flavorRes, optsRes] = await Promise.all([
          fetch(`/api/humor-flavors/${params.id}`),
          fetch("/api/humor-flavor-steps/options"),
        ]);

        if (!flavorRes.ok || !optsRes.ok) {
          throw new Error("Failed to load step setup data");
        }

        const flavorPayload = await flavorRes.json();
        const optionsPayload = await optsRes.json();

        const existingSteps = flavorPayload?.data?.humor_flavor_steps ?? [];
        setOrderBy(existingSteps.length);

        const modelsData = optionsPayload?.data?.llm_models ?? [];
        const inputData = optionsPayload?.data?.llm_input_types ?? [];
        const outputData = optionsPayload?.data?.llm_output_types ?? [];
        const stepTypeData = optionsPayload?.data?.humor_flavor_step_types ?? [];

        setModels(modelsData);
        setInputTypes(inputData);
        setOutputTypes(outputData);
        setStepTypes(stepTypeData);

        if (modelsData[0]) setLlmModelId(modelsData[0].id);
        if (inputData[0]) setLlmInputTypeId(inputData[0].id);
        if (outputData[0]) setLlmOutputTypeId(outputData[0].id);
        if (stepTypeData[0]) setStepTypeId(stepTypeData[0].id);
      } catch (err) {
        toast.error("Failed to load form options");
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!llmModelId || !llmInputTypeId || !llmOutputTypeId || !stepTypeId) {
        toast.error("Missing required step configuration");
        return;
      }

      const response = await fetch("/api/humor-flavor-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          humor_flavor_id: Number(params.id),
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
        const errorPayload = await response.json();
        toast.error(errorPayload.error || "Failed to create step");
        return;
      }

      toast.success("Step created!");
      window.location.href = `/humor-flavors/${params.id}`;
    } catch (err) {
      toast.error("Error creating step");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Add Step to Flavor
      </h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Step Order
          </label>
          <input
            type="number"
            min={0}
            value={orderBy}
            onChange={(e) => setOrderBy(parseInt(e.target.value || "0", 10))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

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
            LLM Model
          </label>
          <select
            value={llmModelId ?? ""}
            onChange={(e) => setLlmModelId(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name ?? `Model ${model.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Input Type
          </label>
          <select
            value={llmInputTypeId ?? ""}
            onChange={(e) => setLlmInputTypeId(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            {inputTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.slug ?? option.description ?? `Input ${option.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Output Type
          </label>
          <select
            value={llmOutputTypeId ?? ""}
            onChange={(e) => setLlmOutputTypeId(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            {outputTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.slug ?? option.description ?? `Output ${option.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
            Step Type
          </label>
          <select
            value={stepTypeId ?? ""}
            onChange={(e) => setStepTypeId(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            {stepTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.slug ?? option.description ?? `Step Type ${option.id}`}
              </option>
            ))}
          </select>
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
