"use client";

import React from "react";
import { X, AlertTriangle, Users, Calendar } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  message: string;
  type: "group" | "trip" | "member";
  itemCount?: {
    trips?: number;
    members?: number;
  };
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
  type,
  itemCount,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "group":
        return <Users className="w-8 h-8 text-red-500" />;
      case "trip":
        return <Calendar className="w-8 h-8 text-red-500" />;
      case "member":
        return <Users className="w-8 h-8 text-red-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  };

  const getWarnings = () => {
    if (type === "group" && itemCount) {
      const warnings = [];

      if (itemCount.trips && itemCount.trips > 0) {
        warnings.push(
          <div
            key="trips"
            className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              This group has {itemCount.trips} trip
              {itemCount.trips !== 1 ? "s" : ""}. All trips must be deleted
              first.
            </span>
          </div>
        );
      }

      if (itemCount.members && itemCount.members > 0) {
        warnings.push(
          <div
            key="members"
            className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">
              All {itemCount.members} member{itemCount.members !== 1 ? "s" : ""}{" "}
              will be removed from this group.
            </span>
          </div>
        );
      }

      return warnings;
    }

    if (type === "trip" && itemCount) {
      const warnings = [];

      warnings.push(
        <div
          key="timeline"
          className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">
            All timeline items, polls, and chat messages for this trip will also
            be deleted.
          </span>
        </div>
      );

      return warnings;
    }

    return [];
  };

  const warnings = getWarnings();
  const hasBlockingWarnings =
    type === "group" && itemCount?.trips !== undefined && itemCount.trips > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-600">{message}</p>

          {warnings.length > 0 && <div className="space-y-3">{warnings}</div>}

          {type === "group" && !hasBlockingWarnings && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h4 className="font-medium text-slate-800 mb-2">
                What will happen:
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• The group will be permanently deleted</li>
                <li>• All members will be removed from the group</li>
                <li>• The group code will become available again</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          )}

          {type === "trip" && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h4 className="font-medium text-slate-800 mb-2">
                What will happen:
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• The trip will be permanently deleted</li>
                <li>• All timeline items will be deleted</li>
                <li>• All polls and votes will be deleted</li>
                <li>• All chat messages will be deleted</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          )}

          {type === "member" && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h4 className="font-medium text-slate-800 mb-2">
                What will happen:
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• The member will be removed from the group</li>
                <li>• They will lose access to all group trips</li>
                <li>• Their votes and messages will remain</li>
                <li>• They can rejoin using the group code</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || hasBlockingWarnings}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              hasBlockingWarnings
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading
              ? "Deleting..."
              : hasBlockingWarnings
              ? "Cannot Delete"
              : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};
