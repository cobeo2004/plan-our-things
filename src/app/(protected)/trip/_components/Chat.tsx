"use client";
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, User } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  ChatMessagesRecord,
  ChatMessagesResponse,
  TripsRecord,
  UsersRecord,
  UsersResponse,
} from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase/client";
import { chatMessagesSchema } from "@/lib/pocketbase/schema/zodSchema";
import z from "zod";

interface ChatProps {
  trip: TripsRecord;
}

export const Chat: React.FC<ChatProps> = ({ trip }) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pb = createBrowserClient();
  const user = pb.authStore.record;
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", trip.id],
    queryFn: async () => {
      const res = await pb
        .collection("chat_messages")
        .getFullList<ChatMessagesResponse<{ user: UsersResponse }>>({
          filter: `trip = "${trip.id}"`,
          expand: "user",
          sort: "created",
        });

      return res.map((msg) => ({
        ...msg,
        user:
          msg.expand?.user ||
          ({
            id: msg.user || "",
            name: "Unknown User",
            email: "",
            avatar: "",
          } as UsersRecord),
      }));
    },
    // refetchInterval: 2000, // Real-time chat simulation
  });

  const sendMutation = useMutation({
    mutationFn: async (schema: z.infer<typeof chatMessagesSchema>) => {
      const parsedSchema = await chatMessagesSchema.safeParseAsync(schema);
      if (!parsedSchema.success) {
        throw new Error(parsedSchema.error.message);
      }
      // Create the message with expand to get user data immediately
      return await pb.collection("chat_messages").create(parsedSchema.data, {
        expand: "user",
      });
    },
    onSuccess: (newMessage) => {
      // Add the new message directly to the cache with proper user data
      queryClient.setQueriesData(
        { queryKey: ["chat-messages", trip.id] },
        (oldData: (ChatMessagesRecord & { user: UsersRecord })[]) => {
          if (!oldData) return oldData;

          const messageWithUser = {
            ...newMessage,
            user:
              (newMessage.expand as any)?.user ||
              ({
                id: user!.id,
                name: user!.name || "You",
                email: user!.email || "",
                avatar: user!.avatar || "",
              } as UsersRecord),
          };

          return [...oldData, messageWithUser];
        }
      );
      setMessage("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    pb.collection("chat_messages").subscribe(
      "*",
      async (e) => {
        // Only process messages for this trip
        if (e.record.trip !== trip.id) return;

        queryClient.setQueriesData(
          { queryKey: ["chat-messages", trip.id] },
          (oldData: (ChatMessagesRecord & { user: UsersRecord })[]) => {
            if (!oldData) return oldData;

            if (e.action === "delete") {
              return oldData.filter((msg) => msg.id !== e.record.id);
            }

            if (e.action === "update") {
              return oldData.map((msg) => {
                if (msg.id === e.record.id) {
                  return {
                    ...msg,
                    ...e.record,
                    user: (e.record.expand as any)?.user || msg.user,
                  };
                }
                return msg;
              });
            }

            if (e.action === "create") {
              // If the expand data is missing, try to get user data
              let userData = (e.record.expand as any)?.user;

              // If no expanded user data, check if it's the current user
              if (!userData && e.record.user === user?.id) {
                userData = {
                  id: user.id,
                  name: user.name || "You",
                  email: user.email || "",
                  avatar: user.avatar || "",
                } as UsersRecord;
              }

              // If still no user data, use fallback and fetch real data
              if (!userData && e.record.user) {
                userData = {
                  id: e.record.user,
                  name: "Loading...",
                  email: "",
                  avatar: "",
                } as UsersRecord;

                // Fetch user data asynchronously and update
                pb.collection("users")
                  .getOne(e.record.user)
                  .then((fetchedUser) => {
                    queryClient.setQueriesData(
                      { queryKey: ["chat-messages", trip.id] },
                      (
                        currentData: (ChatMessagesRecord & {
                          user: UsersRecord;
                        })[]
                      ) => {
                        if (!currentData) return currentData;
                        return currentData.map((msg) => {
                          if (msg.id === e.record.id) {
                            return {
                              ...msg,
                              user: {
                                id: fetchedUser.id,
                                name: fetchedUser.name || "User",
                                email: fetchedUser.email || "",
                                avatar: fetchedUser.avatar || "",
                              } as UsersRecord,
                            };
                          }
                          return msg;
                        });
                      }
                    );
                  })
                  .catch((error) => {
                    console.error("Failed to fetch user data:", error);
                    // Update with fallback name if fetch fails
                    queryClient.setQueriesData(
                      { queryKey: ["chat-messages", trip.id] },
                      (
                        currentData: (ChatMessagesRecord & {
                          user: UsersRecord;
                        })[]
                      ) => {
                        if (!currentData) return currentData;
                        return currentData.map((msg) => {
                          if (msg.id === e.record.id) {
                            return {
                              ...msg,
                              user: {
                                id: msg.user?.id || e.record.user || "",
                                name: "Unknown User",
                                email: msg.user?.email || "",
                                avatar: msg.user?.avatar || "",
                              } as UsersRecord,
                            };
                          }
                          return msg;
                        });
                      }
                    );
                  });
              }

              // Don't add duplicate messages - check if message already exists
              const messageExists = oldData.some(
                (msg) => msg.id === e.record.id
              );
              if (messageExists) {
                return oldData;
              }

              return [
                ...oldData,
                {
                  ...e.record,
                  user: userData!,
                },
              ];
            }

            return oldData;
          }
        );
      },
      { expand: "user", filter: `trip = "${trip.id}"` }
    );

    return () => {
      pb.collection("chat_messages").unsubscribe("*");
    };
  }, [trip.id, user, queryClient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMutation.mutate({
        trip: trip.id,
        user: user!.id,
        text: message.trim(),
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Trip Chat</h3>
        <p className="text-sm text-slate-600">Real-time group conversation</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user.id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                    isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <img
                    src={
                      msg.user.avatar
                        ? pb.files.getURL(msg.user, msg.user.avatar)
                        : "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2"
                    }
                    alt={msg.user.name || "User"}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div
                    className={`flex flex-col ${
                      isOwnMessage ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-slate-600">
                        {msg.user.name || "User"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(msg.created), "HH:mm")}
                      </span>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.text as string}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Type your message..."
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || sendMutation.isPending}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
