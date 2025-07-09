"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Users,
  MessageCircle,
  Vote,
  List,
} from "lucide-react";
import { Timeline } from "../_components/Timeline";
import { PollSystem } from "../_components/PollSystem";
import { Chat } from "../_components/Chat";
import { format } from "date-fns";
import { createBrowserClient } from "@/lib/pocketbase";
import { TripsRecord } from "@/types/pocketbase-types";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

interface TripPageProps {
  tripId: string;
}

export default function TripPage() {
  const { id } = useParams();
  const pb = createBrowserClient();

  const [activeTab, setActiveTab] = useState<"timeline" | "polls" | "chat">(
    "timeline"
  );

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const currTrip = await pb
        .collection("trips")
        .getOne<TripsRecord>(id as string);
      return {
        ...currTrip,
        cover_image: pb.files.getURL(currTrip, currTrip.cover_image ?? ""),
      };
    },
  });

  trip;

  if (isLoading) return <div>Loading...</div>;

  // In a real app, you'd fetch the specific trip
  //   const mockTrip = {
  //     id: tripId,
  //     group: "1",
  //     title: "Tokyo Adventure 2024",
  //     start_date: "2024-03-15T00:00:00Z",
  //     end_date: "2024-03-25T00:00:00Z",
  //     cover_image:
  //       "https://images.pexels.com/photos/248195/pexels-photo-248195.jpeg?auto=compress&cs=tinysrgb&w=800",
  //     created_by: "1",
  //   };

  const startDate = new Date(trip?.start_date || "");
  const endDate = new Date(trip?.end_date || "");
  const router = useRouter();
  const handleBackToDashboard = () => {
    router.back();
  };

  const tabs = [
    { id: "timeline", label: "Timeline", icon: List },
    { id: "polls", label: "Polls", icon: Vote },
    { id: "chat", label: "Chat", icon: MessageCircle },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative h-64 rounded-2xl overflow-hidden">
        {trip?.cover_image && (
          <Image
            src={trip?.cover_image}
            alt={trip?.title ?? ""}
            className="w-full h-full object-cover"
            width={1000}
            height={1000}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <button
            onClick={handleBackToDashboard}
            className="self-start flex items-center space-x-2 text-white/90 hover:text-white bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="text-white">
            <h1 className="text-3xl font-bold mb-3">{trip?.title}</h1>
            <div className="flex items-center space-x-6 text-white/90">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {trip?.start_date && trip?.end_date ? (
                    <>
                      {format(startDate, "MMM d")} -{" "}
                      {format(endDate, "MMM d, yyyy")}
                    </>
                  ) : (
                    "Date not set"
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>{trip?.group}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        {activeTab === "timeline" && trip && <Timeline trip={trip} />}
        {activeTab === "polls" && trip && <PollSystem trip={trip} />}
        {activeTab === "chat" && trip && <Chat trip={trip} />}
      </div>
    </div>
  );
}
