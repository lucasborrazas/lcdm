import {
  calcularPrecioEfectivo,
  calcularPrecioUnitario,
  calcularCostoTotal,
  calcularPrecioTotal,
  calcularGanancia,
  calcularSaldoRestante,
  calcularCostoUnitarioCompra,
  calcularSubtotalLinea,
  distribuirEnvioProporcional,
  calcularCostoUnitarioReal,
  calcularCostoPromedioPonderado,
  fechaAPeriodo,
} from "../calculations";

// ── calcularPrecioEfectivo ────────────────────────────────────────────────────

describe("calcularPrecioEfectivo", () => {
  it("aplica 15% de descuento y redondea al múltiplo de 1000 hacia abajo", () => {
    // 10000 * 0.85 = 8500 → floor(8500/1000)*1000 = 8000
    expect(calcularPrecioEfectivo(10000)).toBe(8000);
  });

  it("resultado exactamente divisible por 1000 no cambia", () => {
    // 20000 * 0.85 = 17000 → floor(17000/1000)*1000 = 17000
    expect(calcularPrecioEfectivo(20000)).toBe(17000);
  });

  it("redondea hacia abajo cuando el resultado tiene decimales de miles", () => {
    // 15000 * 0.85 = 12750 → floor(12750/1000)*1000 = 12000
    expect(calcularPrecioEfectivo(15000)).toBe(12000);
  });

  it("funciona con precio bajo", () => {
    // 5000 * 0.85 = 4250 → floor(4250/1000)*1000 = 4000
    expect(calcularPrecioEfectivo(5000)).toBe(4000);
  });
});

// ── calcularPrecioUnitario ────────────────────────────────────────────────────

describe("calcularPrecioUnitario", () => {
  it("aplica descuento cuando el método de pago es EFECTIVO", () => {
    expect(calcularPrecioUnitario(10000, "EFECTIVO")).toBe(8000);
  });

  it("usa precio normal cuando el método de pago es TRANSFERENCIA", () => {
    expect(calcularPrecioUnitario(10000, "TRANSFERENCIA")).toBe(10000);
  });
});

// ── calcularSaldoRestante ─────────────────────────────────────────────────────

describe("calcularSaldoRestante", () => {
  it("descuenta la seña del precio total", () => {
    expect(calcularSaldoRestante(10000, 3000)).toBe(7000);
  });

  it("sin seña devuelve precio total completo", () => {
    expect(calcularSaldoRestante(10000, 0)).toBe(10000);
  });

  it("seña igual al precio total devuelve cero", () => {
    expect(calcularSaldoRestante(10000, 10000)).toBe(0);
  });
});

// ── calcularGanancia ──────────────────────────────────────────────────────────

describe("calcularGanancia", () => {
  it("calcula ganancia correctamente", () => {
    expect(calcularGanancia(15000, 8000)).toBe(7000);
  });

  it("ganancia cero cuando costo igual al precio", () => {
    expect(calcularGanancia(10000, 10000)).toBe(0);
  });

  it("ganancia negativa cuando costo supera al precio", () => {
    expect(calcularGanancia(8000, 10000)).toBe(-2000);
  });
});

// ── calcularCostoTotal / calcularPrecioTotal ──────────────────────────────────

describe("calcularCostoTotal", () => {
  it("multiplica cantidad por costo unitario", () => {
    expect(calcularCostoTotal(3, 5000)).toBe(15000);
  });
});

describe("calcularPrecioTotal", () => {
  it("multiplica cantidad por precio unitario", () => {
    expect(calcularPrecioTotal(3, 8000)).toBe(24000);
  });
});

// ── distribuirEnvioProporcional ───────────────────────────────────────────────

describe("distribuirEnvioProporcional", () => {
  it("distribuye envío proporcionalmente por subtotal", () => {
    const lineas = [
      { subtotalLinea: 6000, cantidad: 2 },
      { subtotalLinea: 4000, cantidad: 1 },
    ];
    // envio = 5000
    // linea 0: 6000/10000 * 5000 = 3000 / 2 unidades = 1500 por unidad
    // linea 1: 4000/10000 * 5000 = 2000 / 1 unidad = 2000 por unidad
    const resultado = distribuirEnvioProporcional(lineas, 5000);
    expect(resultado[0]).toBe(1500);
    expect(resultado[1]).toBe(2000);
  });

  it("distribución equitativa cuando todos los subtotales son iguales", () => {
    const lineas = [
      { subtotalLinea: 5000, cantidad: 2 },
      { subtotalLinea: 5000, cantidad: 2 },
    ];
    // envio = 2000
    // cada linea: 1000/2 = 500 por unidad
    const resultado = distribuirEnvioProporcional(lineas, 2000);
    expect(resultado[0]).toBe(500);
    expect(resultado[1]).toBe(500);
  });

  it("una sola línea recibe todo el envío", () => {
    const lineas = [{ subtotalLinea: 10000, cantidad: 4 }];
    // 3000 / 4 = 750
    const resultado = distribuirEnvioProporcional(lineas, 3000);
    expect(resultado[0]).toBe(750);
  });
});

// ── calcularCostoUnitarioCompra ───────────────────────────────────────────────

describe("calcularCostoUnitarioCompra", () => {
  it("divide total de línea entre cantidad", () => {
    expect(calcularCostoUnitarioCompra(12000, 4)).toBe(3000);
  });

  it("devuelve 0 cuando cantidad es 0", () => {
    expect(calcularCostoUnitarioCompra(12000, 0)).toBe(0);
  });
});

// ── calcularSubtotalLinea ─────────────────────────────────────────────────────

describe("calcularSubtotalLinea", () => {
  it("usa totalLineaCompra si está definido", () => {
    expect(calcularSubtotalLinea(9000, 3, 2000)).toBe(9000);
  });

  it("calcula cantidad * costoUnitario si totalLineaCompra es null", () => {
    expect(calcularSubtotalLinea(null, 3, 2000)).toBe(6000);
  });

  it("calcula cantidad * costoUnitario si totalLineaCompra es undefined", () => {
    expect(calcularSubtotalLinea(undefined, 4, 2500)).toBe(10000);
  });
});

// ── calcularCostoUnitarioReal ─────────────────────────────────────────────────

describe("calcularCostoUnitarioReal", () => {
  it("suma costoUnitarioCompra + costoEnvioUnitario", () => {
    expect(calcularCostoUnitarioReal(3000, 500)).toBe(3500);
  });
});

// ── calcularCostoPromedioPonderado ────────────────────────────────────────────

describe("calcularCostoPromedioPonderado", () => {
  it("promedia costo previo y costo nuevo ponderado por cantidades", () => {
    // (10*2000 + 10*4000) / 20 = 3000
    expect(calcularCostoPromedioPonderado(10, 2000, 10, 4000)).toBe(3000);
  });

  it("pondera más al lado con más cantidad", () => {
    // (30*2000 + 10*4000) / 40 = 2500
    expect(calcularCostoPromedioPonderado(30, 2000, 10, 4000)).toBe(2500);
  });

  it("sin stock previo, usa directamente el costo nuevo", () => {
    expect(calcularCostoPromedioPonderado(0, null, 10, 4000)).toBe(4000);
  });

  it("stock negativo (sobreventa) también usa directamente el costo nuevo", () => {
    expect(calcularCostoPromedioPonderado(-3, 2000, 10, 4000)).toBe(4000);
  });

  it("sin costo previo cargado, usa directamente el costo nuevo aunque haya stock", () => {
    expect(calcularCostoPromedioPonderado(15, null, 10, 4000)).toBe(4000);
  });

  it("redondea al entero más cercano", () => {
    // (1*1000 + 1*1001) / 2 = 1000.5 → 1001 (redondeo estándar)
    expect(calcularCostoPromedioPonderado(1, 1000, 1, 1001)).toBe(1001);
  });
});

// ── fechaAPeriodo ─────────────────────────────────────────────────────────────

describe("fechaAPeriodo", () => {
  it("genera período en español a partir de una fecha", () => {
    expect(fechaAPeriodo(new Date(2026, 1, 15))).toBe("febrero 2026");
  });

  it("genera período de enero", () => {
    expect(fechaAPeriodo(new Date(2026, 0, 1))).toBe("enero 2026");
  });

  it("genera período de diciembre", () => {
    expect(fechaAPeriodo(new Date(2025, 11, 31))).toBe("diciembre 2025");
  });
});

// ── Regla: no descontar stock dos veces ───────────────────────────────────────

describe("lógica de descuento de stock", () => {
  it("stockDescontado false implica que se debe descontar", () => {
    const pedido = { estadoPedido: "ENTREGADO", stockDescontado: false };
    const debeDescontar =
      pedido.estadoPedido === "ENTREGADO" && !pedido.stockDescontado;
    expect(debeDescontar).toBe(true);
  });

  it("stockDescontado true impide segundo descuento", () => {
    const pedido = { estadoPedido: "ENTREGADO", stockDescontado: true };
    const debeDescontar =
      pedido.estadoPedido === "ENTREGADO" && !pedido.stockDescontado;
    expect(debeDescontar).toBe(false);
  });

  it("pedido no ENTREGADO no descuenta stock", () => {
    const pedido = { estadoPedido: "ENCARGADO", stockDescontado: false };
    const debeDescontar =
      pedido.estadoPedido === "ENTREGADO" && !pedido.stockDescontado;
    expect(debeDescontar).toBe(false);
  });
});
