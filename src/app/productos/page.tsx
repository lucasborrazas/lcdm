import { PageHeader } from "@/components/shared/PageHeader";
import { ProductosTable } from "@/components/productos/ProductosTable";

export default function ProductosPage() {
  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo completo de productos con precios y stock actual"
      />
      <ProductosTable />
    </>
  );
}
