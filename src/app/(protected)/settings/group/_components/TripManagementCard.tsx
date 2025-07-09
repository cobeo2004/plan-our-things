"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit3, Trash2, Calendar, MapPin, ExternalLink } from "lucide-react";
import { TripsResponse, GroupsResponse } from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { EditTripModal } from "./EditTripModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface TripManagementCardProps {
  trip: TripsResponse & { cover_image?: string };
  group: GroupsResponse;
  onDataChange: () => void;
}

export const TripManagementCard: React.FC<TripManagementCardProps> = ({
  trip,
  group,
  onDataChange,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const pb = createBrowserClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete all related data first
      // Delete timeline items
      const timelineItems = await pb.collection("timeline_items").getFullList({
        filter: `trip="${trip.id}"`,
      });
      for (const item of timelineItems) {
        await pb.collection("timeline_items").delete(item.id);
      }

      // Delete polls and their related data
      const polls = await pb.collection("polls").getFullList({
        filter: `trip="${trip.id}"`,
      });
      for (const poll of polls) {
        // Delete poll votes
        const votes = await pb.collection("poll_votes").getFullList({
          filter: `option.poll="${poll.id}"`,
        });
        for (const vote of votes) {
          await pb.collection("poll_votes").delete(vote.id);
        }

        // Delete poll options
        const options = await pb.collection("poll_options").getFullList({
          filter: `poll="${poll.id}"`,
        });
        for (const option of options) {
          await pb.collection("poll_options").delete(option.id);
        }

        // Delete poll
        await pb.collection("polls").delete(poll.id);
      }

      // Delete chat messages
      const messages = await pb.collection("chat_messages").getFullList({
        filter: `trip="${trip.id}"`,
      });
      for (const message of messages) {
        await pb.collection("chat_messages").delete(message.id);
      }

      // Finally delete the trip
      return await pb.collection("trips").delete(trip.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owned-groups"] });
      toast.success("Trip deleted successfully!");
      onDataChange();
      setShowDeleteModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setShowDeleteModal(false);
    },
  });

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleViewTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/trip/${trip.id}`);
  };

  const handleTripUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["owned-groups"] });
    onDataChange();
  };

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const isUpcoming = startDate > new Date();
  const isOngoing = startDate <= new Date() && endDate >= new Date();
  const isPast = endDate < new Date();

  const getStatusBadge = () => {
    if (isUpcoming) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Upcoming
        </span>
      );
    } else if (isOngoing) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Ongoing
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          Completed
        </span>
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 group">
        {/* Trip Cover Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={
              trip.cover_image ||
              "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800"
            }
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Action buttons overlay */}
          <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleViewTrip}
              className="p-2 bg-white/90 text-slate-700 rounded-lg hover:bg-white transition-colors"
              title="View trip"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={handleEditClick}
              className="p-2 bg-blue-500/90 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="Edit trip"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Delete trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Status badge */}
          <div className="absolute top-4 left-4">{getStatusBadge()}</div>

          {/* Trip title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white text-lg font-bold drop-shadow-lg">
              {trip.title}
            </h3>
          </div>
        </div>

        {/* Trip Details */}
        <div className="p-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{group.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Created {new Date(trip.created).toLocaleDateString()}
            </div>
            <button
              onClick={handleViewTrip}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Open Trip</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Trip duration indicator */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center text-xs text-slate-500">
              <span>
                Duration:{" "}
                {Math.ceil(
                  (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditTripModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        trip={trip}
        group={group}
        onTripUpdated={handleTripUpdated}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteMutation.mutate}
        isLoading={deleteMutation.isPending}
        title="Delete Trip"
        message={`Are you sure you want to delete "${trip.title}"? This action cannot be undone.`}
        type="trip"
      />
    </>
  );
};
