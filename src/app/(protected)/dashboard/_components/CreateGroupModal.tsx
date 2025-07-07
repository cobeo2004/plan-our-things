import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Users, Hash } from "lucide-react";
import { createBrowserClient } from "@/lib/pocketbase";
import toast from "react-hot-toast";
import { z } from "zod";
import { groupsSchema } from "@/lib/pocketbase/schema/zodSchema";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Function to generate a random group code
const generateGroupCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const length = Math.floor(Math.random() * 8) + 3; // Random length between 3-10
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const pb = createBrowserClient();
  const queryClient = useQueryClient();

  // Auto-generate group code when component mounts or when switching to create tab
  useEffect(() => {
    if (activeTab === "create") {
      setGroupCode(generateGroupCode());
    }
  }, [activeTab]);

  const createMutation = useMutation({
    mutationFn: async (name: z.infer<typeof groupsSchema>) => {
      const validatedGroup = await groupsSchema.safeParseAsync(name);
      if (!validatedGroup.success) {
        throw new Error(validatedGroup.error.message);
      }
      return await pb.collection("groups").create(validatedGroup.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created successfully!");
      onClose();
      setGroupName("");
      setGroupCode("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const validatedGroup = await groupsSchema.safeParseAsync(code);
      if (!validatedGroup.success) {
        console.error(validatedGroup.error);
        throw new Error(validatedGroup.error.message);
      }
      return await pb.collection("groups").create(validatedGroup.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Joined group successfully!");
      onClose();
      setGroupCode("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: groupName,
      code: groupCode,
      created_by: pb.authStore.record?.id,
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate(groupCode);
  };

  const handleRegenerateCode = () => {
    setGroupCode(generateGroupCode());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "create"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Create Group
          </button>
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "join"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Join Group
          </button>
        </div>

        {activeTab === "create" ? (
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Group Name
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter group name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Group Code
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 uppercase tracking-wider"
                    placeholder="Group code"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  New
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Members will use this code to join your group
              </p>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? "Creating..." : "Create Group"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Group Code
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 uppercase tracking-wider"
                  placeholder="Enter group code"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={joinMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joinMutation.isPending ? "Joining..." : "Join Group"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
