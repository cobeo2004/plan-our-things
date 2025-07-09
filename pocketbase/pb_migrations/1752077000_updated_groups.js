/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3346940990")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_x2nunTQWXd` ON `groups` (`code`)",
      "CREATE INDEX `idx_oC5LqtaFy2` ON `groups` (`name`)",
      "CREATE INDEX `idx_z6ldLvwCDL` ON `groups` (`created_by`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3346940990")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
