import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, FileText, Image, Archive, File, Download, UploadCloud, UserPlus, User } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { FileDocument, Client } from '../types';

const Files: React.FC = () => {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
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

  const loadData = async () => {
    const data = await getAll<FileDocument>('files');
    const clients = await getAll<Client>('clients');
    setFiles(data.sort((a, b) => (b.id || 0) - (a.id || 0)));
    setClientsList(clients);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (file?: FileDocument) => {
    if (file) {
      setFormData(file);
      setIsEditing(true);
    } else {
      setFormData({
        name: '',
        client: '',
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este arquivo permanentemente?')) {
        await deleteItem('files', id);
        loadData();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Calcula tamanho em KB ou MB
          let sizeStr = '';
          if (file.size < 1024 * 1024) {
              sizeStr = (file.size / 1024).toFixed(2) + ' KB';
          } else {
              sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
          }

          // Obtém extensão
          const extension = file.name.split('.').pop()?.toLowerCase() || 'file';

          setFormData({
              ...formData,
              name: formData.name || file.name, // Usa o nome do arquivo se o campo estiver vazio
              size: sizeStr,
              type: extension,
              url: URL.createObjectURL(file) // Simula uma URL local para preview nesta sessão
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

  return (
    <div>
      <PageHeader title="Arquivos" buttonLabel="Adicionar Arquivo" onButtonClick={() => openModal()} />

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
                        <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center justify-center" 
                            title="Download"
                        >
                            <Download className="h-4 w-4" />
                        </a>
                        <button 
                            className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors" 
                            title="Editar"
                            onClick={() => openModal(file)}
                        >
                        <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                            className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600 transition-colors" 
                            title="Excluir"
                            onClick={() => file.id && handleDelete(file.id)}
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
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="h-10 w-10 text-brand-blue mb-2" />
                    <p className="text-sm font-medium text-gray-700">Clique ou arraste o arquivo aqui</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.size !== '0 KB' ? `Selecionado: ${formData.size}` : 'Suporta PDF, Imagens, Docx, etc.'}
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

             <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600">Salvar</button>
            </div>
        </form>
      </Modal>

      {/* Modal de Seleção de Cliente */}
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

    </div>
  );
};

export default Files;