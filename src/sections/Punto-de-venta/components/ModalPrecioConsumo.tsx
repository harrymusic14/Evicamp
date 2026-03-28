import React, { useState } from 'react';
import type { Product } from '../types';

interface Props {
  isOpen: boolean;
  producto: Product | null;
  onClose: () => void;
  // Mantenemos la firma de la función para no romper tu index.tsx
  onConfirm: (precio: number, cantidad: number) => void;
}

export const ModalPrecioConsumo: React.FC<Props> = ({ isOpen, producto, onClose, onConfirm }) => {
  // Inicializamos vacío para forzar al cajero a teclear el valor y evitar clics accidentales en "0"
  const [precioAjustado, setPrecioAjustado] = useState<string>('');

  if (!isOpen || !producto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const precioFinal = parseFloat(precioAjustado);
    if (!isNaN(precioFinal) && precioFinal >= 0) {
      // Inyección arquitectónica: Se envía estrictamente 1 unidad
      onConfirm(precioFinal, 1);
      setPrecioAjustado(''); // Limpiamos el estado para el próximo uso
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E293B]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
      {/* Geometría estricta: rounded-none, border oscuro, fondo puro */}
      <div className="bg-[#FFFFFF] border-2 border-[#1E293B] shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] rounded-none w-full max-w-sm p-6">
        
        <div className="border-b border-[#E2E8F0] pb-3 mb-5">
          <span className="text-[#64748B] text-[10px] font-mono tracking-widest uppercase block mb-1">
            Registro Operativo
          </span>
          <h2 className="text-[#1E293B] font-bold text-lg uppercase tracking-wide">
            Asignar Consumo
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[#1E293B] text-xs font-bold mb-2 uppercase tracking-wider">
              Producto Seleccionado
            </label>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[#1E293B] text-sm font-mono rounded-none">
              {producto.name}
              <div className="text-[#64748B] text-xs mt-1">
                Costo Base Ref: S/ {producto.cost || 0}
              </div>
            </div>
          </div>

          {/* Campo único a pantalla completa (Full Width) */}
          <div>
            <label className="block text-[#1E293B] text-xs font-bold mb-2 uppercase tracking-wider">
              Precio a Cobrar (S/)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={precioAjustado}
              onChange={(e) => setPrecioAjustado(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#FFFFFF] border border-[#1E293B] text-[#1E293B] p-3 focus:outline-none focus:ring-1 focus:ring-[#1E293B] rounded-none font-mono text-xl transition-all"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E2E8F0] mt-6">
            <button
              type="button"
              onClick={() => {
                setPrecioAjustado('');
                onClose();
              }}
              className="flex-1 bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B] hover:border-[#1E293B] px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors rounded-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#1E293B] border border-[#1E293B] text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#1E293B] px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors rounded-none"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};