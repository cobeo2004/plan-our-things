/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1630916145")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_XBLk8HHTgp` ON `trips` (`group`)",
      "CREATE INDEX `idx_x8WJJQ4Ed5` ON `trips` (`created_by`)",
      "CREATE INDEX `idx_vB2wv7vBMm` ON `trips` (`start_date`)",
      "CREATE INDEX `idx_dTI9fCQ6S1` ON `trips` (`end_date`)",
      "CREATE INDEX `idx_LUkCf1X9MN` ON `trips` (\n  `group`,\n  `start_date`\n)",
      "CREATE INDEX `idx_HOk8rC4ZdZ` ON `trips` (\n  `group`,\n  `created_by`\n)",
      "CREATE INDEX `idx_K9DejwdQvQ` ON `trips` (`title`)",
      "CREATE INDEX `idx_EKM6JQ9UO8` ON `trips` (`created`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1630916145")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
