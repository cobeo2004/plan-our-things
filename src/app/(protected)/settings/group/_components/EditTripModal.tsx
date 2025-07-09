"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Calendar, MapPin, Upload, Image } from "lucide-react";
import { TripsResponse, GroupsResponse } from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { tripsSchema } from "@/lib/pocketbase/schema/zodSchema";
import toast from "react-hot-toast";
import { z } from "zod";

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripsResponse & { cover_image?: string };
  group: GroupsResponse;
  onTripUpdated: () => void;
}

const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const EditTripModal: React.FC<EditTripModalProps> = ({
  isOpen,
  onClose,
  trip,
  group,
  onTripUpdated,
}) => {
  const [title, setTitle] = useState(trip.title);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pb = createBrowserClient();

  // Convert datetime to date format for input
  const formatDateTimeToDate = (datetime: string): string => {
    return new Date(datetime).toISOString().split("T")[0];
  };

  // Convert date to datetime format for PocketBase
  const formatDateToDatetime = (dateString: string): string => {
    const date = new Date(dateString);
    return date
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, ".000Z");
  };

  // Reset form when trip changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(trip.title);
      setStartDate(formatDateTimeToDate(trip.start_date));
      setEndDate(formatDateTimeToDate(trip.end_date));
      setCoverImageFile(null);
      setPreviewUrl(trip.cover_image || null);
    }
  }, [isOpen, trip]);

  const updateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const formData = new FormData();

      // Add all the required fields
      formData.append("title", updateData.title);
      formData.append("start_date", updateData.start_date);
      formData.append("end_date", updateData.end_date);
      formData.append("group", updateData.group);
      formData.append("created_by", updateData.created_by);

      // Add cover image if a new one was selected
      if (coverImageFile) {
        formData.append("cover_image", coverImageFile);
      }

      return await pb.collection("trips").update(trip.id, formData);
    },
    onSuccess: () => {
      toast.success("Trip updated successfully!");
      onTripUpdated();
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
      setCoverImageFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setCoverImageFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Trip title cannot be empty");
      return;
    }

    if (title.trim().length < 10) {
      toast.error("Trip title must be at least 10 characters long");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    // Convert dates to the required datetime format
    const formattedStartDate = formatDateToDatetime(startDate);
    const formattedEndDate = formatDateToDatetime(endDate);

    // Validate that the formatted dates match the required regex
    if (!DATETIME_REGEX.test(formattedStartDate)) {
      toast.error("Invalid start date format");
      return;
    }

    if (!DATETIME_REGEX.test(formattedEndDate)) {
      toast.error("Invalid end date format");
      return;
    }

    // Check if anything has changed
    const hasChanges =
      title.trim() !== trip.title ||
      startDate !== formatDateTimeToDate(trip.start_date) ||
      endDate !== formatDateTimeToDate(trip.end_date) ||
      coverImageFile !== null;

    if (!hasChanges) {
      toast("No changes detected");
      return;
    }

    updateMutation.mutate({
      title: title.trim(),
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      group: trip.group,
      created_by: trip.created_by,
    });
  };

  const handleClose = () => {
    if (updateMutation.isPending) return;

    // Clean up preview URL
    if (previewUrl && coverImageFile) {
      URL.revokeObjectURL(previewUrl);
    }

    onClose();
  };

  if (!isOpen) return null;

  const hasChanges =
    title.trim() !== trip.title ||
    startDate !== formatDateTimeToDate(trip.start_date) ||
    endDate !== formatDateTimeToDate(trip.end_date) ||
    coverImageFile !== null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Edit Trip</h2>
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
              Trip Title *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Tokyo Adventure 2024"
                required
                minLength={10}
                maxLength={200}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {title.length}/200 characters (minimum 10)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={updateMutation.isPending}
                  title="Start date"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={updateMutation.isPending}
                  title="End date"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cover Image
            </label>

            {/* Current/Preview Image */}
            {previewUrl && (
              <div className="mb-4 relative">
                <img
                  src={previewUrl}
                  alt="Cover preview"
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
                {coverImageFile && (
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
                title="Cover image"
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {coverImageFile
                ? `Selected: ${coverImageFile.name}`
                : "Choose a new image to replace the current cover (optional)"}
            </div>
          </div>

          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                Changes detected:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {title.trim() !== trip.title && (
                  <li>
                    • Title: "{trip.title}" → "{title.trim()}"
                  </li>
                )}
                {startDate !== formatDateTimeToDate(trip.start_date) && (
                  <li>
                    • Start date: {formatDateTimeToDate(trip.start_date)} →{" "}
                    {startDate}
                  </li>
                )}
                {endDate !== formatDateTimeToDate(trip.end_date) && (
                  <li>
                    • End date: {formatDateTimeToDate(trip.end_date)} →{" "}
                    {endDate}
                  </li>
                )}
                {coverImageFile && <li>• Cover image will be updated</li>}
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
              {updateMutation.isPending ? "Updating..." : "Update Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
