/// <reference path="../pb_data/types.d.ts" />
"use strict";

onBootstrap((e) => {
  cronAdd("_poll_watcher_", "* * * * *", () => {
    console.log("Poll watcher cron job running...");

    try {
      // Get current timestamp for comparison
      const now = new Date();

      // Find all open polls that have expired
      const expiredPolls = $app.findRecordsByFilter(
        "polls",
        `status = "open" && end_time <= "${now
          .toISOString()
          .replace("T", " ")
          .replace(/\.\d+Z$/, "Z")}"`
      );

      console.log(`Found ${expiredPolls.length} expired polls to process`);

      expiredPolls.forEach((poll) => {
        try {
          console.log(
            `Processing expired poll: ${poll.get("id")} - ${poll.get("title")}`
          );

          // Check if poll has any votes to determine if it should be "staled" or "closed"
          const pollOptions = $app.findRecordsByFilter(
            "poll_options",
            `poll = "${poll.get("id")}"`
          );

          let hasVotes = false;

          if (pollOptions.length > 0) {
            // Check if any option has votes
            for (const option of pollOptions) {
              const voteCount = $app.findRecordsByFilter(
                "poll_votes",
                `option = "${option.get("id")}"`
              ).length;

              if (voteCount > 0) {
                hasVotes = true;
                break;
              }
            }
          }

          // Set status based on whether poll has votes
          const newStatus = hasVotes ? "staled" : "closed";
          poll.set("status", newStatus);
          $app.save(poll);

          console.log(`Updated poll ${poll.get("id")} status to: ${newStatus}`);
        } catch (pollError) {
          console.error(`Error processing poll ${poll.get("id")}:`, pollError);
        }
      });
    } catch (error) {
      console.error("Error in poll watcher cron job:", error);
    }
  });

  console.log("Poll watcher cron job registered successfully");
  e.next();
});
