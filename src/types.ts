import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: number;
}

export interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  date: string;
  notes?: string;
  is_recurring: number;
}

export interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  amount: number;
  month: number;
  year: number;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
}

export interface RecurringTemplate {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category_id: number;
  category_name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  last_executed?: string;
  is_active: number;
}

export interface BankAccount {
  id: number;
  name: string;
  bank_name: string;
  account_number: string;
  balance: number;
  type: string;
  created_at: string;
}

export interface FileAsset {
  id: number;
  name: string;
  path: string;
  size: number;
  type: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
}
