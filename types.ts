
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

export interface UserPermission {
    module: string;
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
}

// Database Entities
export interface SystemUser {
    id?: number;
    name: string;
    email: string;
    password?: string;
    level: 'admin' | 'manager' | 'client' | 'technician';
    avatar_url?: string;
    permissions?: UserPermission[];
}

export interface Client {
  id?: number;
  name: string;
  cpf: string; 
  phone: string;
  email: string;
  type: 'Cliente' | 'Fornecedor';
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
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

export interface OrderItem {
    id: string;
    originalId?: number;
    name: string;
    price: number;
    quantity: number;
    type: 'product' | 'service';
}

export interface Order {
  id?: number;
  client: string;
  responsible: string;
  dateInit: string;
  status: string;
  statusColor: string;
  total: string;
  description?: string;
  services_list?: OrderItem[];
  products_list?: OrderItem[];
  service?: string;     
}

export interface Sale {
  id?: number;
  client: string;
  responsible?: string;
  date: string;
  total: string;
  status: 'Faturado' | 'Aberto' | 'Cancelado';
  details: string;
  products_list?: OrderItem[];
}

export interface FileDocument {
  id?: number;
  name: string;
  client?: string;
  date: string;
  description: string;
  type: string;
  size: string;
  url?: string;
}

export interface Transaction {
  id?: number;
  type: 'receita' | 'despesa';
  description: string;
  value: string;
  numericValue: number;
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
  logo_url?: string;
  warrantyText?: string;
}
