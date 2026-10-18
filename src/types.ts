export type Priority = 'low' | 'medium' | 'high';
export type Category = 'study' | 'work' | 'personal' | 'health';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  createdAt: string;
  dueDate?: string;
}

export interface StateHistoryItem {
  id: string;
  action: string;
  previousValue: number;
  newValue: number;
  timestamp: string;
}

export type TabKey = 'overview' | 'tasks' | 'state' | 'learning';
export type Language = 'vi' | 'en';
