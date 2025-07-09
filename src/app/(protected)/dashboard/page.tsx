"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { createBrowserClient } from "@/lib/pocketbase";
import { GroupsRecord, TripsRecord } from "@/types/pocketbase-types";
import { GroupCard } from "./_components/GroupCard";
import { TripCard } from "./_components/TripCard";
import { CreateGroupModal } from "./_components/CreateGroupModal";
import { CreateTripModal } from "./_components/CreateTripModal";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [selectedGroup, setSelectedGroup] = useState<GroupsRecord | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const pb = createBrowserClient();
  const router = useRouter();

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["groups", pb.authStore.record?.id],
    queryFn: () =>
      pb.collection("groups").getFullList({
        filter: `created_by="${pb.authStore.record?.id}" || group_members_via_group.user.id="${pb.authStore.record?.id}"`,
      }),
    enabled: !!pb.authStore.record?.id,
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips", selectedGroup?.id],
    queryFn: async () => {
      const res = await pb.collection("trips").getFullList({
        filter: `group="${selectedGroup?.id}"`,
      });

      return res.map((trip) => ({
        ...trip,
        cover_image: trip.cover_image
          ? pb.files.getURL(trip, trip.cover_image)
          : undefined,
      }));
    },
    enabled: !!selectedGroup,
  });

  const handleGroupSelect = (group: GroupsRecord) => {
    setSelectedGroup(group);
  };

  const handleTripSelect = (trip: TripsRecord) => {
    router.push(`/trip/${trip.id}`);
  };

  if (groupsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 border border-slate-200"
            >
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!selectedGroup ? (
        <>
          {/* Groups Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Your Groups
                </h1>
                <p className="text-slate-600 mt-2">
                  Manage your trip planning groups
                </p>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>Create/Join Group</span>
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No groups yet
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  Create your first group or join an existing one to start
                  planning amazing trips with friends
                </p>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    tripCount={0} // This would come from a separate query in real app
                    onSelect={handleGroupSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Trips Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
                >
                  ← Back to Groups
                </button>
                <h1 className="text-3xl font-bold text-slate-800">
                  {selectedGroup.name}
                </h1>
                <p className="text-slate-600 mt-2">
                  Group Code: {selectedGroup.code}
                </p>
              </div>
              <button
                onClick={() => setShowCreateTripModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>Create Trip</span>
              </button>
            </div>

            {tripsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white rounded-xl overflow-hidden shadow-md"
                  >
                    <div className="h-48 bg-slate-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No trips yet
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  Create your first trip to start planning your next adventure
                </p>
                <button
                  onClick={() => setShowCreateTripModal(true)}
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create First Trip
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onSelect={handleTripSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
      {selectedGroup && (
        <CreateTripModal
          isOpen={showCreateTripModal}
          onClose={() => setShowCreateTripModal(false)}
          group={selectedGroup}
        />
      )}
    </div>
  );
}
