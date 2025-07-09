import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, DollarSign, User, Trophy, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import {
  TripsRecord,
  UsersRecord,
  TimelineItemsResponse,
  PollOptionsResponse,
} from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { CreateTimelineItemModal } from "./CreateTimelineItemModal";

interface TimelineProps {
  trip: TripsRecord;
}

interface PollData {
  poll_title: string;
  poll_description: string;
  selected_option: string;
  vote_count: number;
  poll_results: Record<string, number>;
}

interface ProcessedTimelineItem extends TimelineItemsResponse {
  created_by: string;
  image: string;
  poll_data?: PollData;
  poll_options?: Record<string, PollOptionsResponse>;
}

export const Timeline: React.FC<TimelineProps> = ({ trip }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const pb = createBrowserClient();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["timeline-items", trip.id],
    queryFn: async () => {
      const items = await pb.collection("timeline_items").getFullList({
        filter: `trip="${trip.id}"`,
        expand: "created_by",
        sort: "time",
      });

      const processedItems: ProcessedTimelineItem[] = [];

      for (const item of items) {
        let pollData: PollData | undefined;
        let pollOptions: Record<string, PollOptionsResponse> | undefined;

        // Check if this item was created from a poll and has poll data
        if (item.created_from_poll && item.description) {
          try {
            // Try to parse the description as JSON poll data
            const parsed = JSON.parse(item.description);
            if (
              parsed.poll_title &&
              parsed.poll_results &&
              parsed.selected_option
            ) {
              pollData = parsed as PollData;

              // Fetch poll option details for better display
              const optionIds = Object.keys(pollData.poll_results);
              if (optionIds.length > 0) {
                try {
                  const optionsFilter = optionIds
                    .map((id) => `id="${id}"`)
                    .join(" || ");
                  const options = await pb
                    .collection("poll_options")
                    .getFullList({
                      filter: `(${optionsFilter})`,
                    });

                  pollOptions = {};
                  options.forEach((option) => {
                    pollOptions![option.id] = option;
                  });
                } catch (error) {
                  console.warn("Failed to fetch poll options:", error);
                }
              }
            }
          } catch (error) {
            console.warn(
              "Failed to parse poll data from timeline item:",
              error
            );
          }
        }

        processedItems.push({
          ...item,
          image: item.image ? pb.files.getURL(item, item.image) : "",
          created_by:
            (item.expand as { created_by: UsersRecord })?.created_by?.name ??
            "Unknown User",
          poll_data: pollData,
          poll_options: pollOptions,
        });
      }

      return processedItems;
    },
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Real-time subscription for timeline items
  useEffect(() => {
    const unsubscribeTimeline = pb.collection("timeline_items").subscribe(
      "*",
      async (e) => {
        // Only process timeline items for this trip
        if (e.record.trip === trip.id) {
          console.log("Timeline update:", e);
          setIsUpdating(true);

          queryClient.setQueriesData(
            { queryKey: ["timeline-items", trip.id] },
            (oldData: ProcessedTimelineItem[]) => {
              if (!oldData) return oldData;

              if (e.action === "create") {
                // Check if item already exists to prevent duplicates
                const exists = oldData.some((item) => item.id === e.record.id);
                if (exists) return oldData;

                // Process the new item (simplified for real-time updates)
                const processedItem: ProcessedTimelineItem = {
                  ...e.record,
                  image: e.record.image
                    ? pb.files.getURL(e.record, e.record.image)
                    : "",
                  created_by: "Loading...", // Placeholder while we fetch user data
                };

                // Try to parse poll data if available
                if (e.record.created_from_poll && e.record.description) {
                  try {
                    const parsed = JSON.parse(e.record.description);
                    if (
                      parsed.poll_title &&
                      parsed.poll_results &&
                      parsed.selected_option
                    ) {
                      processedItem.poll_data = parsed as PollData;
                    }
                  } catch (error) {
                    console.warn(
                      "Failed to parse poll data in real-time update:",
                      error
                    );
                  }
                }

                // Fetch user data if missing
                if (e.record.created_by) {
                  pb.collection("users")
                    .getOne(e.record.created_by)
                    .then((userData) => {
                      queryClient.setQueriesData(
                        { queryKey: ["timeline-items", trip.id] },
                        (currentData: ProcessedTimelineItem[]) => {
                          if (!currentData) return currentData;
                          return currentData.map((item) => {
                            if (item.id === e.record.id) {
                              return {
                                ...item,
                                created_by: userData.name || "Unknown User",
                              };
                            }
                            return item;
                          });
                        }
                      );
                    })
                    .catch((error) => {
                      console.error("Failed to fetch user data:", error);
                      // Update with fallback name if fetch fails
                      queryClient.setQueriesData(
                        { queryKey: ["timeline-items", trip.id] },
                        (currentData: ProcessedTimelineItem[]) => {
                          if (!currentData) return currentData;
                          return currentData.map((item) => {
                            if (item.id === e.record.id) {
                              return {
                                ...item,
                                created_by: "Unknown User",
                              };
                            }
                            return item;
                          });
                        }
                      );
                    });
                }

                return [...oldData, processedItem].sort(
                  (a, b) =>
                    new Date(a.time).getTime() - new Date(b.time).getTime()
                );
              }

              if (e.action === "update") {
                return oldData
                  .map((item) =>
                    item.id === e.record.id
                      ? {
                          ...item,
                          ...e.record,
                          image: e.record.image
                            ? pb.files.getURL(e.record, e.record.image)
                            : "",
                          created_by: item.created_by, // Keep existing created_by data
                        }
                      : item
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.time).getTime() - new Date(b.time).getTime()
                  );
              }

              if (e.action === "delete") {
                return oldData.filter((item) => item.id !== e.record.id);
              }

              return oldData;
            }
          );

          // Clear updating indicator after a short delay
          setTimeout(() => setIsUpdating(false), 1000);
        }
      },
      { expand: "created_by" }
    );

    // Cleanup subscription
    return () => {
      unsubscribeTimeline?.then((unsub) => unsub()).catch(console.error);
    };
  }, [trip.id, queryClient, pb]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sortedItems = [...items].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const renderPollResults = (item: ProcessedTimelineItem) => {
    if (!item.poll_data) return null;

    const { poll_data, poll_options } = item;
    const totalVotes = Object.values(poll_data.poll_results).reduce(
      (sum, votes) => sum + votes,
      0
    );

    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h5 className="font-semibold text-slate-800">
            Poll Results: {poll_data.poll_title}
          </h5>
        </div>

        {poll_data.poll_description && (
          <p className="text-slate-600 text-sm mb-3">
            {poll_data.poll_description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {Object.entries(poll_data.poll_results).map(([optionId, votes]) => {
            const option = poll_options?.[optionId];
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            const isWinner =
              poll_data.selected_option === (option?.text || optionId);

            return (
              <div
                key={optionId}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isWinner
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-medium ${
                        isWinner ? "text-green-800" : "text-slate-800"
                      }`}
                    >
                      {option?.text || `Option ${optionId.slice(-4)}`}
                    </span>
                    {isWinner && <Trophy className="w-4 h-4 text-green-600" />}
                    {option?.cost && (
                      <span className="flex items-center space-x-1 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        <DollarSign className="w-3 h-3" />
                        <span>{option.cost}</span>
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      isWinner ? "text-green-700" : "text-slate-600"
                    }`}
                  >
                    {votes} vote{votes !== 1 ? "s" : ""} (
                    {percentage.toFixed(0)}%)
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isWinner ? "bg-green-500" : "bg-slate-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-slate-600">
            <BarChart3 className="w-4 h-4" />
            <span>
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-green-700 font-medium">
            <Trophy className="w-4 h-4" />
            <span>Winner: {poll_data.selected_option}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-slate-800">Timeline</h3>
          {isUpdating && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600 font-medium">Live</span>
            </div>
          )}
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
            title="Real-time updates enabled"
          ></div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {sortedItems.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-500 mb-2">
            No timeline items yet
          </h4>
          <p className="text-slate-400 mb-6">
            Add your first activity to start building your trip timeline
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-600" />

          <div className="space-y-6">
            {sortedItems.map((item, index) => (
              <div
                key={item.id}
                className="relative flex items-start space-x-4 group"
              >
                {/* Timeline dot */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-200 ${
                    item.created_from_poll
                      ? "bg-gradient-to-r from-green-500 to-blue-600"
                      : "bg-gradient-to-r from-blue-500 to-purple-600"
                  } ${
                    isUpdating ? "ring-2 ring-blue-200 ring-opacity-50" : ""
                  }`}
                >
                  {item.created_from_poll ? (
                    <Trophy className="w-6 h-6 text-white" />
                  ) : (
                    <Clock className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 ${
                    isUpdating ? "ring-1 ring-blue-200" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(item.time), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        {item.cost !== null && item.cost !== undefined && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>${item.cost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {item.created_from_poll && (
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        From Poll
                      </div>
                    )}
                  </div>

                  {/* Show poll results for poll-based items */}
                  {item.created_from_poll && item.poll_data
                    ? renderPollResults(item)
                    : // Show regular description for non-poll items
                      item.description &&
                      !item.created_from_poll && (
                        <p className="text-slate-600 mb-3">
                          {item.description}
                        </p>
                      )}

                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <User className="w-4 h-4" />
                      <span>Created by {item.created_by}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateTimelineItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        trip={trip}
      />
    </div>
  );
};
