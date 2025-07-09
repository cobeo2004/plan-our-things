"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Clock, DollarSign, Upload } from "lucide-react";
import { TimelineItemsResponse, TripsRecord } from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { timelineItemsSchema } from "@/lib/pocketbase/schema/zodSchema";
import toast from "react-hot-toast";
import { z } from "zod";

interface ProcessedTimelineItem extends TimelineItemsResponse {
  created_by: string; // User name for display
  created_by_id?: string; // User ID for permission checks
  image: string;
}

interface EditTimelineItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineItem: ProcessedTimelineItem;
  trip: TripsRecord;
}

export const EditTimelineItemModal: React.FC<EditTimelineItemModalProps> = ({
  isOpen,
  onClose,
  timelineItem,
  trip,
}) => {
  const [title, setTitle] = useState(timelineItem.title);
  const [description, setDescription] = useState(
    timelineItem.description || ""
  );
  const [time, setTime] = useState("");
  const [cost, setCost] = useState(timelineItem.cost?.toString() || "");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pb = createBrowserClient();
  const queryClient = useQueryClient();

  // Convert backend datetime to datetime-local format
  const formatDateTimeForInput = (datetime: string): string => {
    return new Date(datetime).toISOString().slice(0, 16);
  };

  // Convert datetime-local to backend format
  const formatTimeForBackend = (localTime: string): string => {
    const date = new Date(localTime);
    return date
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, ".000Z");
  };

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && timelineItem) {
      setTitle(timelineItem.title);
      setDescription(timelineItem.description || "");
      setTime(formatDateTimeForInput(timelineItem.time));
      setCost(timelineItem.cost?.toString() || "");
      setImage(null);

      // Set preview URL if item has existing image
      if (timelineItem.image) {
        setPreviewUrl(pb.files.getURL(timelineItem, timelineItem.image));
      } else {
        setPreviewUrl(null);
      }
    }
  }, [isOpen]); // Only depend on isOpen, not timelineItem

  const updateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const formData = new FormData();

      // Add all the fields
      formData.append("title", updateData.title);
      formData.append("description", updateData.description);
      formData.append("time", updateData.time);
      if (updateData.cost !== undefined) {
        formData.append("cost", updateData.cost.toString());
      }
      formData.append("trip", updateData.trip);
      formData.append("created_by", updateData.created_by);
      formData.append(
        "created_from_poll",
        updateData.created_from_poll.toString()
      );

      // Add image if new one was selected
      if (image) {
        formData.append("image", image);
      }

      return await pb
        .collection("timeline_items")
        .update(timelineItem.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline-items", trip.id] });
      toast.success("Timeline item updated successfully!");
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setImage(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    if (title.trim().length < 10) {
      toast.error("Title must be at least 10 characters long");
      return;
    }

    if (!time) {
      toast.error("Please select a time");
      return;
    }

    // Validate cost if provided
    if (cost && (isNaN(parseFloat(cost)) || parseFloat(cost) < 0)) {
      toast.error("Please enter a valid cost amount");
      return;
    }

    // Check if anything has changed
    const formattedTime = formatTimeForBackend(time);
    const costValue = cost ? parseFloat(cost) : undefined;

    const hasChanges =
      title.trim() !== timelineItem.title ||
      description.trim() !== (timelineItem.description || "") ||
      formattedTime !== timelineItem.time ||
      costValue !== timelineItem.cost ||
      image !== null;

    if (!hasChanges) {
      toast("No changes detected");
      return;
    }

    updateMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      time: formattedTime,
      cost: costValue,
      trip: timelineItem.trip,
      created_by: timelineItem.created_by_id || timelineItem.created_by,
      created_from_poll: timelineItem.created_from_poll || false,
    });
  };

  const handleClose = () => {
    if (updateMutation.isPending) return;

    // Clean up preview URL if it was created for new image
    if (previewUrl && image) {
      URL.revokeObjectURL(previewUrl);
    }

    onClose();
  };

  if (!isOpen) return null;

  const hasChanges =
    title.trim() !== timelineItem.title ||
    description.trim() !== (timelineItem.description || "") ||
    time !== formatDateTimeForInput(timelineItem.time) ||
    cost !== (timelineItem.cost?.toString() || "") ||
    image !== null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
      onClick={(e) => {
        // Only close if clicking on the backdrop itself, not child elements
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto relative z-[10000]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Edit Timeline Item
          </h2>
          <button
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Visit Senso-ji Temple"
                required
                minLength={10}
                maxLength={200}
                disabled={updateMutation.isPending}
                autoFocus
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {title.length}/200 characters (minimum 10)
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={3}
              placeholder="Add more details about this activity..."
              disabled={updateMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date & Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
                disabled={updateMutation.isPending}
                title="Date and time"
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
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="0.00"
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Image
            </label>

            {/* Current/Preview Image */}
            {previewUrl && (
              <div className="mb-4 relative">
                <img
                  src={previewUrl}
                  alt="Timeline item preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                {image && (
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    New image selected
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <Upload className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-sm file:bg-slate-100 file:text-slate-700 file:rounded-md hover:file:bg-slate-200"
                disabled={updateMutation.isPending}
                title="Timeline item image"
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {image
                ? `Selected: ${image.name}`
                : timelineItem.image
                ? "Choose a new image to replace the current one (optional)"
                : "Choose an image to add (optional)"}
            </div>
          </div>

          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                Changes detected:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {title.trim() !== timelineItem.title && (
                  <li>
                    • Title: "{timelineItem.title}" → "{title.trim()}"
                  </li>
                )}
                {description.trim() !== (timelineItem.description || "") && (
                  <li>• Description updated</li>
                )}
                {time !== formatDateTimeForInput(timelineItem.time) && (
                  <li>• Time updated</li>
                )}
                {cost !== (timelineItem.cost?.toString() || "") && (
                  <li>
                    • Cost:{" "}
                    {timelineItem.cost ? `$${timelineItem.cost}` : "None"} →{" "}
                    {cost ? `$${cost}` : "None"}
                  </li>
                )}
                {image && <li>• Image will be updated</li>}
              </ul>
            </div>
          )}

          <div className="flex space-x-3 mt-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !hasChanges}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? "Updating..." : "Update Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
