/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Update users collection indexes
    const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_");
    unmarshal(
      {
        indexes: [
          "CREATE UNIQUE INDEX idx_tokenKey__pb_users_auth_ ON users (tokenKey)",
          "CREATE UNIQUE INDEX idx_email__pb_users_auth_ ON users (email) WHERE email IS NOT NULL AND email <> ''",
          "CREATE INDEX idx_name_users ON users (name)",
          "CREATE INDEX idx_created_users ON users (created)",
        ],
      },
      usersCollection
    );

    // Update groups collection indexes
    const groupsCollection = app.findCollectionByNameOrId("pbc_3346940990");
    unmarshal(
      {
        indexes: [
          "CREATE UNIQUE INDEX idx_groups_code ON groups (code)",
          "CREATE INDEX idx_groups_name ON groups (name)",
          "CREATE INDEX idx_groups_created_by ON groups (created_by)",
          "CREATE INDEX idx_groups_created ON groups (created)",
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
          'CREATE UNIQUE INDEX idx_group_members_group_user ON group_members ("group", "user")',
          'CREATE INDEX idx_group_members_user ON group_members ("user")',
          'CREATE INDEX idx_group_members_group ON group_members ("group")',
          "CREATE INDEX idx_group_members_role ON group_members (role)",
          'CREATE INDEX idx_group_members_user_group_role ON group_members ("user", "group", role)',
          'CREATE INDEX idx_group_members_group_role ON group_members ("group", role)',
          "CREATE INDEX idx_group_members_created ON group_members (created)",
        ],
      },
      groupMembersCollection
    );

    // Update trips collection indexes
    const tripsCollection = app.findCollectionByNameOrId("pbc_1630916145");
    unmarshal(
      {
        indexes: [
          'CREATE INDEX idx_trips_group ON trips ("group")',
          "CREATE INDEX idx_trips_created_by ON trips (created_by)",
          "CREATE INDEX idx_trips_start_date ON trips (start_date)",
          "CREATE INDEX idx_trips_end_date ON trips (end_date)",
          'CREATE INDEX idx_trips_group_start_date ON trips ("group", start_date)',
          'CREATE INDEX idx_trips_group_created_by ON trips ("group", created_by)',
          "CREATE INDEX idx_trips_title ON trips (title)",
          "CREATE INDEX idx_trips_created ON trips (created)",
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
          "CREATE INDEX idx_timeline_items_trip ON timeline_items (trip)",
          "CREATE INDEX idx_timeline_items_created_by ON timeline_items (created_by)",
          'CREATE INDEX idx_timeline_items_time ON timeline_items ("time")',
          "CREATE INDEX idx_timeline_items_created_from_poll ON timeline_items (created_from_poll)",
          'CREATE INDEX idx_timeline_items_trip_time ON timeline_items (trip, "time")',
          "CREATE INDEX idx_timeline_items_trip_created_by ON timeline_items (trip, created_by)",
          "CREATE INDEX idx_timeline_items_trip_created_from_poll ON timeline_items (trip, created_from_poll)",
          "CREATE INDEX idx_timeline_items_title ON timeline_items (title)",
          "CREATE INDEX idx_timeline_items_cost ON timeline_items (cost)",
          "CREATE INDEX idx_timeline_items_created ON timeline_items (created)",
        ],
      },
      timelineItemsCollection
    );

    // Update polls collection indexes
    const pollsCollection = app.findCollectionByNameOrId("pbc_3598350341");
    unmarshal(
      {
        indexes: [
          "CREATE INDEX idx_polls_trip ON polls (trip)",
          "CREATE INDEX idx_polls_created_by ON polls (created_by)",
          "CREATE INDEX idx_polls_status ON polls (status)",
          "CREATE INDEX idx_polls_start_time ON polls (start_time)",
          "CREATE INDEX idx_polls_end_time ON polls (end_time)",
          "CREATE INDEX idx_polls_target_time_slot ON polls (target_time_slot)",
          "CREATE INDEX idx_polls_trip_status ON polls (trip, status)",
          "CREATE INDEX idx_polls_trip_created_by ON polls (trip, created_by)",
          "CREATE INDEX idx_polls_status_end_time ON polls (status, end_time)",
          "CREATE INDEX idx_polls_title ON polls (title)",
          "CREATE INDEX idx_polls_created ON polls (created)",
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
          "CREATE INDEX idx_poll_options_poll ON poll_options (poll)",
          "CREATE INDEX idx_poll_options_submitted_by ON poll_options (submitted_by)",
          "CREATE INDEX idx_poll_options_poll_submitted_by ON poll_options (poll, submitted_by)",
          'CREATE INDEX idx_poll_options_text ON poll_options ("text")',
          "CREATE INDEX idx_poll_options_created ON poll_options (created)",
        ],
      },
      pollOptionsCollection
    );

    // Update poll_votes collection indexes
    const pollVotesCollection = app.findCollectionByNameOrId("pbc_3381278622");
    unmarshal(
      {
        indexes: [
          'CREATE INDEX idx_poll_votes_option_user ON poll_votes ("option", "user")',
          'CREATE INDEX idx_poll_votes_option ON poll_votes ("option")',
          'CREATE INDEX idx_poll_votes_user ON poll_votes ("user")',
          "CREATE INDEX idx_poll_votes_voted_at ON poll_votes (voted_at)",
          'CREATE INDEX idx_poll_votes_option_voted_at ON poll_votes ("option", voted_at)',
          'CREATE INDEX idx_poll_votes_user_voted_at ON poll_votes ("user", voted_at)',
          "CREATE INDEX idx_poll_votes_created ON poll_votes (created)",
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
          "CREATE INDEX idx_chat_messages_trip ON chat_messages (trip)",
          'CREATE INDEX idx_chat_messages_user ON chat_messages ("user")',
          "CREATE INDEX idx_chat_messages_created ON chat_messages (created)",
          "CREATE INDEX idx_chat_messages_trip_created ON chat_messages (trip, created)",
          'CREATE INDEX idx_chat_messages_trip_user ON chat_messages (trip, "user")',
          'CREATE INDEX idx_chat_messages_user_created ON chat_messages ("user", created)',
          'CREATE INDEX idx_chat_messages_text ON chat_messages ("text")',
          "CREATE INDEX idx_chat_messages_updated ON chat_messages (updated)",
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
          "CREATE UNIQUE INDEX idx_tokenKey__pb_users_auth_ ON users (tokenKey)",
          "CREATE UNIQUE INDEX idx_email__pb_users_auth_ ON users (email) WHERE email IS NOT NULL AND email <> ''",
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
