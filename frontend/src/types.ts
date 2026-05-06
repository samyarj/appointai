export interface Event {
  id: number;
  user_id: number;
  category_id?: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  createdAt?: string;
  original_event_id?: number;
}

export interface Todo {
  id: number;
  user_id: number;
  category_id?: number;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  estimated_duration?: string;
  due_date?: string;
  completed: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  color?: string;
  description?: string;
  usage_count?: number;
  createdAt?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  theme?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    reminders: boolean;
    weeklyDigest: boolean;
  };
  privacy?: {
    profileVisibility: string;
    showActivity: boolean;
  };
}
