/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3868922268")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_0zUucZBTi9` ON `timeline_items` (`trip`)",
      "CREATE INDEX `idx_clcWa2beXP` ON `timeline_items` (`created_by`)",
      "CREATE INDEX `idx_dVmII2p1da` ON `timeline_items` (`time`)",
      "CREATE INDEX `idx_itOaEWAtlx` ON `timeline_items` (`created_from_poll`)",
      "CREATE INDEX `idx_tkNX4BHSsD` ON `timeline_items` (\n  `trip`,\n  `time`\n)",
      "CREATE INDEX `idx_ArsAOi1kyU` ON `timeline_items` (\n  `trip`,\n  `created_by`\n)",
      "CREATE INDEX `idx_dr3acSC71r` ON `timeline_items` (\n  `trip`,\n  `created_from_poll`\n)",
      "CREATE INDEX `idx_kjUH67tu0g` ON `timeline_items` (`title`)",
      "CREATE INDEX `idx_to3iME6yMt` ON `timeline_items` (`cost`)",
      "CREATE INDEX `idx_w5xfuImun7` ON `timeline_items` (`created`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3868922268")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
