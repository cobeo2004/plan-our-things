"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Shield,
  User,
  Trash2,
  Crown,
  MoreVertical,
} from "lucide-react";
import {
  GroupsResponse,
  GroupMembersResponse,
  UsersResponse,
  GroupMembersRoleOptions,
} from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import toast from "react-hot-toast";

interface MembersManagementProps {
  group: GroupsResponse;
  members: (GroupMembersResponse & { expand: { user: UsersResponse } })[];
  onDataChange: () => void;
}

interface MemberWithActions extends GroupMembersResponse {
  expand: { user: UsersResponse };
  showDropdown?: boolean;
}

export const MembersManagement: React.FC<MembersManagementProps> = ({
  group,
  members,
  onDataChange,
}) => {
  const [memberToDelete, setMemberToDelete] =
    useState<MemberWithActions | null>(null);
  const [membersState, setMembersState] = useState<MemberWithActions[]>(
    members.map((member) => ({
      ...member,
      showDropdown: false,
    }))
  );

  const pb = createBrowserClient();
  const queryClient = useQueryClient();
  const currentUser = pb.authStore.record;

  // Update local state when props change
  React.useEffect(() => {
    setMembersState(
      members.map((member) => ({
        ...member,
        showDropdown: false,
      }))
    );
  }, [members]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the menu button or menu content
      const target = event.target as Element;
      if (target.closest("[data-member-menu]")) {
        return;
      }
      setMembersState((prev) =>
        prev.map((member) => ({
          ...member,
          showDropdown: false,
        }))
      );
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      newRole,
    }: {
      memberId: string;
      newRole: GroupMembersRoleOptions;
    }) => {
      return await pb.collection("group_members").update(memberId, {
        role: newRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owned-groups"] });
      toast.success("Member role updated successfully!");
      onDataChange();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await pb.collection("group_members").delete(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owned-groups"] });
      toast.success("Member removed successfully!");
      onDataChange();
      setMemberToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setMemberToDelete(null);
    },
  });

  const toggleDropdown = (memberId: string) => {
    setMembersState((prev) =>
      prev.map((member) => ({
        ...member,
        showDropdown: member.id === memberId ? !member.showDropdown : false,
      }))
    );
  };

  const handleRoleChange = (
    member: MemberWithActions,
    newRole: GroupMembersRoleOptions
  ) => {
    if (member.role === newRole) return;

    updateRoleMutation.mutate({
      memberId: member.id,
      newRole,
    });

    // Close dropdown
    toggleDropdown(member.id);
  };

  const handleRemoveMember = (member: MemberWithActions) => {
    setMemberToDelete(member);
    toggleDropdown(member.id);
  };

  const getRoleIcon = (role: GroupMembersRoleOptions) => {
    return role === "admin" ? (
      <Crown className="w-4 h-4 text-amber-500" />
    ) : (
      <User className="w-4 h-4 text-slate-500" />
    );
  };

  const getRoleBadge = (role: GroupMembersRoleOptions) => {
    return role === GroupMembersRoleOptions.admin ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        Member
      </span>
    );
  };

  const isCurrentUserOwner = group.created_by === currentUser?.id;
  const isCurrentUserAdmin = membersState.find(
    (m) => m.id === currentUser?.id && m.role === GroupMembersRoleOptions.admin
  );
  const canManageMembers = isCurrentUserOwner || isCurrentUserAdmin;

  // Sort members: owner first, then admins, then members
  const sortedMembers = [...membersState].sort((a, b) => {
    // Owner always first
    if (a.id === group.created_by) return -1;
    if (b.id === group.created_by) return 1;

    // Then by role
    if (
      a.role === GroupMembersRoleOptions.admin &&
      b.role === GroupMembersRoleOptions.member
    )
      return -1;
    if (
      a.role === GroupMembersRoleOptions.member &&
      b.role === GroupMembersRoleOptions.admin
    )
      return 1;

    // Then by join date
    return new Date(a.created).getTime() - new Date(b.created).getTime();
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Group Members ({members.length})
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Manage member roles and permissions
            </p>
          </div>
          {canManageMembers && (
            <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              Share code:{" "}
              <span className="font-mono font-medium">{group.code}</span>
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
          {sortedMembers.map((member, index) => {
            const isOwner = member.id === group.created_by;
            const isCurrentUser = member.id === currentUser?.id;
            const canModifyThisMember =
              canManageMembers && !isOwner && !isCurrentUser;

            return (
              <div
                key={member.id}
                className={`p-4 ${
                  index !== sortedMembers.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      {member.expand.user.avatar ? (
                        <img
                          src={pb.files.getURL(
                            member,
                            member.expand.user.avatar
                          )}
                          alt={
                            member.expand.user.name || member.expand.user.email
                          }
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {member.expand.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Member Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-slate-800">
                          {member.expand.user.name || member.expand.user.email}
                        </h4>
                        {isOwner && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Owner
                          </span>
                        )}
                        {!isOwner && getRoleBadge(member.role)}
                        {isCurrentUser && (
                          <span className="text-xs text-slate-500">(You)</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {member.expand.user.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        Joined {new Date(member.created).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {canModifyThisMember && (
                    <div className="relative" data-member-menu>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(member.id);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Member actions"
                        data-member-menu
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>

                      {member.showDropdown && (
                        <div
                          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-[9999]"
                          onClick={(e) => e.stopPropagation()}
                          data-member-menu
                        >
                          <div className="py-2">
                            <div className="px-3 py-3 text-xs font-medium text-slate-500 border-b border-slate-100">
                              Change Role
                            </div>
                            <button
                              onClick={() =>
                                handleRoleChange(
                                  member,
                                  GroupMembersRoleOptions.admin
                                )
                              }
                              disabled={
                                member.role === GroupMembersRoleOptions.admin ||
                                updateRoleMutation.isPending
                              }
                              className="w-full flex items-center space-x-2 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Crown className="w-4 h-4 text-amber-500" />
                              <span>Make Admin</span>
                              {member.role ===
                                GroupMembersRoleOptions.admin && (
                                <span className="ml-auto text-xs text-slate-500">
                                  Current
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleRoleChange(
                                  member,
                                  GroupMembersRoleOptions.member
                                )
                              }
                              disabled={
                                member.role ===
                                  GroupMembersRoleOptions.member ||
                                updateRoleMutation.isPending
                              }
                              className="w-full flex items-center space-x-2 px-3 py-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <User className="w-4 h-4 text-slate-500" />
                              <span>Make Member</span>
                              {member.role ===
                                GroupMembersRoleOptions.member && (
                                <span className="ml-auto text-xs text-slate-500">
                                  Current
                                </span>
                              )}
                            </button>
                            <div className="border-t border-slate-100 mt-1">
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="w-full flex items-center space-x-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remove from Group</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="p-8 text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-slate-500 font-medium mb-1">
                No members yet
              </h4>
              <p className="text-sm text-slate-400">
                Share the group code to invite members
              </p>
            </div>
          )}
        </div>

        {/* Group Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Group Information</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              • Group Code:{" "}
              <span className="font-mono font-medium">{group.code}</span>
            </p>
            <p>• Members can join using this code</p>
            <p>• Only admins and the owner can manage members</p>
            <p>
              • The group owner cannot be removed or have their role changed
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <DeleteConfirmationModal
          isOpen={!!memberToDelete}
          onClose={() => setMemberToDelete(null)}
          onConfirm={() => removeMemberMutation.mutate(memberToDelete.id)}
          isLoading={removeMemberMutation.isPending}
          title="Remove Member"
          message={`Are you sure you want to remove ${
            memberToDelete.expand.user.name || memberToDelete.expand.user.email
          } from "${group.name}"?`}
          type="member"
        />
      )}
    </>
  );
};
