/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_714390402")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_XrmwCPdyzh` ON `group_members` (\n  `group`,\n  `user`\n)",
      "CREATE INDEX `idx_QGpEZOf0NN` ON `group_members` (`user`)",
      "CREATE INDEX `idx_wsY6gPOLTB` ON `group_members` (`group`)",
      "CREATE INDEX `idx_2VMbPcZix0` ON `group_members` (`role`)",
      "CREATE INDEX `idx_RAhU4jvFT8` ON `group_members` (\n  `user`,\n  `group`,\n  `role`\n)",
      "CREATE INDEX `idx_EjS8bZC0RA` ON `group_members` (\n  `group`,\n  `role`\n)",
      "CREATE INDEX `idx_aFMAkWoDo0` ON `group_members` (`created`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_714390402")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
