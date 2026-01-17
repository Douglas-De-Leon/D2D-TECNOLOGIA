
import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, Eye, UserPlus, FileText, Package, Plus, X, Wrench, AlertTriangle, Printer, Paperclip, UploadCloud, Calendar, User, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem, getSettings } from '../services/db';
import { Order, Client, Service, Product, OrderItem, SystemUser, FileDocument, CompanySettings } from '../types';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  
  // Listas auxiliares para seleção
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [techList, setTechList] = useState<SystemUser[]>([]); // Lista de técnicos/gerentes
  
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

  // Estados para Visualização
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [orderToView, setOrderToView] = useState<Order | null>(null);
  const [attachedFile, setAttachedFile] = useState<FileDocument | null>(null);

  // Estados para Termos de Aceite
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Estado para Anexo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  // --- Helpers de Moeda ---
  const currencyToNumber = (currencyStr: string): number => {
    if (!currencyStr) return 0;
    const cleanStr = currencyStr.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const numberToCurrency = (num: number): string => {
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const loadData = async () => {
    const data = await getAll<Order>('orders');
    
    // Obtém usuário atual novamente para garantir (closure issue in useEffect sometimes)
    const stored = localStorage.getItem('mapos_user');
    const user: SystemUser | null = stored ? JSON.parse(stored) : null;
    
    let filteredData = data.sort((a, b) => (b.id || 0) - (a.id || 0));

    // FILTRO
    if (user) {
        if (user.level === 'client') {
             filteredData = filteredData.filter(o => o.client.toLowerCase() === user.name.toLowerCase());
        } else if (user.level === 'technician') {
             // Manter filtro por responsavel para tecnico:
             filteredData = filteredData.filter(o => o.responsible === user.name);
        }
    }

    setOrders(filteredData);
  };

  const loadAuxData = async () => {
      const clients = await getAll<Client>('clients');
      const services = await getAll<Service>('services');
      const products = await getAll<Product>('products');
      const users = await getAll<SystemUser>('users');
      
      setClientsList(clients);
      setServicesList(services);
      setProductsList(products);

      // Filtra usuários que podem ser responsáveis (Admin, Manager, Technician)
      const techs = users.filter(u => ['admin', 'manager', 'technician'].includes(u.level));
      setTechList(techs);
  }

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
    setSelectedFile(null); // Reset file
    setTermsAccepted(false); // Reset terms
    
    if (order) {
      setFormData({
        ...order,
        services_list: order.services_list || [],
        products_list: order.products_list || []
      });
      setIsEditing(true);
    } else {
      setFormData({
        client: isClientLevel && currentUser ? currentUser.name : '', // Auto-fill se for cliente
        responsible: (isTechnicianLevel && currentUser) ? currentUser.name : '', // Auto-fill se for técnico criando
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

  // --- Visualizar OS ---
  const handleViewClick = async (order: Order) => {
    setOrderToView(order);
    
    // Buscar anexo vinculado (Simulação baseada na descrição)
    const allFiles = await getAll<FileDocument>('files');
    const relatedFile = allFiles.find(f => f.description.startsWith(`Anexo da OS #${order.id}`));
    setAttachedFile(relatedFile || null);

    setIsViewModalOpen(true);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.type !== 'application/pdf') {
              alert('Apenas arquivos PDF são permitidos.');
              e.target.value = '';
              return;
          }
          setSelectedFile(file);
      }
  };

  const saveFileAttachment = async (osId: number) => {
      if (!selectedFile || !currentUser) return;

      const fileData: FileDocument = {
          name: selectedFile.name,
          client: formData.client || currentUser.name,
          date: new Date().toLocaleDateString('pt-BR'),
          description: `Anexo da OS #${osId}: ${formData.description?.substring(0, 30)}...`,
          type: selectedFile.name.split('.').pop()?.toLowerCase() || 'file',
          size: (selectedFile.size / 1024).toFixed(2) + ' KB',
          url: URL.createObjectURL(selectedFile) // Em um app real, seria o upload para storage
      };

      await addItem('files', fileData);
      console.log('Arquivo anexado com sucesso');
  };

  // Intercepta o Submit para mostrar os Termos
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Se já estiver editando uma OS existente que não muda de status crítico, talvez não precise de termo sempre.
      // Mas o pedido foi "antes de finalizar". Vamos mostrar sempre que salvar para garantir.
      setIsTermsModalOpen(true);
  };

  // Salva de fato após aceitar os termos
  const confirmSave = async () => {
    try {
      const servicesCount = formData.services_list?.length || 0;
      const productsCount = formData.products_list?.length || 0;
      const summaryService = servicesCount > 0 
        ? `${formData.services_list![0].name}${servicesCount > 1 ? ` + ${servicesCount - 1} serv.` : ''}` 
        : (productsCount > 0 ? 'Apenas Produtos' : '-');

      const dataToSave = {
        ...formData,
        service: summaryService
      };

      let savedId = 0;

      if (isEditing && formData.id) {
        await updateItem('orders', dataToSave);
        savedId = formData.id;
      } else {
        savedId = await addItem('orders', dataToSave);
      }

      // Se houver arquivo para salvar
      if (selectedFile) {
          await saveFileAttachment(savedId);
      }

      setIsTermsModalOpen(false);
      setIsModalOpen(false);
      loadData();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar ordem de serviço");
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Geração de PDF ---
  const handlePrint = async (order: Order) => {
     // ... (mesmo código de impressão) ...
    try {
        const settings = await getSettings();
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        let currentY = 15;

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
        doc.setLineWidth(0.5);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 8;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Ordem de Serviço Nº ${order.id}`, margin, currentY);
        doc.setFontSize(12);
        doc.setTextColor(100);
        const statusText = `Status: ${order.status}`;
        const statusWidth = doc.getTextWidth(statusText);
        doc.text(statusText, pageWidth - margin - statusWidth, currentY);
        doc.setTextColor(0);
        currentY += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Detalhes do Cliente", margin, currentY);
        doc.text("Detalhes do Serviço", pageWidth / 2 + 5, currentY);
        currentY += 5;
        doc.setFont("helvetica", "normal");
        doc.text(`Cliente: ${order.client}`, margin, currentY);
        currentY += 5;
        doc.text(`Data Entrada: ${order.dateInit}`, margin, currentY);
        const rightColX = pageWidth / 2 + 5;
        currentY -= 5; 
        doc.text(`Técnico Responsável: ${order.responsible || 'Não informado'}`, rightColX, currentY);
        currentY += 10;
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 15, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("Descrição do Problema / Serviço:", margin + 2, currentY + 5);
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(order.description || "Sem descrição.", pageWidth - (margin * 2) - 4);
        doc.text(descLines, margin + 2, currentY + 10);
        currentY += 25;
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
                headStyles: { fillColor: [59, 130, 246] },
            });
            currentY = (doc as any).lastAutoTable.finalY + 10;
        }
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
                    numberToCurrency(s.price * s.quantity)
                ]),
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] },
            });
            currentY = (doc as any).lastAutoTable.finalY + 10;
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const totalText = `Valor Total: ${order.total}`;
        const totalWidth = doc.getTextWidth(totalText);
        doc.text(totalText, pageWidth - margin - totalWidth, currentY);
        currentY += 20;
        if (currentY > 250) {
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
        const warranty = settings?.warrantyText || "Garantia padrão de 90 dias.";
        const warrantyLines = doc.splitTextToSize(warranty, pageWidth - (margin * 2));
        doc.text(warrantyLines, margin, currentY);
        const pageHeight = doc.internal.pageSize.getHeight();
        const signY = pageHeight - 30;
        doc.line(pageWidth / 2 - 40, signY, pageWidth / 2 + 40, signY);
        doc.setFontSize(8);
        doc.text("Assinatura do Cliente", pageWidth / 2, signY + 5, { align: "center" });
        doc.save(`OS_${order.id}_${order.client}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF", error);
        alert("Erro ao gerar PDF.");
    }
  };

  const selectClient = (clientName: string) => {
      setFormData({ ...formData, client: clientName });
      setIsClientSelectOpen(false);
      setSearchTerm('');
  };

  const addService = (service: Service) => {
      const priceNumber = currencyToNumber(service.price);
      const newItem: OrderItem = {
          id: Math.random().toString(36).substr(2, 9),
          originalId: service.id,
          name: service.name,
          price: priceNumber,
          quantity: 1,
          type: 'service'
      };
      setFormData(prev => ({ ...prev, services_list: [...(prev.services_list || []), newItem] }));
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
          quantity: 1,
          type: 'product'
      };
      setFormData(prev => ({ ...prev, products_list: [...(prev.products_list || []), newItem] }));
      setIsProductSelectOpen(false);
      setSearchTerm('');
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
      <PageHeader 
        title="Ordens de Serviço" 
        buttonLabel="Adicionar OS" 
        onButtonClick={() => openModal()} 
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* ... (Search and Table Header) ... */}
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
                            title="Visualizar Detalhes"
                            onClick={() => handleViewClick(os)}
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button 
                            className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" 
                            title="Imprimir PDF"
                            onClick={() => handlePrint(os)}
                        >
                            <Printer className="h-4 w-4" />
                        </button>
                        {(!isClientLevel || os.status === 'Aberto') && (
                             <button 
                                className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600" 
                                title="Editar"
                                onClick={() => openModal(os)}
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                        )}
                        {!isClientLevel && (
                             <button 
                                className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600" 
                                title="Excluir"
                                onClick={() => handleDeleteClick(os)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes da OS (View Only) */}
      <Modal
         isOpen={isViewModalOpen}
         onClose={() => setIsViewModalOpen(false)}
         title={`Detalhes da OS #${orderToView?.id || ''}`}
      >
        {/* ... (conteúdo do modal view) ... */}
        {orderToView && (
            <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase ${orderToView.statusColor}`}>
                            {orderToView.status}
                         </span>
                         <p className="text-xs text-gray-400 mt-2">Data Inicial: <span className="text-gray-600">{orderToView.dateInit}</span></p>
                    </div>
                    <div className="text-right">
                         <p className="text-sm font-bold text-gray-800">Total</p>
                         <p className="text-2xl font-bold text-brand-blue">{orderToView.total}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold flex items-center mb-1"><User className="h-3 w-3 mr-1"/> Cliente</p>
                        <p className="text-sm font-medium text-gray-800">{orderToView.client}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold flex items-center mb-1"><UserPlus className="h-3 w-3 mr-1"/> Responsável</p>
                        <p className="text-sm font-medium text-gray-800">{orderToView.responsible || 'Não definido'}</p>
                    </div>
                </div>

                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Descrição / Defeito</p>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 min-h-[60px] border border-gray-200">
                        {orderToView.description || 'Sem descrição.'}
                    </div>
                </div>

                {attachedFile && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-center justify-between">
                        <div className="flex items-center overflow-hidden">
                            <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                                <FileText className="h-5 w-5 text-brand-blue" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{attachedFile.name}</p>
                                <p className="text-xs text-gray-500">{attachedFile.size} • {attachedFile.date}</p>
                            </div>
                        </div>
                        <a 
                            href={attachedFile.url} 
                            download={attachedFile.name}
                            className="ml-4 p-2 bg-white text-brand-blue rounded-full shadow-sm hover:bg-blue-100 transition-colors"
                            title="Baixar Anexo"
                        >
                            <Download className="h-4 w-4" />
                        </a>
                    </div>
                )}

                {(orderToView.services_list && orderToView.services_list.length > 0) && (
                    <div>
                         <p className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center"><Wrench className="h-3 w-3 mr-1"/> Serviços</p>
                         <div className="border rounded-md overflow-hidden text-sm">
                             <table className="w-full">
                                 <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                                     <tr>
                                         <th className="px-3 py-2 text-left">Serviço</th>
                                         <th className="px-3 py-2 text-right">Valor</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-100">
                                     {orderToView.services_list.map((s, idx) => (
                                         <tr key={idx}>
                                             <td className="px-3 py-2">{s.name}</td>
                                             <td className="px-3 py-2 text-right">{numberToCurrency(s.price * s.quantity)}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                )}

                {(orderToView.products_list && orderToView.products_list.length > 0) && (
                    <div>
                         <p className="text-xs text-gray-400 uppercase font-bold mb-1 flex items-center"><Package className="h-3 w-3 mr-1"/> Produtos</p>
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
                                     {orderToView.products_list.map((p, idx) => (
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
                         <ShieldCheck className="h-3 w-3 mr-1" /> Termo de Garantia
                     </h4>
                     <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed text-justify">
                        {settings?.warrantyText || "Termo padrão não configurado."}
                     </p>
                     <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                         <CheckCircle className="h-3 w-3 mr-1" />
                         Aceite registrado no ato da finalização.
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar OS" : "Nova Ordem de Serviço"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* ... (conteúdo do form) ... */}
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

            <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                <div className="mb-4">
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
                        {isClientLevel ? (
                            <input 
                                type="text" 
                                name="responsible" 
                                value={formData.responsible} 
                                readOnly 
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                            />
                        ) : (
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
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
                        <input type="text" name="dateInit" value={formData.dateInit} onChange={handleChange} placeholder="DD/MM/AAAA" className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                         {isClientLevel ? (
                            <input type="text" value={formData.status} readOnly className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100" />
                        ) : (
                             <select name="status" value={formData.status} onChange={handleStatusChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                                <option value="Aberto">Aberto</option>
                                <option value="Orçamento">Orçamento</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        )}
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

                <div className="mt-4 border-t pt-4">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Anexo / Arquivo (Opcional)</label>
                     <div className="flex items-center space-x-2">
                         <label className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 flex items-center hover:bg-gray-50 text-sm text-gray-600 shadow-sm">
                             <Paperclip className="h-4 w-4 mr-2 text-gray-400"/>
                             {selectedFile ? selectedFile.name : "Selecionar arquivo..."}
                             <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                         </label>
                         {selectedFile && (
                             <button type="button" onClick={() => setSelectedFile(null)} className="text-red-400 hover:text-red-600">
                                 <X className="h-4 w-4" />
                             </button>
                         )}
                     </div>
                     <p className="text-xs text-gray-500 mt-1">Apenas arquivos PDF são permitidos.</p>
                </div>
            </div>

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
                                            {(!isClientLevel || formData.status === 'Aberto') && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeItem(item.id, 'service')}
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
                                        <td className="px-4 py-2 text-center">
                                            {(!isClientLevel || formData.status === 'Aberto') ? (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateProductQuantity(item.id, parseInt(e.target.value) || 1)}
                                                    className="w-16 text-center border border-gray-300 rounded-md p-1 text-sm focus:ring-1 focus:ring-brand-blue outline-none"
                                                />
                                            ) : (
                                                <span className="text-gray-700">{item.quantity}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right">{numberToCurrency(item.price)}</td>
                                        <td className="px-4 py-2 text-right font-medium">{numberToCurrency(item.price * item.quantity)}</td>
                                        <td className="px-4 py-2 text-center">
                                            {(!isClientLevel || formData.status === 'Aberto') && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeItem(item.id, 'product')}
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

            <div className="flex justify-end pt-2 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600">Salvar</button>
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
                <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Termos de Garantia</h4>
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
                        Li e concordo com os Termos de Garantia
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

      {/* Modais de Seleção (Cliente, Serviço, Produto, Exclusão) */}
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
