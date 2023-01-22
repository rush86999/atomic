
import { EventType } from '@app/dataTypes/EventType';
import { CategoryType } from '@app/dataTypes/CategoryType';

export type CategoryEventType = {
  __typename: 'Category_Event';
  id: string,
  userId: string,
  categoryId: string,
  eventId: string,
  updatedAt: string,
  createdDate: string,
  deleted: boolean
  Category?: CategoryType,
  Event?: EventType,
}
