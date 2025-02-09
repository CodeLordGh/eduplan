export interface Subscription {
  schoolId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

export interface UserAttributes {
  subscriptions?: Subscription[];
  // ... existing code ...
} 