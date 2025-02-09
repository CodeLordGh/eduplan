import { UserAttributes, Subscription } from '@eduflow/types';

export const hasValidSubscription = (
  attributes: UserAttributes,
  schoolId: string
): boolean => {
  // Check if the user has an active subscription for the school
  return attributes.subscriptions?.some(
    (sub: Subscription) => sub.schoolId === schoolId && sub.status === 'ACTIVE'
  ) ?? false;
}; 