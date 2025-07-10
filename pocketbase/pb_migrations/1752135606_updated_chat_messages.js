/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_102036695")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX `idx_5WlpV66Nmn` ON `chat_messages` (`trip`)",
      "CREATE INDEX `idx_GJelnf2mrj` ON `chat_messages` (`user`)",
      "CREATE INDEX `idx_u4jDHkOl92` ON `chat_messages` (`created`)",
      "CREATE INDEX `idx_DdK7FlxGW9` ON `chat_messages` (\n  `trip`,\n  `created`\n)",
      "CREATE INDEX `idx_EiaBDxAH3H` ON `chat_messages` (\n  `trip`,\n  `user`\n)",
      "CREATE INDEX `idx_ggqODOZ7RB` ON `chat_messages` (\n  `user`,\n  `created`\n)",
      "CREATE INDEX `idx_33GWwCqy4p` ON `chat_messages` (`text`)",
      "CREATE INDEX `idx_OoQZHT7A4z` ON `chat_messages` (`updated`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_102036695")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
