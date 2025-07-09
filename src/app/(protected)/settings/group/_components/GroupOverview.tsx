"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, Settings, Calendar } from "lucide-react";
import { createBrowserClient } from "@/lib/pocketbase";
import {
  GroupsResponse,
  TripsResponse,
  GroupMembersResponse,
  UsersResponse,
} from "@/types/pocketbase-types";
import { GroupManagementCard } from "./GroupManagementCard";
import { TripManagementCard } from "./TripManagementCard";
import { MembersManagement } from "./MembersManagement";

interface GroupWithDetails extends GroupsResponse {
  trips: (TripsResponse & { cover_image?: string })[];
  members: (GroupMembersResponse & { expand: { user: UsersResponse } })[];
  memberCount: number;
  tripCount: number;
}

export const GroupOverview: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"trips" | "members">("trips");
  const pb = createBrowserClient();
  const user = pb.authStore.record;

  // Fetch groups owned by the current user
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["owned-groups", user?.id],
    queryFn: async () => {
      const groups = await pb.collection("groups").getFullList<GroupsResponse>({
        filter: `created_by="${user?.id}"`,
        sort: "-created",
      });

      // Fetch additional details for each group
      const groupsWithDetails: GroupWithDetails[] = await Promise.all(
        groups.map(async (group) => {
          // Fetch trips for this group
          const trips = await pb
            .collection("trips")
            .getFullList<TripsResponse>({
              filter: `group="${group.id}"`,
              sort: "-created",
            });

          // Process trip cover images
          const processedTrips = trips.map((trip) => ({
            ...trip,
            cover_image: trip.cover_image
              ? pb.files.getURL(trip, trip.cover_image)
              : "",
          })) as (TripsResponse & { cover_image?: string })[];

          // Fetch group members with user details
          const members = await pb
            .collection("group_members")
            .getFullList<
              GroupMembersResponse & { expand: { user: UsersResponse } }
            >({
              filter: `group="${group.id}"`,
              expand: "user",
              sort: "role,created",
            });

          return {
            ...group,
            trips: processedTrips,
            members,
            memberCount: members.length,
            tripCount: trips.length,
          };
        })
      );

      return groupsWithDetails;
    },
    enabled: !!user?.id,
  });

  console.log("groups", groups);
  const handleGroupSelect = (group: GroupWithDetails) => {
    setSelectedGroup(group);
    setActiveTab("trips"); // Default to trips tab
  };

  const handleBackToOverview = () => {
    setSelectedGroup(null);
  };

  const handleDataRefresh = () => {
    // Invalidate and refetch the groups data
    // This will be called after successful updates/deletions
  };

  if (groupsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-xl p-6 border border-slate-200"
            >
              <div className="space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Group Management
            </h1>
            <p className="text-slate-600 mt-1">
              Manage groups you own and their associated trips and members
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
            <Settings className="w-4 h-4" />
            <span>Owner View</span>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No groups owned yet
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              You haven't created any groups yet. Groups you own will appear
              here where you can manage trips and members.
            </p>
            <p className="text-sm text-slate-500">
              Create a group from the dashboard to get started with group
              management.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupManagementCard
                key={group.id}
                group={group}
                onSelect={handleGroupSelect}
                onDataChange={handleDataRefresh}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Selected group detail view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={handleBackToOverview}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 flex items-center space-x-1"
          >
            <span>← Back to Groups</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {selectedGroup.name}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{selectedGroup.memberCount} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{selectedGroup.tripCount} trips</span>
            </div>
            <div className="bg-slate-100 px-2 py-1 rounded text-xs">
              Code: {selectedGroup.code}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("trips")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "trips"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Trips ({selectedGroup.tripCount})
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "members"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Members ({selectedGroup.memberCount})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "trips" ? (
        <div className="space-y-4">
          {selectedGroup.trips.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-500 mb-2">
                No trips yet
              </h4>
              <p className="text-slate-400 mb-6">
                This group doesn't have any trips yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedGroup.trips.map((trip) => (
                <TripManagementCard
                  key={trip.id}
                  trip={trip}
                  group={selectedGroup}
                  onDataChange={handleDataRefresh}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <MembersManagement
          group={selectedGroup}
          members={selectedGroup.members}
          onDataChange={handleDataRefresh}
        />
      )}
    </div>
  );
};
