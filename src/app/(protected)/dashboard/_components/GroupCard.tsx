import React from "react";
import { Users, Calendar, Plus } from "lucide-react";
import { GroupsRecord } from "@/types/pocketbase-types";

interface GroupCardProps {
  group: GroupsRecord;
  tripCount: number;
  onSelect: (group: GroupsRecord) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  tripCount,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(group)}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
            {group.name}
          </h3>
          <div className="flex items-center text-sm text-slate-600 space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Group Code: {group.code}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                {tripCount} trip{tripCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
          <Users className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          Click to view trips
        </div>
        <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </div>
  );
};
