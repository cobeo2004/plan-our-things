import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, Clock, Plus, Trash2, DollarSign } from "lucide-react";
import { TripsRecord } from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  pollsSchema,
  pollOptionsSchema,
} from "@/lib/pocketbase/schema/zodSchema";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripsRecord;
}

interface PollOptionInput {
  text: string;
  cost: string;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetTimeSlot, setTargetTimeSlot] = useState("");
  const [endTime, setEndTime] = useState("");
  const [options, setOptions] = useState<PollOptionInput[]>([
    { text: "", cost: "" },
    { text: "", cost: "" },
  ]);
  const pb = createBrowserClient();
  const user = pb.authStore.record;
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async ({
      pollData,
      optionsData,
    }: {
      pollData: z.infer<typeof pollsSchema>;
      optionsData: PollOptionInput[];
    }) => {
      const parsedPoll = await pollsSchema.safeParseAsync(pollData);
      if (!parsedPoll.success) {
        throw new Error(parsedPoll.error.message);
      }

      // Create the poll first
      const poll = await pb.collection("polls").create(parsedPoll.data);

      // Create poll options
      const validOptions = optionsData.filter(
        (option) => option.text.trim() !== ""
      );
      if (validOptions.length < 2) {
        throw new Error("Please provide at least 2 options");
      }

      const optionPromises = validOptions.map((option) =>
        pb.collection("poll_options").create({
          poll: poll.id,
          text: option.text.trim(),
          cost: option.cost ? parseFloat(option.cost) : undefined,
          submitted_by: user!.id,
        })
      );

      await Promise.all(optionPromises);
      return poll;
    },
    onSuccess: (newPoll) => {
      // Invalidate polls list
      queryClient.invalidateQueries({ queryKey: ["polls", trip.id] });

      // Add a small delay to ensure database operations are completed
      setTimeout(() => {
        // Immediately fetch the poll options for the new poll
        queryClient.prefetchQuery({
          queryKey: ["poll-options", newPoll.id],
          queryFn: () =>
            pb.collection("poll_options").getFullList({
              filter: `poll = "${newPoll.id}"`,
              expand: "votes(option),submitted_by",
              sort: "created",
            }),
        });

        // Also prefetch votes for the new poll
        queryClient.prefetchQuery({
          queryKey: ["poll-votes", newPoll.id],
          queryFn: async () => {
            const pollOptions = await pb
              .collection("poll_options")
              .getFullList({
                filter: `poll = "${newPoll.id}"`,
                fields: "id",
              });

            if (pollOptions.length === 0) return [];

            const optionIds = pollOptions.map((option) => option.id);
            const filterString = optionIds
              .map((id) => `option = "${id}"`)
              .join(" || ");

            return await pb.collection("poll_votes").getFullList({
              filter: `(${filterString})`,
            });
          },
        });
      }, 500); // 500ms delay to ensure data is available

      toast.success("Poll created successfully!");
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
    setTargetTimeSlot("");
    setEndTime("");
    setOptions([
      { text: "", cost: "" },
      { text: "", cost: "" },
    ]);
  };

  const addOption = () => {
    setOptions([...options, { text: "", cost: "" }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (
    index: number,
    field: keyof PollOptionInput,
    value: string
  ) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
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
    e.preventDefault();

    if (!targetTimeSlot || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const targetDate = new Date(targetTimeSlot);
    const endDate = new Date(endTime);

    if (endDate <= new Date()) {
      toast.error("End time must be in the future");
      return;
    }

    if (targetDate <= endDate) {
      toast.error("Target time should be after the poll ends");
      return;
    }

    const validOptions = options.filter((option) => option.text.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    // Validate cost fields
    for (const option of validOptions) {
      if (option.cost && isNaN(parseFloat(option.cost))) {
        toast.error("Please enter valid cost amounts");
        return;
      }
    }

    createMutation.mutate({
      pollData: {
        trip: trip.id,
        title,
        description: description || undefined,
        target_time_slot: formatTimeForBackend(targetTimeSlot),
        start_time: formatTimeForBackend(new Date().toISOString().slice(0, 16)),
        end_time: formatTimeForBackend(endTime),
        created_by: user!.id,
        status: "open",
      },
      optionsData: validOptions,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Create Poll</h2>
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
              Poll Question *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Where should we have dinner?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              rows={2}
              placeholder="Add more context..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Time Slot *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                title="Target time slot"
                type="datetime-local"
                value={targetTimeSlot}
                onChange={(e) => setTargetTimeSlot(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              When should this activity happen?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Poll End Time *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                title="Poll end time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              When should voting close?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Poll Options *
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div
                  key={index}
                  className="space-y-2 p-3 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Option {index + 1}
                    </span>
                    {options.length > 2 && (
                      <button
                        title="Remove option"
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        updateOption(index, "text", e.target.value)
                      }
                      placeholder={`Enter option ${index + 1}`}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required={index < 2}
                    />

                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={option.cost}
                        onChange={(e) =>
                          updateOption(index, "cost", e.target.value)
                        }
                        placeholder="Cost (optional)"
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addOption}
                className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Minimum 2 options required. Users can add more options later.
            </p>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? "Creating..." : "Create Poll"}
          </button>
        </form>
      </div>
    </div>
  );
};
