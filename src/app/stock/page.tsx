import { PageHeader } from "@/components/shared/PageHeader";
import { StockTable } from "@/components/stock/StockTable";

export default function StockPage() {
  return (
    <>
      <PageHeader
        title="Stock"
        description="Estado actual de inventario por producto y talle"
      />
      <StockTable />
    </>
  );
}
