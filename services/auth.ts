import { supabase } from './supabase';
import { SystemUser } from '../types';

export const login = async (email: string, password: string): Promise<{ success: boolean; user?: SystemUser; error?: string }> => {
    try {
        // Busca usuário pelo email
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Erro no login:", JSON.stringify(error, null, 2));
            return { success: false, error: error.message || 'Erro ao conectar ao servidor.' };
        }

        if (!data) {
            return { success: false, error: 'Usuário não encontrado.' };
        }

        // Verificação simples de senha (para este demo sem backend)
        // Em produção, isso deve ser hash no backend ou usar Supabase Auth Nativo
        if (data.password === password) {
            const user: SystemUser = {
                id: data.id,
                name: data.name,
                email: data.email,
                level: data.level as 'admin' | 'user'
            };
            return { success: true, user };
        } else {
            return { success: false, error: 'Senha incorreta.' };
        }

    } catch (err: any) {
        console.error("Erro inesperado no login:", err);
        return { success: false, error: err.message || 'Erro inesperado.' };
    }
};