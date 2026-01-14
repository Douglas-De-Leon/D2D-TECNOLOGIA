import { supabase } from './supabase';
import { Client, Product, Service, Order, Transaction, CompanySettings, Sale, FileDocument } from '../types';

// O initDB verifica a conexão.
export const initDB = async (): Promise<{ success: boolean; error?: any }> => {
    // 1. Verifica se a tabela 'users' existe (crítico para autenticação)
    const { error: usersError } = await supabase.from('users').select('id').limit(1);
    
    if (usersError) {
        console.error("Erro ao verificar tabela users:", JSON.stringify(usersError, null, 2));
        // Retorna falha para que a UI possa mostrar a tela de configuração
        return { success: false, error: usersError };
    }

    // 2. Verifica se a tabela 'settings' existe
    const { error: settingsError } = await supabase.from('settings').select('id').limit(1);
    
    if (settingsError) {
        console.error("Erro ao verificar tabela settings:", JSON.stringify(settingsError, null, 2));
        return { success: false, error: settingsError };
    }

    // 3. Verifica se a tabela 'service_sales' existe (tabela nova/renomeada)
    // Isso força a aplicação a ir para a tela de Setup se a tabela não tiver sido criada ainda.
    const { error: salesError } = await supabase.from('service_sales').select('id').limit(1);
    
    if (salesError) {
        console.error("Erro ao verificar tabela service_sales:", JSON.stringify(salesError, null, 2));
        return { success: false, error: salesError };
    }

    // 4. Verifica se a tabela 'files' tem a coluna 'client'
    // Se a coluna não existir, o PostgREST retornará um erro, forçando a ida para o Setup
    const { error: filesError } = await supabase.from('files').select('client').limit(1);
    
    if (filesError) {
        console.error("Erro ao verificar coluna client em files:", JSON.stringify(filesError, null, 2));
        return { success: false, error: filesError };
    }

    console.log("Conexão com Supabase verificada com sucesso.");
    return { success: true };
};

// Generic Helpers para Supabase

export const getAll = async <T>(tableName: string): Promise<T[]> => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        console.error(`Erro ao buscar dados de ${tableName}:`, error.message);
        return [];
    }
    return data as T[];
};

export const addItem = async <T>(tableName: string, item: T): Promise<number> => {
    const itemToSave = { ...item };
    // Remove ID se for undefined para deixar o banco gerar (identity)
    if ((itemToSave as any).id === undefined || (itemToSave as any).id === null) {
        delete (itemToSave as any).id;
    }

    const { data, error } = await supabase
        .from(tableName)
        .insert(itemToSave)
        .select()
        .single();

    if (error) {
        console.error(`Erro ao adicionar em ${tableName}:`, error.message, error);
        throw error; // Propaga o erro para ser tratado pelo componente (ex: Setup)
    }
    return data?.id || 0;
};

export const deleteItem = async (tableName: string, id: number): Promise<boolean> => {
    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Erro ao deletar de ${tableName}:`, error.message);
        return false;
    }
    return true;
};

export const updateItem = async <T extends { id?: number }>(tableName: string, item: T): Promise<void> => {
    if (!item.id) return;

    const { error } = await supabase
        .from(tableName)
        .update(item)
        .eq('id', item.id);

    if (error) {
        console.error(`Erro ao atualizar em ${tableName}:`, error.message);
    }
};

// Specific Helpers

export const getSettings = async (): Promise<CompanySettings | null> => {
    // Use maybeSingle() para retornar null se não houver linhas, em vez de erro
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

    if (error) {
        console.warn("Erro ao buscar configurações:", error.message);
        return null;
    }
    return data as CompanySettings;
};

export const saveSettings = async (settings: CompanySettings): Promise<void> => {
    const existing = await getSettings();

    if (existing && (existing as any).id) {
        const { error } = await supabase
            .from('settings')
            .update(settings)
            .eq('id', (existing as any).id);
        if (error) console.error("Erro ao atualizar settings:", error.message);
    } else {
        const { error } = await supabase
            .from('settings')
            .insert(settings);
        if (error) console.error("Erro ao criar settings:", error.message);
    }
};

export const getDashboardStats = async () => {
    // Usando count: 'exact' e head: true para performance onde possível
    
    // Contagens
    const { count: clients, error: errClients } = await supabase.from('clients').select('*', { count: 'exact', head: true });
    if(errClients) console.error("Erro count clients:", errClients.message);

    const { count: products, error: errProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if(errProducts) console.error("Erro count products:", errProducts.message);

    const { count: services, error: errServices } = await supabase.from('services').select('*', { count: 'exact', head: true });
    if(errServices) console.error("Erro count services:", errServices.message);

    const { count: orders, error: errOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    if(errOrders) console.error("Erro count orders:", errOrders.message);

    // Finanças
    const { data: transactions, error: errTrans } = await supabase.from('transactions').select('type, "numericValue"');
    if(errTrans) console.error("Erro sum transactions:", errTrans.message);
    
    let revenue = 0;
    let expenses = 0;

    if (transactions) {
        revenue = transactions
            .filter((t: any) => t.type === 'receita')
            .reduce((acc: number, curr: any) => acc + (Number(curr.numericValue) || 0), 0);
        
        expenses = transactions
            .filter((t: any) => t.type === 'despesa')
            .reduce((acc: number, curr: any) => acc + (Number(curr.numericValue) || 0), 0);
    }

    return { 
        clients: clients || 0, 
        products: products || 0, 
        services: services || 0, 
        orders: orders || 0, 
        revenue, 
        expenses 
    };
};