import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, Package, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Product } from '../types';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  
  // Estados para Adicionar/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>({
    name: '',
    unit: 'UN',
    stock: 0,
    price: '',
    minStock: 0
  });
  const [isEditing, setIsEditing] = useState(false);

  // Estados para Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const loadData = async () => {
    const data = await getAll<Product>('products');
    setProducts(data.sort((a, b) => (b.id || 0) - (a.id || 0)));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (product?: Product) => {
    if (product) {
      setFormData(product);
      setIsEditing(true);
    } else {
      setFormData({ name: '', unit: 'UN', stock: 0, price: 'R$ 0,00', minStock: 5 });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && formData.id) {
        await updateItem('products', formData);
      } else {
        await addItem('products', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar produto.");
    }
  };

  // Abre o modal de confirmação
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // Executa a exclusão de fato
  const confirmDelete = async () => {
    if (productToDelete && productToDelete.id) {
        const success = await deleteItem('products', productToDelete.id);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        } else {
            alert("Erro ao excluir produto. Verifique se as permissões estão corretas.");
        }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div>
      <PageHeader title="Produtos" buttonLabel="Adicionar Produto" onButtonClick={() => openModal()} />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-end">
          <div className="relative">
             <input type="text" placeholder="Pesquisar..." className="pl-8 pr-4 py-2 border rounded-md text-sm outline-none w-64 focus:ring-1 focus:ring-brand-blue" />
             <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Cod.</th>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Unidade</th>
                <th className="px-6 py-3 font-medium">Preço Venda</th>
                <th className="px-6 py-3 font-medium">Estoque</th>
                <th className="px-6 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                 <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Nenhum produto encontrado.</td></tr>
              ) : (
                products.map((product) => (
                    <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{product.id}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-400" />
                            {product.name}
                        </div>
                    </td>
                    <td className="px-6 py-4">{product.unit}</td>
                    <td className="px-6 py-4 font-medium text-green-600">{product.price}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stock <= product.minStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {product.stock}
                        </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center space-x-2">
                        <button 
                            className="p-1.5 bg-brand-blue text-white rounded hover:bg-blue-600" 
                            title="Editar"
                            onClick={() => openModal(product)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                            className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600" 
                            title="Excluir"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(product);
                            }}
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

      {/* Modal de Cadastro / Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Produto" : "Adicionar Produto"}
      >
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Preço (Texto)</label>
                    <input type="text" name="price" placeholder="R$ 0,00" value={formData.price} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Unidade</label>
                    <select name="unit" value={formData.unit} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2">
                        <option value="UN">Unidade</option>
                        <option value="KG">Quilo</option>
                        <option value="CX">Caixa</option>
                        <option value="LT">Litro</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Estoque Atual</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                    <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
            </div>
             <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="mr-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-brand-blue rounded-md hover:bg-blue-600">Salvar</button>
            </div>
        </form>
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
                <h4 className="text-lg font-medium text-gray-900">Excluir Produto?</h4>
                <p className="text-sm text-gray-500 mt-2">
                    Você tem certeza que deseja excluir o produto <strong>{productToDelete?.name}</strong>? 
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

export default Products;