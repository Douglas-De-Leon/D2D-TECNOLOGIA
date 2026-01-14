import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, Eye, UserPlus, FileText, Package, Plus, X, Wrench, AlertTriangle, Printer } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem, getSettings } from '../services/db';
import { Order, Client, Service, Product, OrderItem } from '../types';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Listas auxiliares para seleção
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  
  // Controle dos Modais de Seleção
  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false);
  const [isServiceSelectOpen, setIsServiceSelectOpen] = useState(false);
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Controle de Abas no Modal
  const [activeTab, setActiveTab] = useState<'details' | 'products' | 'services'>('details');

  // Estados para Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const [formData, setFormData] = useState<Order>({
    client: '',
    responsible: '',
    dateInit: '',
    status: 'Aberto',
    statusColor: 'bg-green-500',
    total: 'R$ 0,00',
    description: '',
    service: '',
    services_list: [],
    products_list: []
  });

  const [isEditing, setIsEditing] = useState(false);

  // --- Helpers de Moeda ---
  const currencyToNumber = (currencyStr: string): number => {
    if (!currencyStr) return 0;
    // Remove "R$", espaços, pontos de milhar e troca vírgula por ponto
    const cleanStr = currencyStr.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const numberToCurrency = (num: number): string => {
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const loadData = async () => {
    const data = await getAll<Order>('orders');
    setOrders(data.sort((a, b) => (b.id || 0) - (a.id || 0)));
  };

  const loadAuxData = async () => {
      const clients = await getAll<Client>('clients');
      const services = await getAll<Service>('services');
      const products = await getAll<Product>('products');
      setClientsList(clients);
      setServicesList(services);
      setProductsList(products);
  }

  useEffect(() => {
    loadData();
    loadAuxData();
  }, []);

  // --- Cálculo Automático do Total ---
  useEffect(() => {
    if (isModalOpen) {
        const servicesTotal = (formData.services_list || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const productsTotal = (formData.products_list || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const grandTotal = servicesTotal + productsTotal;
        
        setFormData(prev => ({
            ...prev,
            total: numberToCurrency(grandTotal)
        }));
    }
  }, [formData.services_list, formData.products_list, isModalOpen]);

  const openModal = (order?: Order) => {
    setActiveTab('details');
    if (order) {
      // Garantir que as listas existam, mesmo que vazias (para compatibilidade com registros antigos)
      setFormData({
        ...order,
        services_list: order.services_list || [],
        products_list: order.products_list || []
      });
      setIsEditing(true);
    } else {
      setFormData({
        client: '',
        responsible: '',
        dateInit: new Date().toLocaleDateString('pt-BR'),
        status: 'Aberto',
        statusColor: 'bg-green-500',
        total: 'R$ 0,00',
        description: '',
        service: '',
        services_list: [],
        products_list: []
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    let color = 'bg-gray-500';
    switch (status) {
        case 'Aberto': color = 'bg-green-500'; break;
        case 'Em Andamento': color = 'bg-blue-500'; break;
        case 'Orçamento': color = 'bg-yellow-500'; break;
        case 'Cancelado': color = 'bg-red-500'; break;
        case 'Finalizado': color = 'bg-gray-500'; break;
        default: color = 'bg-gray-500';
    }
    setFormData({ ...formData, status, statusColor: color });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Atualiza o campo "service" principal com um resumo para a tabela
      const servicesCount = formData.services_list?.length || 0;
      const productsCount = formData.products_list?.length || 0;
      const summaryService = servicesCount > 0 
        ? `${formData.services_list![0].name}${servicesCount > 1 ? ` + ${servicesCount - 1} serv.` : ''}` 
        : (productsCount > 0 ? 'Apenas Produtos' : '-');

      const dataToSave = {
        ...formData,
        service: summaryService
      };

      if (isEditing && formData.id) {
        await updateItem('orders', dataToSave);
      } else {
        await addItem('orders', dataToSave);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar ordem de serviço");
    }
  };

  // Abre o modal de confirmação
  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  // Executa a exclusão de fato
  const confirmDelete = async () => {
    if (orderToDelete && orderToDelete.id) {
        const success = await deleteItem('orders', orderToDelete.id);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setOrderToDelete(null);
        } else {
            alert("Erro ao excluir OS.");
        }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Geração de PDF ---
  const handlePrint = async (order: Order) => {
    try {
        const settings = await getSettings();
        const doc = new jsPDF();

        // --- Configurações Visuais ---
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        const lineStart = 45;
        let currentY = 15;

        // --- Cabeçalho da Empresa ---
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(settings?.name || "Empresa Exemplo", margin, currentY);
        
        currentY += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        if (settings?.address) {
            doc.text(settings.address, margin, currentY);
            currentY += 5;
        }
        
        const contactInfo = [
            settings?.phone ? `Tel: ${settings.phone}` : '',
            settings?.email ? `Email: ${settings.email}` : '',
            settings?.cnpj ? `CNPJ: ${settings.cnpj}` : ''
        ].filter(Boolean).join(' | ');
        
        if (contactInfo) {
            doc.text(contactInfo, margin, currentY);
            currentY += 8;
        } else {
            currentY += 3;
        }

        // Linha divisória
        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;

        // --- Título da OS e Status ---
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Ordem de Serviço Nº ${order.id}`, margin, currentY);
        
        // Status alinhado à direita
        doc.setFontSize(12);
        doc.setTextColor(100);
        const statusText = `Status: ${order.status}`;
        const statusWidth = doc.getTextWidth(statusText);
        doc.text(statusText, pageWidth - margin - statusWidth, currentY);
        doc.setTextColor(0); // Reset cor

        currentY += 10;

        // --- Dados do Cliente e Responsável ---
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Detalhes do Cliente", margin, currentY);
        doc.text("Detalhes do Serviço", pageWidth / 2 + 5, currentY);
        
        currentY += 5;
        doc.setFont("helvetica", "normal");
        
        // Coluna Esquerda
        doc.text(`Cliente: ${order.client}`, margin, currentY);
        currentY += 5;
        doc.text(`Data Entrada: ${order.dateInit}`, margin, currentY);
        
        // Coluna Direita (resetando Y para alinhar)
        const rightColX = pageWidth / 2 + 5;
        currentY -= 5; 
        doc.text(`Técnico Responsável: ${order.responsible || 'Não informado'}`, rightColX, currentY);
        currentY += 10;

        // --- Descrição ---
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 15, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("Descrição do Problema / Serviço:", margin + 2, currentY + 5);
        doc.setFont("helvetica", "normal");
        
        // Split text para caber na largura
        const descLines = doc.splitTextToSize(order.description || "Sem descrição.", pageWidth - (margin * 2) - 4);
        doc.text(descLines, margin + 2, currentY + 10);
        
        currentY += 25;

        // --- Tabela de Produtos ---
        if (order.products_list && order.products_list.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Produtos Utilizados", margin, currentY);
            currentY += 2;
            
            autoTable(doc, {
                startY: currentY,
                head: [['Produto', 'Qtd', 'Preço Unit.', 'Subtotal']],
                body: order.products_list.map(p => [
                    p.name,
                    p.quantity,
                    numberToCurrency(p.price),
                    numberToCurrency(p.price * p.quantity)
                ]),
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }, // Brand Blue
            });
            // Atualiza Y baseado no final da tabela
            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // --- Tabela de Serviços ---
        if (order.services_list && order.services_list.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Serviços Realizados", margin, currentY);
            currentY += 2;
            
            autoTable(doc, {
                startY: currentY,
                head: [['Serviço', 'Preço', 'Subtotal']],
                body: order.services_list.map(s => [
                    s.name,
                    numberToCurrency(s.price),
                    numberToCurrency(s.price * s.quantity) // Qtd é sempre 1 no modal atual, mas preparado para futuro
                ]),
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
            });
            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // --- Totais ---
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const totalText = `Valor Total: ${order.total}`;
        const totalWidth = doc.getTextWidth(totalText);
        doc.text(totalText, pageWidth - margin - totalWidth, currentY);

        // --- Termos de Garantia (Footer) ---
        currentY += 20;
        
        if (currentY > 250) { // Se estiver muito em baixo, cria nova página
            doc.addPage();
            currentY = 20;
        }

        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 5;

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Termos de Garantia e Condições:", margin, currentY);
        currentY += 4;
        doc.setFont("helvetica", "normal");
        
        const warranty = settings?.warrantyText || "Garantia padrão de 90 dias conforme lei vigente.";
        const warrantyLines = doc.splitTextToSize(warranty, pageWidth - (margin * 2));
        doc.text(warrantyLines, margin, currentY);

        // --- Assinatura ---
        const pageHeight = doc.internal.pageSize.getHeight();
        const signY = pageHeight - 30;
        
        doc.line(pageWidth / 2 - 40, signY, pageWidth / 2 + 40, signY);
        doc.setFontSize(8);
        doc.text("Assinatura do Cliente", pageWidth / 2, signY + 5, { align: "center" });

        // Salvar PDF
        doc.save(`OS_${order.id}_${order.client}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF", error);
        alert("Erro ao gerar PDF. Verifique o console.");
    }
  };

  // --- Funções de Seleção e Manipulação de Listas ---
  
  const selectClient = (clientName: string) => {
      setFormData({ ...formData, client: clientName });
      setIsClientSelectOpen(false);
      setSearchTerm('');
  };

  const addService = (service: Service) => {
      const priceNumber = currencyToNumber(service.price);
      const newItem: OrderItem = {
          id: Math.random().toString(36).substr(2, 9), // ID Temp para UI
          originalId: service.id,
          name: service.name,
          price: priceNumber,
          quantity: 1,
          type: 'service'
      };

      setFormData(prev => ({
          ...prev,
          services_list: [...(prev.services_list || []), newItem]
      }));
      setIsServiceSelectOpen(false);
      setSearchTerm('');
  };

  const addProduct = (product: Product) => {
      const priceNumber = currencyToNumber(product.price);
      const newItem: OrderItem = {
          id: Math.random().toString(36).substr(2, 9),
          originalId: product.id,
          name: product.name,
          price: priceNumber,
          quantity: 1, // Padrão 1
          type: 'product'
      };

      setFormData(prev => ({
          ...prev,
          products_list: [...(prev.products_list || []), newItem]
      }));
      setIsProductSelectOpen(false);
      setSearchTerm('');
  };

  const removeItem = (id: string, type: 'service' | 'product') => {
      if (type === 'service') {
          setFormData(prev => ({
              ...prev,
              services_list: prev.services_list?.filter(item => item.id !== id)
          }));
      } else {
           setFormData(prev => ({
              ...prev,
              products_list: prev.products_list?.filter(item => item.id !== id)
          }));
      }
  };

  const filteredClients = clientsList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredServices = servicesList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProducts = productsList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <PageHeader title="Ordens de Serviço" buttonLabel="Adicionar OS" onButtonClick={() => openModal()} />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
             <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Todas</button>
             <button className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200">Abertas</button>
          </div>
          <div className="relative w-full sm:w-auto">
             <input type="text" placeholder="Pesquisar..." className="pl-8 pr-4 py-2 border rounded-md text-sm outline-none w-full sm:w-64 focus:ring-1 focus:ring-brand-blue" />
             <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Nº OS</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Resumo Serviço</th>
                <th className="px-6 py-3 font-medium">Data Inicial</th>
                <th className="px-6 py-3 font-medium">Valor Total</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Nenhuma OS encontrada.</td></tr>
              ) : (
                orders.map((os) => (
                    <tr key={os.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-800">{os.id}</td>
                    <td className="px-6 py-4">{os.client}</td>
                    <td className="px-6 py-4 truncate max-w-[150px]" title={os.service}>{os.service || '-'}</td>
                    <td className="px-6 py-4">{os.dateInit}</td>
                    <td className="px-6 py-4 font-bold text-gray-700">{os.total}</td>
                    <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${os.statusColor}`}>
                        {os.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center space-x-1">
                        <button 
                            className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" 
                            title="Visualizar / Imprimir PDF"
                            onClick={() => handlePrint(os)}
                        >
                            <Printer className="h-4 w-4" />
                        </button>
                        <button 
                            className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600" 
                            title="Editar"
                            onClick={() => openModal(os)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                            className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600" 
                            title="Excluir"
                            onClick={() => handleDeleteClick(os)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar OS" : "Nova Ordem de Serviço"}
      >
        <form onSubmit={handleSave} className="space-y-4">
            
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 mb-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 py-2 text-sm font-medium text-center ${activeTab === 'details' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Geral
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className={`flex-1 py-2 text-sm font-medium text-center ${activeTab === 'services' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Serviços ({formData.services_list?.length || 0})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 py-2 text-sm font-medium text-center ${activeTab === 'products' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Produtos ({formData.products_list?.length || 0})
                </button>
            </div>

            {/* TAB: GERAL */}
            <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                {/* Cliente Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Cliente</label>
                    <div className="flex mt-1">
                        <input 
                            type="text" 
                            name="client" 
                            required 
                            readOnly
                            value={formData.client} 
                            placeholder="Selecione um cliente"
                            className="block w-full border border-gray-300 rounded-l-md p-2 bg-gray-50 cursor-pointer"
                            onClick={() => setIsClientSelectOpen(true)}
                        />
                        <button 
                            type="button"
                            onClick={() => setIsClientSelectOpen(true)}
                            className="bg-brand-blue text-white px-3 rounded-r-md hover:bg-blue-600"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Descrição do Problema / Serviço</label>
                    <textarea 
                        name="description" 
                        rows={3} 
                        value={formData.description || ''} 
                        onChange={handleChange} 
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        placeholder="Descreva os detalhes da OS..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Responsável</label>
                        <input type="text" name="responsible" value={formData.responsible} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
                        <input type="text" name="dateInit" value={formData.dateInit} onChange={handleChange} placeholder="DD/MM/AAAA" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" value={formData.status} onChange={handleStatusChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                            <option value="Aberto">Aberto</option>
                            <option value="Orçamento">Orçamento</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Finalizado">Finalizado</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor Total (Automático)</label>
                        <input 
                            type="text" 
                            name="total" 
                            readOnly 
                            value={formData.total} 
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100 font-bold text-gray-800" 
                        />
                    </div>
                </div>
            </div>

            {/* TAB: SERVIÇOS */}
            <div className={activeTab === 'services' ? 'block' : 'hidden'}>
                <div className="flex justify-end mb-2">
                    <button 
                        type="button" 
                        onClick={() => setIsServiceSelectOpen(true)}
                        className="flex items-center text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 hover:bg-green-100"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Adicionar Serviço
                    </button>
                </div>
                
                <div className="border rounded-md overflow-hidden bg-gray-50 min-h-[150px]">
                    {(!formData.services_list || formData.services_list.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                            <Wrench className="h-8 w-8 mb-2 opacity-50" />
                            Nenhum serviço adicionado.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                             <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-2">Serviço</th>
                                    <th className="px-4 py-2 text-right">Preço</th>
                                    <th className="px-4 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.services_list.map((item) => (
                                    <tr key={item.id} className="bg-white">
                                        <td className="px-4 py-2">{item.name}</td>
                                        <td className="px-4 py-2 text-right">{numberToCurrency(item.price)}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(item.id, 'service')}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* TAB: PRODUTOS */}
            <div className={activeTab === 'products' ? 'block' : 'hidden'}>
                <div className="flex justify-end mb-2">
                     <button 
                        type="button" 
                        onClick={() => setIsProductSelectOpen(true)}
                        className="flex items-center text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 hover:bg-green-100"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Adicionar Produto
                    </button>
                </div>
                
                 <div className="border rounded-md overflow-hidden bg-gray-50 min-h-[150px]">
                    {(!formData.products_list || formData.products_list.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                            <Package className="h-8 w-8 mb-2 opacity-50" />
                            Nenhum produto adicionado.
                        </div>
                    ) : (
                         <table className="w-full text-sm text-left">
                             <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-2">Produto</th>
                                    <th className="px-4 py-2 text-center w-16">Qtd</th>
                                    <th className="px-4 py-2 text-right">Unit.</th>
                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                    <th className="px-4 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.products_list.map((item) => (
                                    <tr key={item.id} className="bg-white">
                                        <td className="px-4 py-2">{item.name}</td>
                                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                                        <td className="px-4 py-2 text-right">{numberToCurrency(item.price)}</td>
                                        <td className="px-4 py-2 text-right font-medium">{numberToCurrency(item.price * item.quantity)}</td>
                                        <td className="px-4 py-2 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => removeItem(item.id, 'product')}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-2 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600">Salvar</button>
            </div>
        </form>
      </Modal>

      {/* Modal de Seleção de Cliente */}
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

      {/* Modal de Seleção de Serviço */}
      <Modal
         isOpen={isServiceSelectOpen}
         onClose={() => setIsServiceSelectOpen(false)}
         title="Adicionar Serviço à OS"
      >
         <div className="mb-4">
             <input 
                type="text" 
                placeholder="Buscar serviço..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-blue" 
             />
        </div>
        <div className="max-h-60 overflow-y-auto">
            {filteredServices.map(service => (
                <div 
                    key={service.id} 
                    onClick={() => addService(service)}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group border-b border-gray-100 last:border-0"
                >
                    <div>
                        <p className="font-medium text-gray-800">{service.name}</p>
                        <p className="text-xs text-gray-500">{service.price}</p>
                    </div>
                    <FileText className="h-4 w-4 text-gray-400 group-hover:text-brand-blue" />
                </div>
            ))}
        </div>
      </Modal>

      {/* Modal de Seleção de Produto */}
      <Modal
         isOpen={isProductSelectOpen}
         onClose={() => setIsProductSelectOpen(false)}
         title="Adicionar Produto à OS"
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

      {/* Modal de Confirmação de Exclusão */}
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
                <h4 className="text-lg font-medium text-gray-900">Excluir Ordem de Serviço?</h4>
                <p className="text-sm text-gray-500 mt-2">
                    Você tem certeza que deseja excluir a OS <strong>#{orderToDelete?.id}</strong> de <strong>{orderToDelete?.client}</strong>? 
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

export default Orders;