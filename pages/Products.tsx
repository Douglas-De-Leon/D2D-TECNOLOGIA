import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Search, Package } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getAll, addItem, deleteItem, updateItem } from '../services/db';
import { Product } from '../types';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  const loadData = async () => {
    const data = await getAll<Product>('products');
    setProducts(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    const newProduct: Product = {
        name: `Novo Produto ${Math.floor(Math.random() * 100)}`,
        unit: 'UN',
        stock: 10,
        price: 'R$ 50,00',
        minStock: 5
    };
    await addItem('products', newProduct);
    loadData();
  };

  const handleEdit = async (product: Product) => {
    const newName = prompt('Editar Nome do Produto:', product.name);
    if (newName && newName !== product.name) {
        const updatedProduct = { ...product, name: newName };
        await updateItem('products', updatedProduct);
        loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir este produto?')) {
        await deleteItem('products', id);
        loadData();
    }
  };

  return (
    <div>
      <PageHeader title="Produtos" buttonLabel="Adicionar Produto" onButtonClick={handleAdd} />

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
              {products.map((product) => (
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
                        onClick={() => handleEdit(product)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                        className="p-1.5 bg-brand-red text-white rounded hover:bg-red-600" 
                        title="Excluir"
                        onClick={() => product.id && handleDelete(product.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;