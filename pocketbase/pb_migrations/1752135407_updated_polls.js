/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3598350341")

  // update collection data
  unmarshal({
    "indexes": [
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
      "CREATE INDEX `idx_TNuMLG3ToN` ON `polls` (`created`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3598350341")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
