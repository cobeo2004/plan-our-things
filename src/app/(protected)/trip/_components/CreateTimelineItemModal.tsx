import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Clock, DollarSign, FileText, Image, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { TimelineItemsRecord, TripsRecord } from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { z } from "zod";
import { timelineItemsSchema } from "@/lib/pocketbase/schema/zodSchema";

interface CreateTimelineItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripsRecord;
}

export const CreateTimelineItemModal: React.FC<
  CreateTimelineItemModalProps
> = ({ isOpen, onClose, trip }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [cost, setCost] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const pb = createBrowserClient();
  const user = pb.authStore.record;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (itemData: z.infer<typeof timelineItemsSchema>) => {
      const parsedTimeline = await timelineItemsSchema.safeParseAsync(itemData);
      if (!parsedTimeline.success) {
        throw new Error(parsedTimeline.error.message);
      }
      return await pb.collection("timeline_items").create(parsedTimeline.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-items", trip.id] });
      toast.success("Timeline item added successfully!");
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTime("");
    setCost("");
    setImage(null);
  };

  const formatTimeForBackend = (localTime: string): string => {
    // Convert local datetime-local input to the required format: YYYY-MM-DD HH:mm:ss.SSSZ
    const date = new Date(localTime);
    return date
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, ".000Z");
  };

  const handleSubmit = (e: React.FormEvent) => {
    const formForSubmit: z.infer<typeof timelineItemsSchema> = {
      trip: trip.id,
      title,
      description: description || undefined,
      time: formatTimeForBackend(time),
      cost: cost ? parseFloat(cost) : undefined,
      // @ts-expect-error Expected error
      image: image || undefined,
      created_by: user!.id,
      created_from_poll: false,
    };
    formForSubmit;
    e.preventDefault();
    createMutation.mutate(formForSubmit);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImage(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Add Timeline Item
          </h2>
          <button
            title="Close"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Visit Senso-ji Temple"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="Add more details about this activity..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date & Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                title="Date and time"
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cost (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Image (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center w-full py-3 px-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <Upload className="w-5 h-5 text-slate-400 mr-3" />
                <span className="text-slate-600">
                  {image ? image.name : "Choose an image file"}
                </span>
              </label>
            </div>
            {image && (
              <div className="mt-2 text-sm text-slate-500">
                Selected: {image.name} ({(image.size / 1024 / 1024).toFixed(2)}{" "}
                MB)
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Adding..." : "Add to Timeline"}
          </button>
        </form>
      </div>
    </div>
  );
};
