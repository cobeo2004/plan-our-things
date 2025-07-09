"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit3, Trash2, Users, Calendar, Settings } from "lucide-react";
import {
  GroupsResponse,
  TripsResponse,
  GroupMembersResponse,
  UsersResponse,
} from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { EditGroupModal } from "./EditGroupModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import toast from "react-hot-toast";

interface GroupWithDetails extends GroupsResponse {
  trips: (TripsResponse & { cover_image?: string })[];
  members: (GroupMembersResponse & { expand: { user: UsersResponse } })[];
  memberCount: number;
  tripCount: number;
}

interface GroupManagementCardProps {
  group: GroupWithDetails;
  onSelect: (group: GroupWithDetails) => void;
  onDataChange: () => void;
}

export const GroupManagementCard: React.FC<GroupManagementCardProps> = ({
  group,
  onSelect,
  onDataChange,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const pb = createBrowserClient();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // First, we need to check if there are any trips associated with this group
      if (group.tripCount > 0) {
        throw new Error(
          "Cannot delete group with existing trips. Please delete all trips first."
        );
      }

      // Delete all group members first
      const members = await pb.collection("group_members").getFullList({
        filter: `group="${group.id}"`,
      });

      for (const member of members) {
        await pb.collection("group_members").delete(member.id);
      }

      // Finally delete the group
      return await pb.collection("groups").delete(group.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owned-groups"] });
      toast.success("Group deleted successfully!");
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

  const handleCardClick = () => {
    onSelect(group);
  };

  const handleGroupUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["owned-groups"] });
    onDataChange();
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
      >
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleEditClick}
            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            title="Edit group"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            title="Delete group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-16">
            <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
              {group.name}
            </h3>
            <div className="space-y-1">
              <div className="flex items-center text-sm text-slate-600">
                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                  Code: {group.code}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Users className="w-4 h-4 text-blue-500" />
            <span>
              {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-green-500" />
            <span>
              {group.tripCount} trip{group.tripCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Created {new Date(group.created).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-1 text-blue-600 text-sm font-medium">
            <Settings className="w-4 h-4" />
            <span>Manage</span>
          </div>
        </div>

        {/* Warning indicators */}
        {group.tripCount === 0 && (
          <div className="mt-3 flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            <Calendar className="w-3 h-3" />
            <span>No trips yet</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditGroupModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        group={group}
        onGroupUpdated={handleGroupUpdated}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteMutation.mutate}
        isLoading={deleteMutation.isPending}
        title="Delete Group"
        message={`Are you sure you want to delete "${group.name}"? This action cannot be undone.`}
        type="group"
        itemCount={{
          trips: group.tripCount,
          members: group.memberCount,
        }}
      />
    </>
  );
};
