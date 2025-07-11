/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Update users collection indexes
    const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_");
    unmarshal(
      {
        indexes: [
          "CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)",
          "CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''",
          "CREATE INDEX `idx_name_users` ON `users` (`name`);",
          "CREATE INDEX `idx_created_users` ON `users` (`created`);",
        ],
      },
      usersCollection
    );

    // Update groups collection indexes
    const groupsCollection = app.findCollectionByNameOrId("pbc_3346940990");
    unmarshal(
      {
        indexes: [
          "CREATE UNIQUE INDEX `idx_x2nunTQWXd` ON `groups` (`code`)",
          "CREATE INDEX `idx_oC5LqtaFy2` ON `groups` (`name`)",
          "CREATE INDEX `idx_z6ldLvwCDL` ON `groups` (`created_by`)",
          "CREATE INDEX `idx_vcrkbDSIOx` ON `groups` (`created`)",
        ],
      },
      groupsCollection
    );

    // Update group_members collection indexes
    const groupMembersCollection =
      app.findCollectionByNameOrId("pbc_714390402");
    unmarshal(
      {
        indexes: [
          "CREATE UNIQUE INDEX `idx_XrmwCPdyzh` ON `group_members` (\n  `group`,\n  `user`\n)",
          "CREATE INDEX `idx_QGpEZOf0NN` ON `group_members` (`user`)",
          "CREATE INDEX `idx_wsY6gPOLTB` ON `group_members` (`group`)",
          "CREATE INDEX `idx_2VMbPcZix0` ON `group_members` (`role`)",
          "CREATE INDEX `idx_RAhU4jvFT8` ON `group_members` (\n  `user`,\n  `group`,\n  `role`\n)",
          "CREATE INDEX `idx_EjS8bZC0RA` ON `group_members` (\n  `group`,\n  `role`\n)",
          "CREATE INDEX `idx_aFMAkWoDo0` ON `group_members` (`created`)",
        ],
      },
      groupMembersCollection
    );

    // Update trips collection indexes
    const tripsCollection = app.findCollectionByNameOrId("pbc_1630916145");
    unmarshal(
      {
        indexes: [
          "CREATE INDEX `idx_XBLk8HHTgp` ON `trips` (`group`)",
          "CREATE INDEX `idx_x8WJJQ4Ed5` ON `trips` (`created_by`)",
          "CREATE INDEX `idx_vB2wv7vBMm` ON `trips` (`start_date`)",
          "CREATE INDEX `idx_dTI9fCQ6S1` ON `trips` (`end_date`)",
          "CREATE INDEX `idx_LUkCf1X9MN` ON `trips` (\n  `group`,\n  `start_date`\n)",
          "CREATE INDEX `idx_HOk8rC4ZdZ` ON `trips` (\n  `group`,\n  `created_by`\n)",
          "CREATE INDEX `idx_K9DejwdQvQ` ON `trips` (`title`)",
          "CREATE INDEX `idx_EKM6JQ9UO8` ON `trips` (`created`)",
        ],
      },
      tripsCollection
    );

    // Update timeline_items collection indexes
    const timelineItemsCollection =
      app.findCollectionByNameOrId("pbc_3868922268");
    unmarshal(
      {
        indexes: [
          "CREATE INDEX `idx_0zUucZBTi9` ON `timeline_items` (`trip`)",
          "CREATE INDEX `idx_clcWa2beXP` ON `timeline_items` (`created_by`)",
          "CREATE INDEX `idx_dVmII2p1da` ON `timeline_items` (`time`)",
          "CREATE INDEX `idx_itOaEWAtlx` ON `timeline_items` (`created_from_poll`)",
          "CREATE INDEX `idx_tkNX4BHSsD` ON `timeline_items` (\n  `trip`,\n  `time`\n)",
          "CREATE INDEX `idx_ArsAOi1kyU` ON `timeline_items` (\n  `trip`,\n  `created_by`\n)",
          "CREATE INDEX `idx_dr3acSC71r` ON `timeline_items` (\n  `trip`,\n  `created_from_poll`\n)",
          "CREATE INDEX `idx_kjUH67tu0g` ON `timeline_items` (`title`)",
          "CREATE INDEX `idx_to3iME6yMt` ON `timeline_items` (`cost`)",
          "CREATE INDEX `idx_w5xfuImun7` ON `timeline_items` (`created`)",
        ],
      },
      timelineItemsCollection
    );

    // Update polls collection indexes
    const pollsCollection = app.findCollectionByNameOrId("pbc_3598350341");
    unmarshal(
      {
        indexes: [
          "CREATE INDEX `idx_kjIW4S61YR` ON `polls` (`trip`)",
          "CREATE INDEX `idx_msEyyWYvM3` ON `polls` (`created_by`)",
          "CREATE INDEX `idx_5YUja41SSc` ON `polls` (`status`)",
          "CREATE INDEX `idx_XhSyfBvnw5` ON `polls` (`start_time`)",
          "CREATE INDEX `idx_6fe2CT2y2a` ON `polls` (`end_time`)",
          "CREATE INDEX `idx_u0zkAiEtqU` ON `polls` (`target_time_slot`)",
          "CREATE INDEX `idx_funiK9h5eh` ON `polls` (\n  `trip`,\n  `status`\n)",
          "CREATE INDEX `idx_rr1730CVTh` ON `polls` (\n  `trip`,\n  `created_by`\n)",
          "CREATE INDEX `idx_9HKWhly1wP` ON `polls` (\n  `status`,\n  `end_time`\n)",
          "CREATE INDEX `idx_hu9Usz0nvG` ON `polls` (`title`)",
          "CREATE INDEX `idx_TNuMLG3ToN` ON `polls` (`created`)",
        ],
      },
      pollsCollection
    );

    // Update poll_options collection indexes
    const pollOptionsCollection =
      app.findCollectionByNameOrId("pbc_2079863742");
    unmarshal(
      {
        indexes: [
          "CREATE INDEX `idx_Qz7HPsFwAe` ON `poll_options` (`poll`)",
          "CREATE INDEX `idx_kGdsWSLqZI` ON `poll_options` (`submitted_by`)",
          "CREATE INDEX `idx_xfh7YO6Kpy` ON `poll_options` (\n  `poll`,\n  `submitted_by`\n)",
          "CREATE INDEX `idx_Tz8kmA2xdR` ON `poll_options` (`text`)",
          "CREATE INDEX `idx_YmQB6Qlmf9` ON `poll_options` (`created`)",
        ],
      },
      pollOptionsCollection
    );

    // Update poll_votes collection indexes
    const pollVotesCollection = app.findCollectionByNameOrId("pbc_3381278622");
    unmarshal(
      {
        indexes: [
          "CREATE INDEX `idx_sKIkK2eDM8` ON `poll_votes` (\n  `option`,\n  `user`\n)",
          "CREATE INDEX `idx_s2nHHrwZMY` ON `poll_votes` (`option`)",
          "CREATE INDEX `idx_ufs7X8GGnW` ON `poll_votes` (`user`)",
          "CREATE INDEX `idx_Khyptrerc7` ON `poll_votes` (`voted_at`)",
          "CREATE INDEX `idx_6eu96TDGpj` ON `poll_votes` (\n  `option`,\n  `voted_at`\n)",
          "CREATE INDEX `idx_3xdxZHIbUb` ON `poll_votes` (\n  `user`,\n  `voted_at`\n)",
          "CREATE INDEX `idx_hQbx4PehZV` ON `poll_votes` (`created`)",
        ],
      },
      pollVotesCollection
    );

    // Update chat_messages collection indexes
    const chatMessagesCollection =
      app.findCollectionByNameOrId("pbc_102036695");
    unmarshal(
      {
        indexes: [
          "CREATE INDEX `idx_5WlpV66Nmn` ON `chat_messages` (`trip`)",
          "CREATE INDEX `idx_GJelnf2mrj` ON `chat_messages` (`user`)",
          "CREATE INDEX `idx_u4jDHkOl92` ON `chat_messages` (`created`)",
          "CREATE INDEX `idx_DdK7FlxGW9` ON `chat_messages` (\n  `trip`,\n  `created`\n)",
          "CREATE INDEX `idx_EiaBDxAH3H` ON `chat_messages` (\n  `trip`,\n  `user`\n)",
          "CREATE INDEX `idx_ggqODOZ7RB` ON `chat_messages` (\n  `user`,\n  `created`\n)",
          "CREATE INDEX `idx_33GWwCqy4p` ON `chat_messages` (`text`)",
          "CREATE INDEX `idx_OoQZHT7A4z` ON `chat_messages` (`updated`)",
        ],
      },
      chatMessagesCollection
    );

    // Save all collections
    app.save(usersCollection);
    app.save(groupsCollection);
    app.save(groupMembersCollection);
    app.save(tripsCollection);
    app.save(timelineItemsCollection);
    app.save(pollsCollection);
    app.save(pollOptionsCollection);
    app.save(pollVotesCollection);
    app.save(chatMessagesCollection);

    return;
  },
  (app) => {
    // Remove all indexes by setting empty arrays

    // Users collection
    const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_");
    unmarshal(
      {
        indexes: [
          "CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)",
          "CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''",
        ],
      },
      usersCollection
    );

    // Groups collection
    const groupsCollection = app.findCollectionByNameOrId("pbc_3346940990");
    unmarshal(
      {
        indexes: [],
      },
      groupsCollection
    );

    // Group members collection
    const groupMembersCollection =
      app.findCollectionByNameOrId("pbc_714390402");
    unmarshal(
      {
        indexes: [],
      },
      groupMembersCollection
    );

    // Trips collection
    const tripsCollection = app.findCollectionByNameOrId("pbc_1630916145");
    unmarshal(
      {
        indexes: [],
      },
      tripsCollection
    );

    // Timeline items collection
    const timelineItemsCollection =
      app.findCollectionByNameOrId("pbc_3868922268");
    unmarshal(
      {
        indexes: [],
      },
      timelineItemsCollection
    );

    // Polls collection
    const pollsCollection = app.findCollectionByNameOrId("pbc_3598350341");
    unmarshal(
      {
        indexes: [],
      },
      pollsCollection
    );

    // Poll options collection
    const pollOptionsCollection =
      app.findCollectionByNameOrId("pbc_2079863742");
    unmarshal(
      {
        indexes: [],
      },
      pollOptionsCollection
    );

    // Poll votes collection
    const pollVotesCollection = app.findCollectionByNameOrId("pbc_3381278622");
    unmarshal(
      {
        indexes: [],
      },
      pollVotesCollection
    );

    // Chat messages collection
    const chatMessagesCollection =
      app.findCollectionByNameOrId("pbc_102036695");
    unmarshal(
      {
        indexes: [],
      },
      chatMessagesCollection
    );

    // Save all collections
    app.save(usersCollection);
    app.save(groupsCollection);
    app.save(groupMembersCollection);
    app.save(tripsCollection);
    app.save(timelineItemsCollection);
    app.save(pollsCollection);
    app.save(pollOptionsCollection);
    app.save(pollVotesCollection);
    app.save(chatMessagesCollection);

    return;
  }
);
