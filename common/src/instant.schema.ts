
import { i } from '@instantdb/react';

const _schema = i.schema({
	entities: {
   	$users: i.entity({
   		email: i.string().unique().indexed(),
   	}),
		otasks: i.entity({
			name: i.string().unique(),
			longName: i.string(),
			sub: i.json(),
			filename: i.string().optional(),
	 	}),
		actions: i.entity({
			name: i.string(),
			longName: i.string(),
		}),
  },
  links: {
    actions: {
      forward: { on: 'otasks', has: 'many', label: 'actions' },
      reverse: { on: 'actions', has: 'one', label: 'otask' },
    },
    parentOtask: {
      forward: { on: 'otasks', has: 'one', label: 'parent' },
      reverse: { on: 'otasks', has: 'many', label: 'children' },
    },
  },
});

// This helps Typescript display better intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
