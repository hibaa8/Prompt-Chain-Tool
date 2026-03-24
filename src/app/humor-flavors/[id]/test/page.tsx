"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

interface TestImage {
  id: string;
  url: string;
  image_description?: string;
}

interface Caption {
  id: string;
  text: string;
  humor_flavor_id: number;
}

export default function TestFlavorPage() {
  const params = useParams();
  const [images, setImages] = useState<TestImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState("");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/images");
        if (!response.ok) throw new Error("Failed to fetch");
        const { data } = await response.json();
        setImages(data);
        if (data.length > 0) {
          setSelectedImageId(data[0].id);
        }
      } catch (err) {
        toast.error("Failed to load images");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleTest = async () => {
    if (!selectedImageId) {
      toast.error("Please select an image");
      return;
    }

    setTesting(true);
    try {
      const response = await fetch("/api/pipeline/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: selectedImageId }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to generate captions");
        return;
      }

      const { data } = await response.json();
      setCaptions(data || []);
      toast.success("Captions generated successfully!");
    } catch (err) {
      toast.error("Error generating captions");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const selectedImage = images.find((img) => img.id === selectedImageId);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Test Humor Flavor
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Selection */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Select Image
          </h2>

          <select
            value={selectedImageId}
            onChange={(e) => setSelectedImageId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white mb-4"
          >
            {images.map((img) => (
              <option key={img.id} value={img.id}>
                {img.image_description || img.url}
              </option>
            ))}
          </select>

          {selectedImage && (
            <div className="mb-6">
              {selectedImage.url && (
                <img
                  src={selectedImage.url}
                  alt="Test"
                  className="w-full rounded-lg mb-4 max-h-96 object-cover"
                />
              )}
              {selectedImage.image_description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedImage.image_description}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {testing ? "Generating..." : "Generate Captions"}
          </button>

          <Link
            href={`/humor-flavors/${params.id}`}
            className="block mt-4 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition text-center"
          >
            Back
          </Link>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Generated Captions
          </h2>

          {captions.length > 0 ? (
            <div className="space-y-3">
              {captions.map((caption, idx) => (
                <div
                  key={caption.id || idx}
                  className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg"
                >
                  <p className="text-gray-900 dark:text-white">{caption.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Generated captions will appear here
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
