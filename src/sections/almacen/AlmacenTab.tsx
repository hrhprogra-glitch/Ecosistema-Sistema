import { InventarioGeneral } from './InventarioGeneral.tsx';
import { SalidaObra } from '../obras/SalidaObra.tsx';

interface Props {
  zoom: number;
  subTab: 'inventario' | 'salidas' | 'devoluciones';
}

export const AlmacenTab = ({ zoom, subTab }: Props) => {
  return (
    <div className="w-full h-full">
      {subTab === 'inventario' && <InventarioGeneral zoom={zoom} />}
      {subTab === 'salidas' && <SalidaObra zoom={zoom} />}
      
    </div>
  );
};