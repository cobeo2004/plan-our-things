/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Users collection - Allow authenticated users to view all users, update own profile
    const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: "",
        updateRule: "@request.auth.id = id",
        deleteRule: "@request.auth.id = id",
      },
      usersCollection
    );

    // Groups collection
    const groupsCollection = app.findCollectionByNameOrId("pbc_3346940990");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
      groupsCollection
    );

    // Group members collection
    const groupMembersCollection =
      app.findCollectionByNameOrId("pbc_714390402");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
      groupMembersCollection
    );

    // Trips collection
    const tripsCollection = app.findCollectionByNameOrId("pbc_1630916145");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
      tripsCollection
    );

    // Timeline items collection
    const timelineItemsCollection =
      app.findCollectionByNameOrId("pbc_3868922268");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
      timelineItemsCollection
    );

    // Polls collection
    const pollsCollection = app.findCollectionByNameOrId("pbc_3598350341");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
      pollsCollection
    );

    // Poll options collection
    const pollOptionsCollection =
      app.findCollectionByNameOrId("pbc_2079863742");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
      pollOptionsCollection
    );

    // Poll votes collection
    const pollVotesCollection = app.findCollectionByNameOrId("pbc_3381278622");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      },
      pollVotesCollection
    );

    // Chat messages collection
    const chatMessagesCollection =
      app.findCollectionByNameOrId("pbc_102036695");
    unmarshal(
      {
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
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
    // Rollback to open access (empty string rules)

    // Users collection
    const usersCollection = app.findCollectionByNameOrId("_pb_users_auth_");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      usersCollection
    );

    // Groups collection
    const groupsCollection = app.findCollectionByNameOrId("pbc_3346940990");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      groupsCollection
    );

    // Group members collection
    const groupMembersCollection =
      app.findCollectionByNameOrId("pbc_714390402");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      groupMembersCollection
    );

    // Trips collection
    const tripsCollection = app.findCollectionByNameOrId("pbc_1630916145");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      tripsCollection
    );

    // Timeline items collection
    const timelineItemsCollection =
      app.findCollectionByNameOrId("pbc_3868922268");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      timelineItemsCollection
    );

    // Polls collection
    const pollsCollection = app.findCollectionByNameOrId("pbc_3598350341");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      pollsCollection
    );

    // Poll options collection
    const pollOptionsCollection =
      app.findCollectionByNameOrId("pbc_2079863742");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      pollOptionsCollection
    );

    // Poll votes collection
    const pollVotesCollection = app.findCollectionByNameOrId("pbc_3381278622");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
      },
      pollVotesCollection
    );

    // Chat messages collection
    const chatMessagesCollection =
      app.findCollectionByNameOrId("pbc_102036695");
    unmarshal(
      {
        listRule: "",
        viewRule: "",
        createRule: "",
        updateRule: "",
        deleteRule: "",
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
