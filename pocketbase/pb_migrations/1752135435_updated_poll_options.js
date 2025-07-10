/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2079863742")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_Qz7HPsFwAe` ON `poll_options` (`poll`)",
      "CREATE INDEX `idx_kGdsWSLqZI` ON `poll_options` (`submitted_by`)",
      "CREATE INDEX `idx_xfh7YO6Kpy` ON `poll_options` (\n  `poll`,\n  `submitted_by`\n)",
      "CREATE INDEX `idx_Tz8kmA2xdR` ON `poll_options` (`text`)",
      "CREATE INDEX `idx_YmQB6Qlmf9` ON `poll_options` (`created`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2079863742")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
