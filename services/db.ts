
import { supabase } from './supabase';
import { Client, Product, Service, Order, Transaction, CompanySettings, Sale, FileDocument, SystemUser } from '../types';

export const initDB = async (): Promise<{ success: boolean; error?: any }> => {
    try {
        // Verifica tabelas essenciais e se colunas novas existem
        const { error: usersError } = await supabase.from('users').select('id, permissions').limit(1);
        if (usersError) return { success: false, error: usersError };

        const { error: settingsError } = await supabase.from('settings').select('id').limit(1);
        if (settingsError) return { success: false, error: settingsError };

        const { error: salesError } = await supabase.from('service_sales').select('id').limit(1);
        if (salesError) return { success: false, error: salesError };

        const { error: filesError } = await supabase.from('files').select('id').limit(1);
        if (filesError) return { success: false, error: filesError };

        return { success: true };
    } catch (err) {
        return { success: false, error: err };
    }
};

export const getAll = async <T>(tableName: string): Promise<T[]> => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) return [];
    return data as T[];
};

export const addItem = async <T>(tableName: string, item: T): Promise<number> => {
    const itemToSave = { ...item };
    if ((itemToSave as any).id === undefined || (itemToSave as any).id === null) {
        delete (itemToSave as any).id;
    }

    const { data, error } = await supabase
        .from(tableName)
        .insert(itemToSave)
        .select()
        .single();

    if (error) throw error;
    return data?.id || 0;
};

export const updateItem = async <T extends { id?: number }>(tableName: string, item: T): Promise<void> => {
    if (!item.id) return;
    const { error } = await supabase.from(tableName).update(item).eq('id', item.id);
    if (error) console.error(`Erro ao atualizar em ${tableName}:`, error.message);
};

export const deleteItem = async (tableName: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    return !error;
};

export const getSettings = async (): Promise<CompanySettings | null> => {
    const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    return error ? null : data as CompanySettings;
};

export const saveSettings = async (settings: CompanySettings): Promise<void> => {
    const existing = await getSettings();
    if (existing && (existing as any).id) {
        await supabase.from('settings').update(settings).eq('id', (existing as any).id);
    } else {
        await supabase.from('settings').insert(settings);
    }
};

export const getDashboardStats = async () => {
    const [clients, products, services, orders, trans] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('type, "numericValue"')
    ]);
    
    let revenue = 0, expenses = 0;
    if (trans.data) {
        trans.data.forEach((t: any) => {
            if (t.type === 'receita') revenue += (Number(t.numericValue) || 0);
            else expenses += (Number(t.numericValue) || 0);
        });
    }

    return { 
        clients: clients.count || 0, 
        products: products.count || 0, 
        services: services.count || 0, 
        orders: orders.count || 0, 
        revenue, 
        expenses 
    };
};
