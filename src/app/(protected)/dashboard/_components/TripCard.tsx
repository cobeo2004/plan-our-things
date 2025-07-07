import React from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { TripsRecord } from "@/types/pocketbase-types";
import { format } from "date-fns";

interface TripCardProps {
  trip: TripsRecord;
  onSelect: (trip: TripsRecord) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onSelect }) => {
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  console.log(trip.cover_image);
  return (
    <div
      onClick={() => onSelect(trip)}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            trip.cover_image ||
            "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800"
          }
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white text-xl font-bold mb-2 drop-shadow-lg">
            {trip.title}
          </h3>
        </div>
      </div>

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
            <span>Trip</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center"
              >
                <Users className="w-4 h-4 text-white" />
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Click to open
          </div>
        </div>
      </div>
    </div>
  );
};
