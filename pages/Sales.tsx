
import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, ShoppingCart, Eye, AlertTriangle, Plus, X, Package, UserPlus, ShieldCheck, Calendar, User } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem, getSettings } from '../services/db';
import { Sale, Client, Product, OrderItem, SystemUser, CompanySettings } from '../types';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  
  // Listas Auxiliares
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [techList, setTechList] = useState<SystemUser[]>([]);

  // Modais de Seleção
  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false);
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Sale>({
    client: '',
    responsible: '',
    date: '',
    total: 'R$ 0,00',
    status: 'Aberto',
    details: '',
    products_list: []
  });
  const [isEditing, setIsEditing] = useState(false);

  // Estados para Visualização
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [saleToView, setSaleToView] = useState<Sale | null>(null);

  // Estados para Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // Estados para Termos de Aceite
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Use 'service_sales' instead of 'sales' to avoid ad-blockers
  const TABLE_NAME = 'service_sales';

  useEffect(() => {
    const stored = localStorage.getItem('mapos_user');
    if (stored) {
        setCurrentUser(JSON.parse(stored));
    }
    loadData();
    loadAuxData();
    getSettings().then(setSettings);
  }, []);

  const isClientLevel = currentUser?.level === 'client';
  const isTechnicianLevel = currentUser?.level === 'technician';

  const loadData = async () => {
    const data = await getAll<Sale>(TABLE_NAME);
    const stored = localStorage.getItem('mapos_user');
    const user: SystemUser | null = stored ? JSON.parse(stored) : null;
    
    let filteredData = data.sort((a, b) => (b.id || 0) - (a.id || 0));

    // FILTRO
    if (user) {
        if (user.level === 'client') {
            filteredData = filteredData.filter(s => s.client.toLowerCase() === user.name.toLowerCase());
        } else if (user.level === 'technician') {
             // Técnico vê apenas Vendas onde ele é responsável
             filteredData = filteredData.filter(s => s.responsible === user.name);
        }
    }

    setSales(filteredData);
  };

  const loadAuxData = async () => {
      const clients = await getAll<Client>('clients');
      const products = await getAll<Product>('products');
      const users = await getAll<SystemUser>('users');
      
      setClientsList(clients);
      setProductsList(products);

      // Filtra usuários que podem ser responsáveis (Admin, Manager, Technician)
      const techs = users.filter(u => ['admin', 'manager', 'technician'].includes(u.level));
      setTechList(techs);
  };

  // --- Helpers de Moeda ---
  const currencyToNumber = (currencyStr: string): number => {
    if (!currencyStr) return 0;
    const cleanStr = currencyStr.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const numberToCurrency = (num: number): string => {
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- Cálculo Automático do Total ---
  useEffect(() => {
    if (isModalOpen) {
        const productsTotal = (formData.products_list || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setFormData(prev => ({
            ...prev,
            total: numberToCurrency(productsTotal)
        }));
    }
  }, [formData.products_list, isModalOpen]);

  const openModal = (sale?: Sale) => {
    setTermsAccepted(false); // Reset terms
    if (sale) {
      setFormData({
          ...sale,
          responsible: sale.responsible || '',
          products_list: sale.products_list || []
      });
      setIsEditing(true);
    } else {
      setFormData({
        client: isClientLevel && currentUser ? currentUser.name : '',
        responsible: (isTechnicianLevel && currentUser) ? currentUser.name : '',
        date: new Date().toLocaleDateString('pt-BR'),
        total: 'R$ 0,00',
        status: 'Aberto',
        details: '',
        products_list: []
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  // Visualizar Venda
  const handleViewClick = (sale: Sale) => {
      setSaleToView(sale);
      setIsViewModalOpen(true);
  };

  // Intercepta o Submit para mostrar os Termos
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsTermsModalOpen(true);
  };

  // Salva de fato após aceitar os termos
  const confirmSave = async () => {
    try {
      if (isEditing && formData.id) {
        await updateItem(TABLE_NAME, formData);
      } else {
        const newId = await addItem(TABLE_NAME, formData);
        if (newId === 0) {
            throw new Error("Falha ao criar venda. Verifique a conexão.");
        }
      }
      setIsTermsModalOpen(false);
      setIsModalOpen(false);
      loadData();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar venda.");
    }
  };

  // Abre o modal de confirmação
  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale);
    setIsDeleteModalOpen(true);
  };

  // Executa a exclusão de fato
  const confirmDelete = async () => {
    if (saleToDelete && saleToDelete.id) {
        const success = await deleteItem(TABLE_NAME, saleToDelete.id);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setSaleToDelete(null);
        } else {
            alert("Erro ao excluir venda.");
        }
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Faturado': return 'bg-green-500';
          case 'Cancelado': return 'bg-red-500';
          default: return 'bg-yellow-500';
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Funções de Seleção de Cliente e Produtos ---

  const selectClient = (clientName: string) => {
      setFormData({ ...formData, client: clientName });
      setIsClientSelectOpen(false);
      setSearchTerm('');
  };

  const addProduct = (product: Product) => {
      const priceNumber = currencyToNumber(product.price);
      const newItem: OrderItem = {
          id: Math.random().toString(36).substr(2, 9),
          originalId: product.id,
          name: product.name,
          price: priceNumber,
          quantity: 1,
          type: 'product'
      };

      setFormData(prev => ({
          ...prev,
          products_list: [...(prev.products_list || []), newItem]
      }));
      setIsProductSelectOpen(false);
      setSearchTerm('');
  };

  const removeProduct = (id: string) => {
      setFormData(prev => ({
          ...prev,
          products_list: prev.products_list?.filter(item => item.id !== id)
      }));
  };

  const updateProductQuantity = (id: string, newQty: number) => {
      if (newQty < 1) return;
      setFormData(prev => ({
          ...prev,
          products_list: prev.products_list?.map(item => 
              item.id === id ? { ...item, quantity: newQty } : item
          )
      }));
  };

  const filteredClients = clientsList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProducts = productsList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Terminologia Dinâmica
  const pageTitle = isClientLevel ? "Minhas Compras" : "Vendas";
  const btnLabel = isClientLevel ? "Nova Compra" : "Adicionar Venda";
  const modalTitleNew = isClientLevel ? "Nova Compra" : "Nova Venda";
  const modalTitleEdit = isClientLevel ? "Detalhes da Compra" : "Editar Venda";

  return (
    <div>
      <PageHeader 
        title={pageTitle} 
        buttonLabel={btnLabel} 
        onButtonClick={() => openModal()} 
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-end">
          <div className="relative">
             <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="pl-8 pr-4 py-2 border rounded-md text-sm focus:ring-1 focus:ring-brand-blue focus:border-brand-blue outline-none w-64"
             />
             <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Responsável</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Itens</th>
                <th className="px-6 py-3 font-medium">Faturado</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                 <tr><td colSpan={8} className="px-6 py-4 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
              ) : (
                sales.map((sale) => (
                    <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{sale.id}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-2 text-gray-400" />
                            {sale.client}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{sale.responsible || '-'}</td>
                    <td className="px-6 py-4">{sale.date}</td>
                    <td className="px-6 py-4 text-gray-500">
                        {sale.products_list && sale.products_list.length > 0 
                            ? `${sale.products_list.length} itens` 
                            : (sale.details || '-')}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(sale.status)}`}>
                            {sale.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{sale.total}</td>
                    <td className="px-6 py-4 flex justify-center space-x-2">
                         {/* Botão Visualizar - Disponível para todos */}
                         <button 
                            className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" 
                            title="Visualizar Detalhes"
                            onClick={() => handleViewClick(sale)}
                         >
                             <Eye className="h-4 w-4" />
                         </button>

                         {/* Botões de Ação para Admin/Técnico ou Cliente se status Aberto */}
                         {(!isClientLevel || (isClientLevel && sale.status === 'Aberto')) && (
                             <>
                                <button 
                                    className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors" 
                                    title="Editar"
                                    onClick={() => openModal(sale)}
                                >
                                <Edit2 className="h-4 w-4" />
                                </button>
                                {(!isClientLevel) && (
                                    <button 
                                        className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600 transition-colors" 
                                        title="Excluir"
                                        onClick={() => handleDeleteClick(sale)}
                                    >
                                    <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                             </>
                         )}
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Visualização (View Only) */}
      <Modal
         isOpen={isViewModalOpen}
         onClose={() => setIsViewModalOpen(false)}
         title={`Detalhes da Venda #${saleToView?.id || ''}`}
      >
        {saleToView && (
            <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase ${getStatusColor(saleToView.status)}`}>
                            {saleToView.status}
                         </span>
                         <div className="flex items-center text-xs text-gray-400 mt-2">
                             <Calendar className="h-3 w-3 mr-1"/>
                             <span>Data: {saleToView.date}</span>
                         </div>
                    </div>
                    <div className="text-right">
                         <p className="text-sm font-bold text-gray-800">Total</p>
                         <p className="text-2xl font-bold text-brand-blue">{saleToView.total}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold flex items-center mb-1"><User className="h-3 w-3 mr-1"/> Cliente</p>
                        <p className="text-sm font-medium text-gray-800">{saleToView.client}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold flex items-center mb-1"><UserPlus className="h-3 w-3 mr-1"/> Responsável</p>
                        <p className="text-sm font-medium text-gray-800">{saleToView.responsible || 'Não definido'}</p>
                    </div>
                </div>

                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Observações / Detalhes</p>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 min-h-[40px] border border-gray-200">
                        {saleToView.details || 'Sem observações adicionais.'}
                    </div>
                </div>

                {/* Lista de Produtos */}
                {(saleToView.products_list && saleToView.products_list.length > 0) && (
                    <div>
                         <p className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center"><Package className="h-3 w-3 mr-1"/> Itens da Venda</p>
                         <div className="border rounded-md overflow-hidden text-sm">
                             <table className="w-full">
                                 <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                                     <tr>
                                         <th className="px-3 py-2 text-left">Produto</th>
                                         <th className="px-3 py-2 text-center">Qtd</th>
                                         <th className="px-3 py-2 text-right">Valor</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100">
                                     {saleToView.products_list.map((p, idx) => (
                                         <tr key={idx}>
                                             <td className="px-3 py-2">{p.name}</td>
                                             <td className="px-3 py-2 text-center">{p.quantity}</td>
                                             <td className="px-3 py-2 text-right">{numberToCurrency(p.price * p.quantity)}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                )}

                {/* Exibição do Termo de Garantia no View Modal */}
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                         <ShieldCheck className="h-3 w-3 mr-1" /> Termos da Venda / Garantia
                     </h4>
                     <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed text-justify">
                        {settings?.warrantyText || "Termo padrão não configurado."}
                     </p>
                     <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                         <ShieldCheck className="h-3 w-3 mr-1" />
                         Aceite registrado.
                     </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button 
                        onClick={() => setIsViewModalOpen(false)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        )}
      </Modal>

      {/* Modal de Cadastro / Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? modalTitleEdit : modalTitleNew}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Seleção de Cliente */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <div className="flex mt-1">
                    <input 
                        type="text" 
                        name="client" 
                        required 
                        readOnly={isClientLevel}
                        value={formData.client} 
                        placeholder="Selecione um cliente"
                        className="block w-full border border-gray-300 rounded-l-md p-2 bg-gray-50 cursor-pointer"
                        onClick={() => !isClientLevel && setIsClientSelectOpen(true)}
                    />
                    {!isClientLevel && (
                        <button 
                            type="button"
                            onClick={() => setIsClientSelectOpen(true)}
                            className="bg-brand-blue text-white px-3 rounded-r-md hover:bg-blue-600"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
            
            {!isClientLevel && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Responsável</label>
                    <select 
                        name="responsible"
                        value={formData.responsible} 
                        onChange={handleChange as any}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    >
                        <option value="">Selecione um responsável</option>
                        {techList.map(u => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                    </select>
                </div>
            )}
            
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    {isClientLevel ? (
                        <input type="text" value={formData.status} readOnly className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100" />
                    ) : (
                        <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                            <option value="Aberto">Aberto</option>
                            <option value="Faturado">Faturado</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    )}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Total (Auto)</label>
                    <input type="text" name="total" readOnly value={formData.total} className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100 font-bold" />
                </div>
            </div>

            {/* Lista de Produtos */}
            <div className="border-t pt-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Itens da {isClientLevel ? 'Compra' : 'Venda'}</h4>
                    {/* Permitir adicionar item se não for cliente OU se for cliente e status Aberto */}
                    {(!isClientLevel || (isClientLevel && formData.status === 'Aberto')) && (
                        <button 
                            type="button" 
                            onClick={() => setIsProductSelectOpen(true)}
                            className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 hover:bg-green-100 flex items-center"
                        >
                            <Plus className="h-3 w-3 mr-1" /> Adicionar Item
                        </button>
                    )}
                </div>

                <div className="border rounded-md overflow-hidden bg-gray-50 min-h-[150px] max-h-[250px] overflow-y-auto">
                    {(!formData.products_list || formData.products_list.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                            <Package className="h-8 w-8 mb-2 opacity-50" />
                            Nenhum item adicionado.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                             <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-2">Produto</th>
                                    <th className="px-2 py-2 text-center w-16">Qtd</th>
                                    <th className="px-2 py-2 text-right">Unit.</th>
                                    <th className="px-2 py-2 text-right">Total</th>
                                    <th className="px-2 py-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.products_list.map((item) => (
                                    <tr key={item.id} className="bg-white">
                                        <td className="px-4 py-2">{item.name}</td>
                                        <td className="px-2 py-2 text-center">
                                            {/* Permitir editar quantidade se não for cliente ou cliente com status aberto */}
                                            {(!isClientLevel || formData.status === 'Aberto') ? (
                                                 <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value))}
                                                    className="w-12 text-center border rounded p-1 text-xs"
                                                />
                                            ) : (
                                                <span>{item.quantity}</span>
                                            )}
                                        </td>
                                        <td className="px-2 py-2 text-right text-xs">{numberToCurrency(item.price)}</td>
                                        <td className="px-2 py-2 text-right font-medium text-xs">{numberToCurrency(item.price * item.quantity)}</td>
                                        <td className="px-2 py-2 text-center">
                                            {(!isClientLevel || formData.status === 'Aberto') && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeProduct(item.id)}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mt-2">Observações</label>
                <textarea 
                    name="details" 
                    rows={2} 
                    value={formData.details} 
                    onChange={handleChange} 
                    readOnly={isClientLevel && formData.status !== 'Aberto'}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Informações adicionais..."
                ></textarea>
            </div>
             <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">Cancelar</button>
                {(!isClientLevel || formData.status === 'Aberto') && (
                    <button type="submit" className="px-4 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600">Salvar</button>
                )}
            </div>
        </form>
      </Modal>

      {/* NOVO: Modal de Termos de Aceite */}
      <Modal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title="Termo de Garantia e Aceite"
      >
        <div className="flex flex-col h-full">
            <div className="flex items-center mb-4 p-3 bg-blue-50 text-brand-blue rounded-md">
                <ShieldCheck className="h-6 w-6 mr-3" />
                <span className="text-sm font-semibold">É necessário aceitar os termos antes de finalizar.</span>
            </div>
            
            <div className="flex-1 bg-white border border-gray-200 rounded-md p-4 mb-4 overflow-y-auto max-h-60">
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Termos de Garantia / Venda</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed text-justify">
                    {settings?.warrantyText || "Termo padrão de garantia não configurado."}
                </p>
            </div>

            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-5 w-5 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900 select-none">
                        Li e concordo com os Termos
                    </span>
                </label>
            </div>

            <div className="flex justify-end mt-4 pt-2 border-t">
                 <button
                    onClick={() => setIsTermsModalOpen(false)}
                    className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={confirmSave}
                    disabled={!termsAccepted}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm transition-colors ${termsAccepted ? 'bg-brand-blue hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    Confirmar e Salvar
                </button>
            </div>
        </div>
      </Modal>

      <Modal
         isOpen={isClientSelectOpen}
         onClose={() => setIsClientSelectOpen(false)}
         title="Selecionar Cliente"
      >
        <div className="mb-4">
             <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-blue" 
             />
        </div>
        <div className="max-h-60 overflow-y-auto">
            {filteredClients.map(client => (
                <div 
                    key={client.id} 
                    onClick={() => selectClient(client.name)}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group border-b border-gray-100 last:border-0"
                >
                    <div>
                        <p className="font-medium text-gray-800">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.email || client.phone}</p>
                    </div>
                    <UserPlus className="h-4 w-4 text-gray-400 group-hover:text-brand-blue" />
                </div>
            ))}
        </div>
      </Modal>

      <Modal
         isOpen={isProductSelectOpen}
         onClose={() => setIsProductSelectOpen(false)}
         title="Adicionar Item"
      >
         <div className="mb-4">
             <input 
                type="text" 
                placeholder="Buscar produto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-blue" 
             />
        </div>
        <div className="max-h-60 overflow-y-auto">
            {filteredProducts.map(product => (
                <div 
                    key={product.id} 
                    onClick={() => addProduct(product)}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group border-b border-gray-100 last:border-0"
                >
                    <div>
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                             <span>Estoque: {product.stock}</span>
                             <span>•</span>
                             <span>{product.price}</span>
                        </div>
                    </div>
                    <Package className="h-4 w-4 text-gray-400 group-hover:text-brand-blue" />
                </div>
            ))}
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
                <h4 className="text-lg font-medium text-gray-900">Excluir Venda?</h4>
                <p className="text-sm text-gray-500 mt-2">
                    Você tem certeza que deseja excluir a venda de <strong>{saleToDelete?.client}</strong>? 
                    <br/>Esta ação não poderá ser desfeita.
                </p>
            </div>
            <div className="flex w-full space-x-3 mt-4">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={confirmDelete}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Excluir
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sales;
