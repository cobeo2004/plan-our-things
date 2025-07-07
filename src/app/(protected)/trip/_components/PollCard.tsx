import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Plus,
  X,
  Trash2,
  DollarSign,
} from "lucide-react";
import {
  PollsRecord,
  TripsRecord,
  PollOptionsResponse,
  PollVotesResponse,
  UsersResponse,
} from "@/types/pocketbase-types";
import { createBrowserClient } from "@/lib/pocketbase";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { z } from "zod";
import { pollOptionsSchema } from "@/lib/pocketbase/schema/zodSchema";

interface PollCardProps {
  poll: PollsRecord;
  trip: TripsRecord;
}

type PollOptionWithUser = PollOptionsResponse<{
  submitted_by: UsersResponse;
}>;

export const PollCard: React.FC<PollCardProps> = ({ poll, trip }) => {
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [newOptionCost, setNewOptionCost] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const pb = createBrowserClient();
  const user = pb.authStore.record;
  const queryClient = useQueryClient();

  const { data: options = [] } = useQuery({
    queryKey: ["poll-options", poll.id],
    queryFn: () =>
      pb.collection("poll_options").getFullList<PollOptionWithUser>({
        filter: `poll = "${poll.id}"`,
        expand: "votes(option),submitted_by",
        sort: "created",
      }),
    staleTime: 0,
    refetchOnMount: true,
  });

  // Get votes for this poll by filtering for options that belong to this poll
  const { data: votes = [], refetch: refetchVotes } = useQuery({
    queryKey: ["poll-votes", poll.id],
    queryFn: async () => {
      // First get all option IDs for this poll
      const pollOptions = await pb.collection("poll_options").getFullList({
        filter: `poll = "${poll.id}"`,
        fields: "id",
      });

      if (pollOptions.length === 0) return [];

      const optionIds = pollOptions.map((option) => option.id);

      // Then get votes for these options using the correct filter syntax
      const filterString = optionIds
        .map((id) => `option = "${id}"`)
        .join(" || ");

      return await pb.collection("poll_votes").getFullList<PollVotesResponse>({
        filter: `(${filterString})`,
      });
    },
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Refetch data when component first mounts to ensure we have the latest data
  useEffect(() => {
    // Small delay to ensure any pending writes are completed
    const timeout = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["poll-options", poll.id] });
      refetchVotes();
    }, 100);

    return () => clearTimeout(timeout);
  }, [poll.id, queryClient, refetchVotes]);

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to poll options changes
    const unsubscribeOptions = pb.collection("poll_options").subscribe(
      "*",
      (e) => {
        // Only process options for this poll
        if (e.record.poll === poll.id) {
          console.log("Poll options update:", e);
          setIsUpdating(true);

          queryClient.setQueriesData(
            { queryKey: ["poll-options", poll.id] },
            (oldData: PollOptionWithUser[]) => {
              if (!oldData) return oldData;

              if (e.action === "create") {
                // Check if option already exists to prevent duplicates
                const exists = oldData.some((opt) => opt.id === e.record.id);
                if (exists) return oldData;

                // Add the new option (expand data might be missing, fetch it if needed)
                const newOption = {
                  ...e.record,
                  expand: (e.record.expand as any) || {},
                } as PollOptionWithUser;

                // Fetch user data if missing
                if (!newOption.expand?.submitted_by && e.record.submitted_by) {
                  pb.collection("users")
                    .getOne(e.record.submitted_by)
                    .then((userData) => {
                      queryClient.setQueriesData(
                        { queryKey: ["poll-options", poll.id] },
                        (currentData: PollOptionWithUser[]) => {
                          if (!currentData) return currentData;
                          return currentData.map((opt) => {
                            if (opt.id === e.record.id) {
                              return {
                                ...opt,
                                expand: {
                                  ...opt.expand,
                                  submitted_by: userData as UsersResponse,
                                },
                              };
                            }
                            return opt;
                          });
                        }
                      );
                    })
                    .catch(console.error);
                }

                return [...oldData, newOption].sort(
                  (a, b) =>
                    new Date(a.created).getTime() -
                    new Date(b.created).getTime()
                );
              }

              if (e.action === "update") {
                return oldData.map((opt) =>
                  opt.id === e.record.id
                    ? {
                        ...opt,
                        ...e.record,
                        expand: (e.record.expand as any) || opt.expand,
                      }
                    : opt
                );
              }

              if (e.action === "delete") {
                return oldData.filter((opt) => opt.id !== e.record.id);
              }

              return oldData;
            }
          );

          // Clear updating indicator after a short delay
          setTimeout(() => setIsUpdating(false), 1000);
        }
      },
      { expand: "submitted_by" }
    );

    // Subscribe to poll votes changes
    const unsubscribeVotes = pb
      .collection("poll_votes")
      .subscribe("*", async (e) => {
        // Check if this vote belongs to this poll
        if (e.record.option) {
          try {
            const option = await pb
              .collection("poll_options")
              .getOne(e.record.option);
            if (option.poll === poll.id) {
              console.log("Poll votes update:", e);
              setIsUpdating(true);

              queryClient.setQueriesData(
                { queryKey: ["poll-votes", poll.id] },
                (oldData: PollVotesResponse[]) => {
                  if (!oldData) return oldData;

                  if (e.action === "create") {
                    // Check if vote already exists
                    const exists = oldData.some(
                      (vote) => vote.id === e.record.id
                    );
                    if (exists) return oldData;
                    return [...oldData, e.record as PollVotesResponse];
                  }

                  if (e.action === "update") {
                    return oldData.map((vote) =>
                      vote.id === e.record.id ? { ...vote, ...e.record } : vote
                    );
                  }

                  if (e.action === "delete") {
                    return oldData.filter((vote) => vote.id !== e.record.id);
                  }

                  return oldData;
                }
              );

              // Clear updating indicator after a short delay
              setTimeout(() => setIsUpdating(false), 1000);
            }
          } catch (error) {
            console.error("Error checking vote option:", error);
          }
        }
      });

    // Subscribe to poll status changes
    const unsubscribePolls = pb.collection("polls").subscribe(poll.id, (e) => {
      console.log("Poll update:", e);
      if (e.action === "update") {
        setIsUpdating(true);
        // Invalidate poll data in parent component
        queryClient.invalidateQueries({ queryKey: ["polls", trip.id] });
        setTimeout(() => setIsUpdating(false), 1000);
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeOptions?.then((unsub) => unsub()).catch(console.error);
      unsubscribeVotes?.then((unsub) => unsub()).catch(console.error);
      unsubscribePolls?.then((unsub) => unsub()).catch(console.error);
    };
  }, [poll.id, trip.id, queryClient]);

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      return await pb.collection("poll_votes").create({
        poll: poll.id!,
        option: optionId,
        user: user!.id,
        voted_at: new Date().toISOString(),
      });
    },
    onMutate: async (optionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["poll-votes", poll.id] });

      // Snapshot the previous value
      const previousVotes = queryClient.getQueryData(["poll-votes", poll.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["poll-votes", poll.id],
        (old: PollVotesResponse[]) => {
          if (!old) return old;
          const optimisticVote = {
            id: `temp-${Date.now()}`,
            option: optionId,
            user: user!.id,
            voted_at: new Date().toISOString(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          } as PollVotesResponse;
          return [...old, optimisticVote];
        }
      );

      // Return a context object with the snapshotted value
      return { previousVotes };
    },
    onError: (err, optionId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["poll-votes", poll.id], context?.previousVotes);
      toast.error("Failed to submit vote");
    },
    onSuccess: () => {
      toast.success("Vote submitted successfully!");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have correct data
      queryClient.invalidateQueries({ queryKey: ["poll-votes", poll.id] });
    },
  });

  const removeVoteMutation = useMutation({
    mutationFn: async (voteId: string) => {
      return await pb.collection("poll_votes").delete(voteId);
    },
    onMutate: async (voteId) => {
      await queryClient.cancelQueries({ queryKey: ["poll-votes", poll.id] });
      const previousVotes = queryClient.getQueryData(["poll-votes", poll.id]);

      // Optimistically remove the vote
      queryClient.setQueryData(
        ["poll-votes", poll.id],
        (old: PollVotesResponse[]) => {
          if (!old) return old;
          return old.filter((vote) => vote.id !== voteId);
        }
      );

      return { previousVotes };
    },
    onError: (err, voteId, context) => {
      queryClient.setQueryData(["poll-votes", poll.id], context?.previousVotes);
      toast.error("Failed to remove vote");
    },
    onSuccess: () => {
      toast.success("Vote removed successfully!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["poll-votes", poll.id] });
    },
  });

  const addOptionMutation = useMutation({
    mutationFn: async (optionData: z.infer<typeof pollOptionsSchema>) => {
      const parsedOption = await pollOptionsSchema.safeParseAsync(optionData);
      if (!parsedOption.success) {
        throw new Error(parsedOption.error.message);
      }
      return await pb.collection("poll_options").create(parsedOption.data);
    },
    onMutate: async (optionData) => {
      await queryClient.cancelQueries({ queryKey: ["poll-options", poll.id] });
      const previousOptions = queryClient.getQueryData([
        "poll-options",
        poll.id,
      ]);

      // Optimistically add the new option
      queryClient.setQueryData(
        ["poll-options", poll.id],
        (old: PollOptionWithUser[]) => {
          if (!old) return old;
          const optimisticOption = {
            id: `temp-${Date.now()}`,
            poll: poll.id,
            text: optionData.text,
            cost: optionData.cost,
            submitted_by: user!.id,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            expand: {
              submitted_by: {
                id: user!.id,
                name: user!.name || "You",
                email: user!.email || "",
                avatar: user!.avatar || "",
              } as UsersResponse,
            },
          } as PollOptionWithUser;
          return [...old, optimisticOption].sort(
            (a, b) =>
              new Date(a.created).getTime() - new Date(b.created).getTime()
          );
        }
      );

      return { previousOptions };
    },
    onError: (err, optionData, context) => {
      queryClient.setQueryData(
        ["poll-options", poll.id],
        context?.previousOptions
      );
      toast.error("Failed to add option");
    },
    onSuccess: () => {
      toast.success("Option added successfully!");
      setNewOptionText("");
      setNewOptionCost("");
      setShowAddOption(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["poll-options", poll.id] });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      return await pb.collection("poll_options").delete(optionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poll-options", poll.id] });
      queryClient.invalidateQueries({ queryKey: ["poll-votes", poll.id] });
      toast.success("Option deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleVote = (optionId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    // Check if user has already voted
    const existingVote = votes.find((vote) => vote.user === user.id);
    if (existingVote) {
      // If user voted for the same option, remove the vote
      if (existingVote.option === optionId) {
        removeVoteMutation.mutate(existingVote.id);
        return;
      } else {
        toast.error(
          "You have already voted. Click your current vote to change it."
        );
        return;
      }
    }

    voteMutation.mutate(optionId);
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionText.trim()) {
      toast.error("Please enter an option text");
      return;
    }
    if (!user) {
      toast.error("Please log in to add options");
      return;
    }

    // Validate cost if provided
    if (newOptionCost && isNaN(parseFloat(newOptionCost))) {
      toast.error("Please enter a valid cost amount");
      return;
    }

    addOptionMutation.mutate({
      poll: poll.id,
      text: newOptionText.trim(),
      cost: newOptionCost ? parseFloat(newOptionCost) : undefined,
      submitted_by: user.id,
    });
  };

  const handleDeleteOption = (optionId: string, submittedBy: string) => {
    if (!user) {
      toast.error("Please log in to delete options");
      return;
    }

    // Only allow deleting own options or if user is poll creator
    if (submittedBy !== user.id && poll.created_by !== user.id) {
      toast.error("You can only delete options you created");
      return;
    }

    // Check if this option has votes
    const optionVotes = votes.filter((vote) => vote.option === optionId);
    if (optionVotes.length > 0) {
      if (
        !confirm(
          `This option has ${optionVotes.length} vote(s). Are you sure you want to delete it?`
        )
      ) {
        return;
      }
    }

    deleteOptionMutation.mutate(optionId);
  };

  const isActive = poll.status === "open";
  const endTime = new Date(poll.end_time);
  const isExpired = endTime < new Date();

  // Get votes count for each option
  const getVotesForOption = (optionId: string) => {
    return votes.filter((vote) => vote.option === optionId);
  };

  const totalVotes = votes.length;

  // Check if current user has voted
  const userVote = votes.find((vote) => vote.user === user?.id);
  const userVotedOption = userVote
    ? options.find((option) => option.id === userVote.option)
    : null;

  // Debug logging
  //   console.log("Poll votes:", votes);
  //   console.log("Current user:", user?.id);
  //   console.log("User vote:", userVote);
  //   console.log("User voted option:", userVotedOption)

  return (
    <div
      className={`bg-white rounded-xl p-6 border transition-all duration-200 ${
        isActive ? "border-green-200 shadow-md" : "border-slate-200 shadow-sm"
      } ${isUpdating ? "ring-2 ring-blue-200 ring-opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-lg font-semibold text-slate-800">
              {poll.title}
            </h4>
            {isUpdating && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600 font-medium">Live</span>
              </div>
            )}
          </div>
          {poll.description && (
            <p className="text-slate-600 mb-3">{poll.description}</p>
          )}

          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                Target:{" "}
                {format(new Date(poll.target_time_slot), "MMM d, h:mm a")}
              </span>
            </div>
            {isActive && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>
                  {isExpired
                    ? "Expired"
                    : `Ends ${formatDistanceToNow(endTime, {
                        addSuffix: true,
                      })}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isActive
              ? "Active"
              : poll.status === "scheduled"
              ? "Scheduled"
              : "Closed"}
          </div>
          {isActive && (
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
              title="Real-time updates enabled"
            ></div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const optionVotes = getVotesForOption(option.id);
          const voteCount = optionVotes.length;
          const percentage =
            totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isWinning =
            voteCount > 0 &&
            voteCount ===
              Math.max(...options.map((o) => getVotesForOption(o.id).length));
          const hasUserVoted = optionVotes.some(
            (vote) => vote.user === user?.id
          );

          return (
            <div key={option.id} className="relative group">
              <button
                onClick={() => isActive && !isExpired && handleVote(option.id)}
                disabled={
                  !isActive ||
                  isExpired ||
                  voteMutation.isPending ||
                  removeVoteMutation.isPending
                }
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  hasUserVoted
                    ? "border-blue-500 bg-blue-50 cursor-pointer"
                    : isActive && !isExpired
                    ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    : "border-slate-200 cursor-default"
                } ${
                  !isActive && isWinning ? "border-green-500 bg-green-50" : ""
                }`}
                title={
                  hasUserVoted
                    ? "Click to change your vote"
                    : isActive && !isExpired
                    ? "Click to vote"
                    : ""
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-slate-800">
                      {option.text}
                    </span>
                    {option.cost && (
                      <span className="flex items-center space-x-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <DollarSign className="w-3 h-3" />
                        <span>{option.cost}</span>
                      </span>
                    )}
                    {hasUserVoted && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                    {!isActive && isWinning && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    {voteCount} vote{voteCount !== 1 ? "s" : ""} (
                    {percentage.toFixed(0)}%)
                  </div>
                </div>

                {/* Show who submitted the option */}
                {option.expand?.submitted_by && (
                  <div className="text-xs text-slate-500 mb-2">
                    Suggested by{" "}
                    {option.expand.submitted_by.name || "Anonymous"}
                  </div>
                )}

                {/* Vote progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isWinning && !isActive
                        ? "bg-green-500"
                        : hasUserVoted
                        ? "bg-blue-500"
                        : "bg-slate-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>

              {/* Delete button - only show for options the user can delete */}
              {isActive &&
                !isExpired &&
                user &&
                (option.submitted_by === user.id ||
                  poll.created_by === user.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOption(option.id, option.submitted_by || "");
                    }}
                    disabled={deleteOptionMutation.isPending}
                    className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Delete this option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
            </div>
          );
        })}

        {/* Add Option Form */}
        {isActive && !isExpired && (
          <div className="border-t border-slate-200 pt-3">
            {!showAddOption ? (
              <button
                onClick={() => setShowAddOption(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            ) : (
              <form onSubmit={handleAddOption} className="space-y-3">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Enter new option..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    autoFocus
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newOptionCost}
                      onChange={(e) => setNewOptionCost(e.target.value)}
                      placeholder="Cost (optional)"
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={addOptionMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                  >
                    {addOptionMutation.isPending ? "Adding..." : "Add"}
                  </button>
                  <button
                    title="Close"
                    type="button"
                    onClick={() => {
                      setShowAddOption(false);
                      setNewOptionText("");
                      setNewOptionCost("");
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
            </span>
          </div>
          {userVotedOption && (
            <div className="text-blue-600 font-medium">
              You voted for: {userVotedOption.text}
              {userVotedOption.cost && (
                <span className="text-green-600 ml-1">
                  (${userVotedOption.cost})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Help text for active polls */}
        {isActive && !isExpired && (
          <div className="mt-2 text-xs text-slate-400">
            {userVotedOption
              ? "Click your vote to change it, or add more options for others to vote on"
              : "Click any option to vote, or add your own option below"}
          </div>
        )}
      </div>
    </div>
  );
};
