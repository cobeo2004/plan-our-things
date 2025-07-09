import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, MapPin, Upload } from "lucide-react";
import { GroupsRecord } from "@/types/pocketbase-types";
import toast from "react-hot-toast";
import { createBrowserClient } from "@/lib/pocketbase";
import { z } from "zod";
import { tripsSchema } from "@/lib/pocketbase/schema/zodSchema";

const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupsRecord;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  group,
}) => {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const pb = createBrowserClient();

  const createMutation = useMutation({
    mutationFn: async (tripData: z.infer<typeof tripsSchema>) => {
      const validatedTrip = await tripsSchema.safeParseAsync(tripData);
      if (!validatedTrip.success) {
        throw new Error(validatedTrip.error.message);
      }

      const formData = new FormData();
      Object.entries(validatedTrip.data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      if (coverImageFile) {
        formData.append("cover_image", coverImageFile);
      }

      return await pb.collection("trips").create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips", group.id] });
      toast.success("Trip created successfully!");
      onClose();
      setTitle("");
      setStartDate("");
      setEndDate("");
      setCoverImageFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const formatDateToDatetime = (dateString: string): string => {
    const date = new Date(dateString);
    return date
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, ".000Z");
  };

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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    createMutation.mutate({
      group: group.id,
      title,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      created_by: pb.authStore.record?.id,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Create New Trip</h2>
          <button
            title="Close the create trip modal"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trip Title
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  title="Select the start date of your trip"
                  placeholder="Select the start date of your trip"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  title="Select the end date of your trip"
                  placeholder="Select the end date of your trip"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cover Image (Optional)
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                title="Upload a cover image for your trip"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-sm file:bg-slate-100 file:text-slate-700 file:rounded-md hover:file:bg-slate-200"
              />
            </div>
            {coverImageFile && (
              <p className="text-sm text-slate-600 mt-2">
                Selected: {coverImageFile.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Creating..." : "Create Trip"}
          </button>
        </form>
      </div>
    </div>
  );
};
