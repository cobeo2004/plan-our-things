/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3381278622")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_sKIkK2eDM8` ON `poll_votes` (\n  `option`,\n  `user`\n)",
      "CREATE INDEX `idx_s2nHHrwZMY` ON `poll_votes` (`option`)",
      "CREATE INDEX `idx_ufs7X8GGnW` ON `poll_votes` (`user`)",
      "CREATE INDEX `idx_Khyptrerc7` ON `poll_votes` (`voted_at`)",
      "CREATE INDEX `idx_6eu96TDGpj` ON `poll_votes` (\n  `option`,\n  `voted_at`\n)",
      "CREATE INDEX `idx_3xdxZHIbUb` ON `poll_votes` (\n  `user`,\n  `voted_at`\n)",
      "CREATE INDEX `idx_hQbx4PehZV` ON `poll_votes` (`created`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3381278622")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
