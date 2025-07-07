import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import {
  TripsRecord,
  UsersRecord,
  TimelineItemsResponse,
} from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { CreateTimelineItemModal } from "./CreateTimelineItemModal";

interface TimelineProps {
  trip: TripsRecord;
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
      return items.map((item) => ({
        ...item,
        image: item.image ? pb.files.getURL(item, item.image) : "",
        created_by:
          (item.expand as { created_by: UsersRecord })?.created_by?.name ??
          "Unknown User",
      }));
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
            (oldData: any[]) => {
              if (!oldData) return oldData;

              if (e.action === "create") {
                // Check if item already exists to prevent duplicates
                const exists = oldData.some((item) => item.id === e.record.id);
                if (exists) return oldData;

                // Process the new item
                const processedItem = {
                  ...e.record,
                  image: e.record.image
                    ? pb.files.getURL(e.record, e.record.image)
                    : "",
                  created_by: "Loading...", // Placeholder while we fetch user data
                };

                // Fetch user data if missing
                if (e.record.created_by) {
                  pb.collection("users")
                    .getOne(e.record.created_by)
                    .then((userData) => {
                      queryClient.setQueriesData(
                        { queryKey: ["timeline-items", trip.id] },
                        (currentData: any[]) => {
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
                        (currentData: any[]) => {
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
                  <Clock className="w-6 h-6 text-white" />
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

                  {item.description && (
                    <p className="text-slate-600 mb-3">{item.description}</p>
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
                      <span>Added by {item.created_by}</span>
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
