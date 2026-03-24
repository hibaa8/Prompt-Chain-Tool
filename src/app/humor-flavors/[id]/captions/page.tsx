"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

interface Image {
  id: string;
  url?: string;
  image_description?: string;
}

interface Caption {
  id: string;
  content?: string;
  humor_flavor_id: number;
  image_id: string;
  created_datetime_utc: string;
  images?: Image;
}

export default function FlavorCaptionsPage() {
  const params = useParams();
  const [flavor, setFlavor] = useState<{ slug?: string; name?: string; description?: string } | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [flavorRes, captionsRes] = await Promise.all([
          fetch(`/api/humor-flavors/${params.id}`),
          fetch(`/api/captions?humor_flavor_id=${params.id}`),
        ]);

        if (!flavorRes.ok || !captionsRes.ok) throw new Error("Failed to fetch");

        const flavorPayload = await flavorRes.json();
        const captionsPayload = await captionsRes.json();

        setFlavor(flavorPayload.data);
        const allCaptions: Caption[] = captionsPayload.data || [];
        setCaptions(allCaptions);

        // Default to the first image that has captions
        const firstImageId = allCaptions[0]?.image_id;
        if (firstImageId) setSelectedImageId(firstImageId);
      } catch {
        toast.error("Failed to load captions");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.id]);

  // Deduplicate images that have captions for this flavor
  const imagesWithCaptions = Array.from(
    new Map(
      captions
        .filter((c) => c.image_id)
        .map((c) => [c.image_id, c.images])
    ).entries()
  ).map(([imageId, image]) => ({ imageId, image }));

  const visibleCaptions = captions.filter((c) => c.image_id === selectedImageId);
  const selectedImage = imagesWithCaptions.find((i) => i.imageId === selectedImageId)?.image;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-bold">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {flavor?.name || flavor?.slug || `Flavor #${params.id}`}
        </h1>
        <div className="ml-auto flex gap-2">
          <Link
            href={`/humor-flavors/${params.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
          >
            Edit
          </Link>
          <Link
            href={`/humor-flavors/${params.id}/test`}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
          >
            Test
          </Link>
        </div>
      </div>

      {imagesWithCaptions.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No captions generated for this flavor yet.
          </p>
          <Link
            href={`/humor-flavors/${params.id}/test`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Generate Captions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: image selector */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-800 sticky top-24">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">
                Image ({imagesWithCaptions.length})
              </h2>
              <select
                value={selectedImageId}
                onChange={(e) => setSelectedImageId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm mb-4"
              >
                {imagesWithCaptions.map(({ imageId, image }) => (
                  <option key={imageId} value={imageId}>
                    {image?.image_description || imageId.slice(0, 8) + "..."}
                  </option>
                ))}
              </select>

              {selectedImage?.url && (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.image_description || ""}
                  className="w-full rounded-lg object-cover max-h-64"
                />
              )}
              {selectedImage?.image_description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedImage.image_description}
                </p>
              )}
            </div>
          </div>

          {/* Right: captions for selected image */}
          <div className="lg:col-span-2">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3">
              Captions ({visibleCaptions.length})
            </h2>
            {visibleCaptions.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No captions for this image.</p>
            ) : (
              <div className="space-y-3">
                {visibleCaptions.map((caption, idx) => (
                  <div
                    key={caption.id}
                    className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm"
                  >
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">#{idx + 1}</p>
                    <p className="text-gray-900 dark:text-white">{caption.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
