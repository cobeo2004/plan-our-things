/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/join-group", (e) => {
  const { group_code } = e.requestInfo().body;
  if (!e.auth) {
    return e.json(401, {
      error: "Unauthorized",
    });
  }

  if (!group_code) {
    return e.json(400, {
      error: "Group code is required",
    });
  }

  const group = $app.findFirstRecordByData("groups", "code", group_code);

  if (!group) {
    return e.json(404, {
      error: "Group not found",
    });
  }

  if (group.get("created_by") === e.auth.get("id")) {
    return e.json(400, {
      error: "You are the creator of this group",
    });
  }

  const groupMember = $app.findRecordsByFilter(
    "group_members",
    `group="${group.id}" && user="${e.auth.get("id")}"`
  );

  if (groupMember.length > 0) {
    return e.json(400, {
      error: "You are already a member of this group",
    });
  }

  const newMemberRecord = new Record(
    $app.findCollectionByNameOrId("group_members"),
    {
      group: group.id,
      user: e.auth.get("id"),
      role: "member",
    }
  );

  $app.save(newMemberRecord);

  return e.json(200, {
    message: "You have joined the group",
    group_member: newMemberRecord,
  });
});
