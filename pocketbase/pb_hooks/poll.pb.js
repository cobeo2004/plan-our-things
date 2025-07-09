/// <reference path="../pb_data/types.d.ts" />
"use strict";

onRecordAfterUpdateSuccess((e) => {
  if (
    e.record.get("status") === "staled" ||
    e.record.get("status") === "closed"
  ) {
    try {
      // Get all poll options for this poll
      const pollOptions = $app.findRecordsByFilter(
        "poll_options",
        `poll = "${e.record.id}"`
      );

      if (pollOptions.length === 0) {
        console.warn(`No options found for poll ${e.record.id}`);
        return;
      }

      // Get vote counts for each option
      const optionVoteCounts = {};
      let maxVotes = 0;
      let winningOptionId = null;
      let winningOption = null;

      pollOptions.forEach((option) => {
        const voteCount = $app.findRecordsByFilter(
          "poll_votes",
          `option = "${option.id}"`
        ).length;

        optionVoteCounts[option.id] = voteCount;

        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          winningOptionId = option.id;
          winningOption = option;
        }
      });

      // If we have a winning option, create a timeline item
      if (winningOption) {
        const collection = $app.findCollectionByNameOrId("timeline_items");
        const timelineItem = new Record(collection);

        timelineItem.set("title", e.record.get("title"));
        timelineItem.set("description", e.record.get("description"));
        timelineItem.set("time", e.record.get("target_time_slot"));
        timelineItem.set("trip", e.record.get("trip"));
        timelineItem.set("cost", winningOption.get("cost"));
        timelineItem.set("created_by", e.record.get("created_by"));
        timelineItem.set("created_from_poll", true);

        // If the winning option has an image, use it
        if (winningOption.get("image")) {
          timelineItem.set("image", winningOption.get("image"));
        }

        // Append vote information to description as JSON
        const voteInfo = {
          poll_title: e.record.get("title"),
          poll_description: e.record.get("description"),
          selected_option: winningOption.get("text") || "Option",
          vote_count: maxVotes,
          poll_results: optionVoteCounts,
        };
        timelineItem.set("description", JSON.stringify(voteInfo, null, 2));

        $app.save(timelineItem);

        console.log(
          `Created timeline item from poll ${
            e.record.id
          } with winning option: ${winningOption.get("text")}`
        );
      }

      // Update poll status to scheduled
      e.record.set("status", "scheduled");
      $app.save(e.record);
    } catch (error) {
      console.error(`Error processing staled poll ${e.record.id}:`, error);
      // Fallback: just set status to closed if there's an error
      e.record.set("status", "closed");
      $app.save(e.record);
    }
  }

  e.next();
}, "polls");

// Handle poll deletion - clean up cron jobs
onRecordAfterDeleteSuccess((e) => {
  try {
    cronRemove(`_poll_job_${e.record.get("id")}`);
    console.log("Removed cron job for deleted poll", e.record.get("id"));
  } catch (error) {
    console.error(
      "Error removing cron job for deleted poll",
      e.record.get("id"),
      error
    );
  }

  e.next();
}, "polls");
