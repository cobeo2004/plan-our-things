"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, Save, X, Camera, Upload, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { createBrowserClient } from "@/lib/pocketbase/client";
import Image from "next/image";
import { UsersResponse } from "@/types/pocketbase-types";

interface ProfileEditorProps {
  user: UsersResponse;
}

export default function ProfileEditor({ user }: ProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pb = createBrowserClient();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; avatar?: File }) => {
      const formData = new FormData();
      formData.append("name", data.name);

      if (data.avatar) {
        formData.append("avatar", data.avatar);
      }

      // Update user profile using PocketBase client
      const updatedUser = await pb
        .collection("users")
        .update(user.id, formData);
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setErrors({});
      setSelectedImage(null);
      setImagePreview("");

      // Invalidate relevant queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      // Force a page refresh to update the auth store
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
      console.error("Profile update error:", error);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Display name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Display name must be at least 2 characters";
    }

    // Validate image if selected
    if (selectedImage) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(selectedImage.type)) {
        newErrors.avatar =
          "Please select a valid image file (JPEG, PNG, or WebP)";
      } else if (selectedImage.size > maxSize) {
        newErrors.avatar = "Image size must be less than 5MB";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    updateProfileMutation.mutate({
      name: formData.name.trim(),
      avatar: selectedImage || undefined,
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
    });
    setSelectedImage(null);
    setImagePreview("");
    setErrors({});
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous errors
      if (errors.avatar) {
        setErrors((prev) => ({ ...prev, avatar: "" }));
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getCurrentAvatarUrl = () => {
    if (imagePreview) return imagePreview;
    if (user.avatar) return pb.files.getURL(user, user.avatar);
    return "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src={getCurrentAvatarUrl()}
                  alt={user.username}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                />
                {isEditing && (
                  <button
                    title="Change Avatar"
                    onClick={triggerFileInput}
                    className="absolute bottom-0 right-0 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                <input
                  title="Change Avatar"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">
                  {user.name || user.username}
                </h1>
                <p className="text-blue-100 text-sm">{user.email}</p>
              </div>
            </div>

            {!isEditing ? (
              <button
                title="Edit Profile"
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {updateProfileMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {updateProfileMutation.isPending ? "Saving..." : "Save"}
                  </span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                  className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Upload Section */}

          {/* Display Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Display Name
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.name
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300 bg-white/50"
                  }`}
                  placeholder="Enter your display name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  This is how your name will appear to other users.
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">{user.name || "Not set"}</span>
              </div>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700">{user.email}</span>
              <span className="ml-2 text-xs text-slate-500">
                (Cannot be changed)
              </span>
            </div>
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-lg font-medium text-slate-800 mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Account Created
                </label>
                <p className="text-sm text-slate-600">
                  {new Date(user.created).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Updated
                </label>
                <p className="text-sm text-slate-600">
                  {new Date(user.updated).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
