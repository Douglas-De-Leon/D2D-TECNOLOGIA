import { Client, Product, Service, Order, Transaction, CompanySettings, Sale } from '../types';

const DB_NAME = 'MapOS_DB';
const DB_VERSION = 5;

// Database Initialization and Seeding
export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Helper to recreate store with fresh data
      const recreateStore = <T>(storeName: string, data: T[]) => {
        if (db.objectStoreNames.contains(storeName)) {
          db.deleteObjectStore(storeName);
        }
        const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        data.forEach(item => store.add(item));
      };

      // --- SEED DATA ---

      const clients: Client[] = [
        { name: 'João Silva', cpf: '123.456.789-00', phone: '(11) 99999-1001', email: 'joao.silva@email.com' },
        { name: 'Maria Oliveira', cpf: '987.654.321-11', phone: '(21) 98888-2002', email: 'maria.oli@email.com' },
        { name: 'Tech Solutions Ltda', cpf: '12.345.678/0001-99', phone: '(31) 3333-3003', email: 'contato@techsolutions.com' },
        { name: 'Carlos Santos', cpf: '456.789.123-44', phone: '(41) 97777-4004', email: 'carlos.santos@email.com' },
        { name: 'Ana Pereira', cpf: '789.123.456-55', phone: '(51) 96666-5005', email: 'ana.pereira@email.com' },
        { name: 'Roberto Almeida', cpf: '321.654.987-66', phone: '(61) 95555-6006', email: 'roberto.a@email.com' },
        { name: 'Consultório Dr. Pedro', cpf: '98.765.432/0001-88', phone: '(71) 3222-7007', email: 'adm@clinica.com' },
        { name: 'Fernanda Costa', cpf: '159.753.258-77', phone: '(81) 94444-8008', email: 'fernanda.c@email.com' },
        { name: 'Escola Aprender', cpf: '45.123.789/0001-22', phone: '(11) 3000-9009', email: 'secretaria@escola.com' },
        { name: 'Ricardo Lima', cpf: '852.963.741-99', phone: '(21) 93333-1010', email: 'ricardo.l@email.com' }
      ];

      const products: Product[] = [
        { name: 'SSD Kingston 240GB', unit: 'UN', stock: 25, price: 'R$ 180,00', minStock: 5 },
        { name: 'Memória RAM 8GB DDR4', unit: 'UN', stock: 15, price: 'R$ 220,00', minStock: 5 },
        { name: 'Cabo de Rede CAT6', unit: 'MT', stock: 300, price: 'R$ 2,50', minStock: 50 },
        { name: 'Roteador TP-Link Archer C6', unit: 'UN', stock: 8, price: 'R$ 350,00', minStock: 3 },
        { name: 'Conector RJ45', unit: 'CX', stock: 10, price: 'R$ 45,00', minStock: 2 },
        { name: 'Fonte ATX 500W', unit: 'UN', stock: 12, price: 'R$ 150,00', minStock: 4 },
        { name: 'Monitor LG 24"', unit: 'UN', stock: 5, price: 'R$ 890,00', minStock: 2 },
        { name: 'Teclado Mecânico', unit: 'UN', stock: 20, price: 'R$ 250,00', minStock: 5 },
        { name: 'Mouse Sem Fio Logitech', unit: 'UN', stock: 18, price: 'R$ 90,00', minStock: 5 },
        { name: 'Pasta Térmica Prata', unit: 'TB', stock: 50, price: 'R$ 35,00', minStock: 10 }
      ];

      const services: Service[] = [
        { name: 'Formatação Completa', price: 'R$ 120,00', description: 'Formatação, backup (até 50GB) e instalação de drivers/programas básicos.' },
        { name: 'Limpeza Física PC/Notebook', price: 'R$ 80,00', description: 'Remoção de poeira e troca de pasta térmica.' },
        { name: 'Instalação de Rede (Ponto)', price: 'R$ 150,00', description: 'Passagem de cabo e crimpagem de conectores por ponto.' },
        { name: 'Configuração de Servidor', price: 'R$ 450,00', description: 'Configuração de AD, DNS e compartilhamento de arquivos.' },
        { name: 'Troca de Tela Notebook', price: 'R$ 100,00', description: 'Mão de obra para troca de tela (peça a parte).' },
        { name: 'Recuperação de Dados', price: 'R$ 250,00', description: 'Tentativa de recuperação via software.' }
      ];

      const orders: Order[] = [
        { client: 'João Silva', responsible: 'Edmilson', dateInit: '01/02/2023', status: 'Finalizado', statusColor: 'bg-gray-500', total: 'R$ 200,00' },
        { client: 'Tech Solutions Ltda', responsible: 'Carlos', dateInit: '05/02/2023', status: 'Em Andamento', statusColor: 'bg-blue-500', total: 'R$ 1.500,00' },
        { client: 'Maria Oliveira', responsible: 'Ana', dateInit: '10/02/2023', status: 'Aberto', statusColor: 'bg-green-500', total: 'R$ 0,00' },
        { client: 'Escola Aprender', responsible: 'Edmilson', dateInit: '12/02/2023', status: 'Finalizado', statusColor: 'bg-gray-500', total: 'R$ 450,00' },
        { client: 'Ricardo Lima', responsible: 'Carlos', dateInit: '14/02/2023', status: 'Cancelado', statusColor: 'bg-red-500', total: 'R$ 0,00' },
        { client: 'Consultório Dr. Pedro', responsible: 'Ana', dateInit: '15/02/2023', status: 'Em Andamento', statusColor: 'bg-blue-500', total: 'R$ 350,00' },
        { client: 'Fernanda Costa', responsible: 'Edmilson', dateInit: '18/02/2023', status: 'Aberto', statusColor: 'bg-green-500', total: 'R$ 120,00' },
        { client: 'Roberto Almeida', responsible: 'Carlos', dateInit: '20/02/2023', status: 'Finalizado', statusColor: 'bg-gray-500', total: 'R$ 80,00' }
      ];

      const sales: Sale[] = [
        { client: 'João Silva', date: '02/02/2023', total: 'R$ 250,00', status: 'Faturado', details: '1x Roteador TP-Link' },
        { client: 'Tech Solutions Ltda', date: '06/02/2023', total: 'R$ 1.200,00', status: 'Faturado', details: '5x SSD Kingston, 2x Fonte ATX' },
        { client: 'Maria Oliveira', date: '11/02/2023', total: 'R$ 45,00', status: 'Aberto', details: '1x Conector RJ45 (Caixa)' },
        { client: 'Carlos Santos', date: '13/02/2023', total: 'R$ 890,00', status: 'Cancelado', details: '1x Monitor LG' },
        { client: 'Escola Aprender', date: '15/02/2023', total: 'R$ 180,00', status: 'Faturado', details: '2x Mouse Sem Fio' }
      ];

      const transactions: Transaction[] = [
        { type: 'receita', description: 'Pgto OS #1001 - João Silva', value: 'R$ 200,00', numericValue: 200.00, date: '01/02/2023', status: 'Pago' },
        { type: 'despesa', description: 'Conta de Luz', value: 'R$ 350,00', numericValue: 350.00, date: '05/02/2023', status: 'Pago' },
        { type: 'receita', description: 'Venda de Periféricos', value: 'R$ 150,00', numericValue: 150.00, date: '06/02/2023', status: 'Pago' },
        { type: 'despesa', description: 'Aluguel Loja', value: 'R$ 1.200,00', numericValue: 1200.00, date: '10/02/2023', status: 'Pendente' },
        { type: 'receita', description: 'Pgto OS #1004 - Escola Aprender', value: 'R$ 450,00', numericValue: 450.00, date: '12/02/2023', status: 'Pago' },
        { type: 'despesa', description: 'Compra de Peças (Kabum)', value: 'R$ 890,00', numericValue: 890.00, date: '13/02/2023', status: 'Pago' },
        { type: 'receita', description: 'Serviço Avulso', value: 'R$ 80,00', numericValue: 80.00, date: '15/02/2023', status: 'Pago' },
        { type: 'despesa', description: 'Internet Fibra', value: 'R$ 120,00', numericValue: 120.00, date: '15/02/2023', status: 'Pendente' },
        { type: 'receita', description: 'Pgto OS #1008 - Roberto', value: 'R$ 80,00', numericValue: 80.00, date: '20/02/2023', status: 'Pago' }
      ];

      // Recreate Stores
      recreateStore('clients', clients);
      recreateStore('products', products);
      recreateStore('services', services);
      recreateStore('orders', orders);
      recreateStore('sales', sales);
      recreateStore('transactions', transactions);

      // Settings Store (Special case, key-value)
      if (db.objectStoreNames.contains('settings')) {
        db.deleteObjectStore('settings');
      }
      const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
      settingsStore.add({ 
          key: 'company', 
          value: {
              name: 'Map-OS Tecnologia',
              cnpj: '00.000.000/0001-00',
              email: 'contato@mapos.com.br',
              phone: '(11) 99999-9999',
              address: 'Rua Exemplo, 123 - Centro',
              theme: 'Padrão'
          }
      });

    };
  });
};

// Generic Helpers
const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export const getAll = async <T>(storeName: string): Promise<T[]> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addItem = async <T>(storeName: string, item: T): Promise<number> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
};

export const deleteItem = async (storeName: string, id: number): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const updateItem = async <T>(storeName: string, item: T): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Specific Helpers
export const getSettings = async (): Promise<CompanySettings | null> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('settings', 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get('company');
        request.onsuccess = () => {
             resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => reject(request.error);
    });
};

export const saveSettings = async (settings: CompanySettings): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('settings', 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put({ key: 'company', value: settings });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getDashboardStats = async () => {
    const clients = (await getAll('clients')).length;
    const products = (await getAll('products')).length;
    const services = (await getAll('services')).length;
    const orders = (await getAll('orders')).length;
    
    // Calculate finance logic simply
    const transactions = await getAll<Transaction>('transactions');
    const revenue = transactions
        .filter(t => t.type === 'receita')
        .reduce((acc, curr) => acc + curr.numericValue, 0);
    const expenses = transactions
        .filter(t => t.type === 'despesa')
        .reduce((acc, curr) => acc + curr.numericValue, 0);

    return { clients, products, services, orders, revenue, expenses };
};