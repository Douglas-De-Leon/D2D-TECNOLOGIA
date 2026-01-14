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
export interface SystemUser {
    id?: number;
    name: string;
    email: string;
    password?: string; // Only used for auth verification, not stored in state ideally
    level: 'admin' | 'user';
}

export interface Client {
  id?: number;
  name: string;
  cpf: string; // CPF ou CNPJ
  phone: string;
  email: string;
  // Campos adicionais
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

// Interface para itens dentro da OS e Vendas
export interface OrderItem {
    id: string; // ID único temporário para a lista visual ou ID do produto/serviço original
    originalId?: number; // Referência ao ID no banco
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
  
  // Listas JSON
  services_list?: OrderItem[];
  products_list?: OrderItem[];
  
  // Mantendo compatibilidade com versões anteriores (visualização rápida na tabela)
  service?: string;     
}

export interface Sale {
  id?: number;
  client: string;
  date: string;
  total: string;
  status: 'Faturado' | 'Aberto' | 'Cancelado';
  details: string; // Observações gerais
  products_list?: OrderItem[]; // Lista de itens vendidos
}

export interface FileDocument {
  id?: number;
  name: string;
  client?: string; // Nome do cliente/fornecedor associado
  date: string;
  description: string;
  type: string; // Extension or mime type
  size: string;
  url?: string; // Placeholder for real URL
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
  warrantyText?: string; // Texto dos termos de garantia
}