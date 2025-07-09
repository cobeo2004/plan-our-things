"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Users, Hash, RefreshCw } from "lucide-react";
import { GroupsResponse } from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { groupsSchema } from "@/lib/pocketbase/schema/zodSchema";
import toast from "react-hot-toast";
import { z } from "zod";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupsResponse;
  onGroupUpdated: () => void;
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

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  onGroupUpdated,
}) => {
  const [groupName, setGroupName] = useState(group.name);
  const [groupCode, setGroupCode] = useState(group.code);
  const [isCodeChanged, setIsCodeChanged] = useState(false);
  const pb = createBrowserClient();

  // Reset form when group changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setGroupName(group.name);
      setGroupCode(group.code);
      setIsCodeChanged(false);
    }
  }, [isOpen, group.name, group.code]);

  const updateMutation = useMutation({
    mutationFn: async (updateData: z.infer<typeof groupsSchema>) => {
      const validatedGroup = await groupsSchema.safeParseAsync(updateData);
      if (!validatedGroup.success) {
        throw new Error(validatedGroup.error.message);
      }
      return await pb
        .collection("groups")
        .update(group.id, validatedGroup.data);
    },
    onSuccess: () => {
      toast.success("Group updated successfully!");
      onGroupUpdated();
      onClose();
    },
    onError: (error: Error) => {
      if (error.message.includes("code")) {
        toast.error(
          "This group code is already taken. Please choose a different one."
        );
      } else {
        toast.error(error.message);
      }
    },
  });

  const handleRegenerateCode = () => {
    const newCode = generateGroupCode();
    setGroupCode(newCode);
    setIsCodeChanged(true);
  };

  const handleCodeChange = (value: string) => {
    setGroupCode(value.toUpperCase());
    setIsCodeChanged(value.toUpperCase() !== group.code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error("Group name cannot be empty");
      return;
    }

    if (groupName.trim().length < 10) {
      toast.error("Group name must be at least 10 characters long");
      return;
    }

    if (groupCode.length < 3) {
      toast.error("Group code must be at least 3 characters long");
      return;
    }

    // Only update if something has changed
    if (groupName.trim() === group.name && groupCode === group.code) {
      toast("No changes detected");
      return;
    }

    updateMutation.mutate({
      id: group.id,
      name: groupName.trim(),
      code: groupCode,
      created_by: group.created_by,
    });
  };

  const handleClose = () => {
    if (updateMutation.isPending) return;
    onClose();
  };

  if (!isOpen) return null;

  const hasChanges =
    groupName.trim() !== group.name || groupCode !== group.code;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Edit Group</h2>
          <button
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Group Name *
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
                minLength={10}
                maxLength={300}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {groupName.length}/300 characters (minimum 10)
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Group Code *
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={groupCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 uppercase tracking-wider"
                  placeholder="Group code"
                  required
                  minLength={3}
                  maxLength={10}
                  disabled={updateMutation.isPending}
                />
              </div>
              <button
                type="button"
                onClick={handleRegenerateCode}
                disabled={updateMutation.isPending}
                className="px-4 py-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-1"
                title="Generate new code"
              >
                <RefreshCw className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {groupCode.length}/10 characters (minimum 3)
              {isCodeChanged && (
                <span className="ml-2 text-amber-600 font-medium">
                  ⚠️ Changing the code will require members to rejoin
                </span>
              )}
            </div>
          </div>

          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                Changes detected:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {groupName.trim() !== group.name && (
                  <li>
                    • Group name: "{group.name}" → "{groupName.trim()}"
                  </li>
                )}
                {groupCode !== group.code && (
                  <li>
                    • Group code: "{group.code}" → "{groupCode}"
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex space-x-3 mt-8">
            <button
              type="button"
              onClick={handleClose}
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !hasChanges}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? "Updating..." : "Update Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
