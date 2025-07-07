import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Vote, Clock, Users } from "lucide-react";
import { TripsRecord, PollsResponse } from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { PollCard } from "./PollCard";
import { CreatePollModal } from "./CreatePollModal";

interface PollSystemProps {
  trip: TripsRecord;
}

export const PollSystem: React.FC<PollSystemProps> = ({ trip }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pb = createBrowserClient();
  const queryClient = useQueryClient();

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ["polls", trip.id],
    queryFn: () =>
      pb.collection("polls").getFullList({
        filter: `trip = "${trip.id}"`,
        sort: "-created",
      }),
  });

  // Real-time subscription for polls
  useEffect(() => {
    const unsubscribePolls = pb.collection("polls").subscribe("*", (e) => {
      // Only process polls for this trip
      if (e.record.trip === trip.id) {
        console.log("Polls update:", e);

        queryClient.setQueriesData(
          { queryKey: ["polls", trip.id] },
          (oldData: PollsResponse[]) => {
            if (!oldData) return oldData;

            if (e.action === "create") {
              // Check if poll already exists to prevent duplicates
              const exists = oldData.some((poll) => poll.id === e.record.id);
              if (exists) return oldData;

              // Add small delay to ensure poll options are created, then prefetch data
              setTimeout(() => {
                queryClient.prefetchQuery({
                  queryKey: ["poll-options", e.record.id],
                  queryFn: () =>
                    pb.collection("poll_options").getFullList({
                      filter: `poll = "${e.record.id}"`,
                      expand: "votes(option),submitted_by",
                      sort: "created",
                    }),
                });
              }, 300);

              return [e.record as PollsResponse, ...oldData];
            }

            if (e.action === "update") {
              return oldData.map((poll) =>
                poll.id === e.record.id ? { ...poll, ...e.record } : poll
              );
            }

            if (e.action === "delete") {
              return oldData.filter((poll) => poll.id !== e.record.id);
            }

            return oldData;
          }
        );
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribePolls?.then((unsub) => unsub()).catch(console.error);
    };
  }, [trip.id, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-xl p-6 border border-slate-200"
          >
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-slate-200 rounded" />
                <div className="h-10 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activePolls = polls.filter((p) => p.status === "open");
  const closedPolls = polls.filter(
    (p) => p.status === "closed" || p.status === "scheduled"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Group Polls</h3>
          <p className="text-sm text-slate-600">
            Vote on activities and decisions • Live updates
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Create Poll</span>
        </button>
      </div>

      {activePolls.length === 0 && closedPolls.length === 0 && (
        <div className="text-center py-12">
          <Vote className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-500 mb-2">
            No polls yet
          </h4>
          <p className="text-slate-400 mb-6">
            Create a poll to get group input on activities
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
          >
            Create First Poll
          </button>
        </div>
      )}

      {activePolls.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-slate-800">Active Polls</h4>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {activePolls.length}
            </span>
            <span className="text-xs text-slate-500">• Live</span>
          </div>
          {activePolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} trip={trip} />
          ))}
        </div>
      )}

      {closedPolls.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-slate-500" />
            <h4 className="font-medium text-slate-800">Past Polls</h4>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
              {closedPolls.length}
            </span>
          </div>
          {closedPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} trip={trip} />
          ))}
        </div>
      )}

      <CreatePollModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        trip={trip}
      />
    </div>
  );
};
