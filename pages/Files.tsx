import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, FileText, Image, Archive, File, Download, UploadCloud, UserPlus, User, Eye, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { FileDocument, Client, SystemUser } from '../types';
import { jsPDF } from "jspdf";

const Files: React.FC = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  
  // Modais de Edição/Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Modal de Visualização (Preview)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileDocument | null>(null);

  // --- Modal de Exclusão (Novo) ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileDocument | null>(null);
  
  const [formData, setFormData] = useState<FileDocument>({
    name: '',
    client: '',
    date: '',
    description: '',
    type: 'doc',
    size: '0 KB',
    url: '#'
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('mapos_user');
    if (stored) {
        setCurrentUser(JSON.parse(stored));
    }
    loadData();
  }, []);

  const isClientLevel = currentUser?.level === 'client';

  const loadData = async () => {
    try {
      const data = await getAll<FileDocument>('files');
      const clients = await getAll<Client>('clients');
      const stored = localStorage.getItem('mapos_user');
      const user: SystemUser | null = stored ? JSON.parse(stored) : null;
      
      let filteredData = data.sort((a, b) => (b.id || 0) - (a.id || 0));

      // FILTRO PARA CLIENTE
      if (user && user.level === 'client') {
          filteredData = filteredData.filter(f => f.client && f.client.toLowerCase() === user.name.toLowerCase());
      }

      setFiles(filteredData);
      setClientsList(clients);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  };

  const openModal = (file?: FileDocument) => {
    if (file) {
      setFormData(file);
      setIsEditing(true);
    } else {
      setFormData({
        name: '',
        client: isClientLevel && currentUser ? currentUser.name : '',
        date: new Date().toLocaleDateString('pt-BR'),
        description: '',
        type: 'file',
        size: '0 KB', 
        url: '#'
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const openPreview = (file: FileDocument) => {
      setPreviewFile(file);
      setIsPreviewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && formData.id) {
        await updateItem('files', formData);
      } else {
        await addItem('files', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar arquivo");
    }
  };

  // --- Lógica de Exclusão com Modal Visual ---
  
  // 1. Abre o modal de confirmação
  const handleDeleteClick = (file: FileDocument) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  // 2. Confirma a exclusão
  const confirmDelete = async () => {
    if (fileToDelete && fileToDelete.id) {
        try {
            const success = await deleteItem('files', fileToDelete.id);
            
            if (success) {
                // Remove da lista local (interface snappy)
                setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
                
                // Fecha todos os modais possíveis onde o botão de excluir possa ter sido clicado
                setIsDeleteModalOpen(false);
                setIsModalOpen(false);
                setIsPreviewModalOpen(false);
                setPreviewFile(null);
                setFileToDelete(null);
                
                // Recarrega dados para garantir sincronia
                await loadData();
            } else {
                alert("Erro ao excluir o arquivo.");
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Ocorreu um erro ao tentar excluir.");
        }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Validação de tipo PDF
          if (file.type !== 'application/pdf') {
              alert('Apenas arquivos PDF são permitidos.');
              e.target.value = ''; // Limpa o input
              return;
          }

          let sizeStr = '';
          if (file.size < 1024 * 1024) {
              sizeStr = (file.size / 1024).toFixed(2) + ' KB';
          } else {
              sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
          }

          const extension = file.name.split('.').pop()?.toLowerCase() || 'file';

          setFormData({
              ...formData,
              name: formData.name || file.name, 
              size: sizeStr,
              type: extension,
              url: URL.createObjectURL(file) 
          });
      }
  };

  const selectClient = (clientName: string) => {
      setFormData({ ...formData, client: clientName });
      setIsClientSelectOpen(false);
      setSearchTerm('');
  };

  const filteredClients = clientsList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getFileIcon = (type: string) => {
      const ext = type.toLowerCase();
      if (['pdf'].includes(ext)) return <FileText className="h-5 w-5 text-red-500" />;
      if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return <Image className="h-5 w-5 text-blue-500" />;
      if (['zip', 'rar', '7z', 'tar'].includes(ext)) return <Archive className="h-5 w-5 text-yellow-600" />;
      if (['doc', 'docx', 'txt'].includes(ext)) return <FileText className="h-5 w-5 text-blue-700" />;
      return <File className="h-5 w-5 text-gray-400" />;
  };

  const isImage = (type: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(type.toLowerCase());

  const handleDownload = (file: FileDocument) => {
    if (!file.url || file.url === '#') {
        alert("Arquivo inválido ou não encontrado.");
        return;
    }

    if (isImage(file.type)) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const img = new (window as any).Image();
        img.src = file.url;
        
        img.onload = () => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            const imgRatio = img.width / img.height;
            const pageRatio = maxWidth / maxHeight;

            let finalWidth, finalHeight;

            if (imgRatio > pageRatio) {
                finalWidth = maxWidth;
                finalHeight = maxWidth / imgRatio;
            } else {
                finalHeight = maxHeight;
                finalWidth = maxHeight * imgRatio;
            }

            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;

            doc.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);
            doc.save(`${file.name.split('.')[0]}.pdf`);
        };

        img.onerror = () => {
            alert("Erro ao processar imagem para PDF. Tentando download direto.");
            directDownload(file);
        };
    } else {
        directDownload(file);
    }
  };

  const directDownload = (file: FileDocument) => {
      const link = document.createElement('a');
      link.href = file.url || '#';
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div>
      <PageHeader title="Arquivos" buttonLabel="Adicionar Arquivo" onButtonClick={() => openModal()} />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Cliente / Fornecedor</th>
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Tamanho</th>
                <th className="px-6 py-3 font-medium">Descrição</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 ? (
                 <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Nenhum arquivo encontrado.</td></tr>
              ) : (
                files.map((file) => (
                    <tr key={file.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{file.id}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <span className="mr-3">{getFileIcon(file.type)}</span>
                            <span className="font-medium text-gray-700">{file.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                        {file.client ? (
                             <div className="flex items-center">
                                <User className="h-3 w-3 mr-1 text-gray-400" />
                                {file.client}
                             </div>
                        ) : '-'}
                    </td>
                    <td className="px-6 py-4">{file.date}</td>
                    <td className="px-6 py-4 text-gray-500">{file.size}</td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{file.description}</td>
                    <td className="px-6 py-4 flex justify-center space-x-2">
                        <button 
                            onClick={() => openPreview(file)}
                            className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center justify-center" 
                            title="Visualizar"
                        >
                            <Eye className="h-4 w-4" />
                        </button>

                        {!isClientLevel && (
                             <button 
                                className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors" 
                                title="Editar"
                                onClick={() => openModal(file)}
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                        )}
                        
                        {!isClientLevel && (
                            <button 
                                className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600 transition-colors" 
                                title="Excluir"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(file);
                                }}
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

       <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Arquivo" : "Novo Arquivo"}
      >
        <form onSubmit={handleSave} className="space-y-4">
            
            {!isEditing && (
                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors relative">
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-10 w-10 text-brand-blue mb-2" />
                    <p className="text-sm font-medium text-gray-700">Clique ou arraste o PDF aqui</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.size !== '0 KB' ? `Selecionado: ${formData.size}` : 'Suporta apenas arquivos PDF'}
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Arquivo</label>
                <input 
                    type="text" 
                    name="name" 
                    required 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Ex: Comprovante de Pagamento"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Cliente / Fornecedor</label>
                <div className="flex mt-1">
                    <input 
                        type="text" 
                        name="client" 
                        readOnly
                        value={formData.client || ''} 
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

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <input type="text" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Tamanho (Auto)</label>
                    <input type="text" name="size" readOnly value={formData.size} className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50 text-gray-500" />
                </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>

             <div className="flex justify-between items-center pt-4 border-t mt-4">
                 <div>
                    {isEditing && !isClientLevel && formData.id && (
                        <button 
                            type="button" 
                            onClick={() => handleDeleteClick(formData)}
                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-md transition-colors flex items-center"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                        </button>
                    )}
                 </div>
                 <div className="flex">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600">Salvar</button>
                </div>
            </div>
        </form>
      </Modal>

      <Modal
         isOpen={isClientSelectOpen}
         onClose={() => setIsClientSelectOpen(false)}
         title="Selecionar Cliente / Fornecedor"
      >
        <div className="mb-4">
             <input 
                type="text" 
                placeholder="Buscar..." 
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
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={previewFile?.name || "Visualizar Arquivo"}
      >
         <div className="flex flex-col items-center justify-center p-4">
            
            <div className="mb-6 w-full flex justify-center bg-gray-100 rounded-lg p-2 border border-gray-200 min-h-[200px] items-center relative overflow-hidden">
                {previewFile && isImage(previewFile.type) ? (
                    <img 
                        src={previewFile.url} 
                        alt={previewFile.name} 
                        className="max-h-[65vh] w-auto h-auto max-w-full rounded shadow-sm"
                        style={{ objectFit: 'contain' }}
                    />
                ) : (
                    <div className="text-center text-gray-400 py-10">
                        {previewFile && getFileIcon(previewFile.type)}
                        <p className="mt-2 text-sm">Visualização não disponível para este formato.</p>
                        <p className="text-xs">Baixe o arquivo para visualizar.</p>
                    </div>
                )}
            </div>

            {previewFile && (
                <div className="w-full mb-6 grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <div>
                        <span className="font-semibold block text-gray-800">Tamanho:</span> {previewFile.size}
                    </div>
                    <div>
                        <span className="font-semibold block text-gray-800">Tipo:</span> {previewFile.type.toUpperCase()}
                    </div>
                    <div className="col-span-2">
                        <span className="font-semibold block text-gray-800">Descrição:</span> {previewFile.description || 'Sem descrição.'}
                    </div>
                </div>
            )}

            <div className="flex space-x-3 w-full">
                 {previewFile && !isClientLevel && previewFile.id && (
                    <button
                        onClick={() => handleDeleteClick(previewFile)}
                        className="flex-1 flex items-center justify-center bg-white border border-red-200 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-all font-medium"
                    >
                        <Trash2 className="h-5 w-5 mr-2" />
                        Excluir
                    </button>
                )}
                
                {previewFile && (
                    <button
                        onClick={() => handleDownload(previewFile)}
                        className={`flex items-center justify-center bg-brand-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-all shadow-md font-medium ${!isClientLevel ? 'flex-[2]' : 'w-full'}`}
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Baixar Documento {isImage(previewFile.type) && '(A4)'}
                    </button>
                )}
            </div>
         </div>
      </Modal>

      {/* NOVO: Modal de Confirmação de Exclusão */}
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
                <h4 className="text-lg font-medium text-gray-900">Excluir Arquivo?</h4>
                <p className="text-sm text-gray-500 mt-2">
                    Você tem certeza que deseja excluir o arquivo <strong>{fileToDelete?.name}</strong>? 
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

export default Files;