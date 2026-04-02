-- Drop legacy DeviceToken table. Device tokens are now stored in api/config/device-tokens.json.
DROP TABLE IF EXISTS "DeviceToken";
