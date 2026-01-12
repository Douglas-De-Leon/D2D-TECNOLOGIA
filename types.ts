import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface QuickAction {
  id: string;
  label: string;
  shortcut: string;
  icon: LucideIcon;
  colorClass: string;
  hoverClass: string;
}

export interface StatMetric {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}

// Database Entities
export interface Client {
  id?: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
}

export interface Product {
  id?: number;
  name: string;
  unit: string;
  stock: number;
  price: string;
  minStock: number;
}

export interface Service {
  id?: number;
  name: string;
  description: string;
  price: string;
}

export interface Order {
  id?: number;
  client: string;
  responsible: string;
  dateInit: string;
  status: string;
  statusColor: string;
  total: string;
}

export interface Sale {
  id?: number;
  client: string;
  date: string;
  total: string;
  status: 'Faturado' | 'Aberto' | 'Cancelado';
  details: string; // Resumo dos itens
}

export interface Transaction {
  id?: number;
  type: 'receita' | 'despesa';
  description: string;
  value: string; // Stored as string with currency formatting for simplicity in this demo
  numericValue: number; // For calculations
  date: string;
  status: string;
}

export interface CompanySettings {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  theme: string;
}