
import type { InstantRules } from '@instantdb/react';

const rules = {
  "otasks": {
    "allow": {
      "view": "isOwner",
      "create": "isOwner",
      "update": "isOwner && isStillOwner",
      "delete": "isOwner",
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id == data.creatorId",
      "isStillOwner", "auth.id != null && auth.id == newData.creatorId"
    ]
  }
} satisfies InstantRules;

export default rules;
