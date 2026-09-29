

const nextConfig = {
  // El tracing de Next.js no detecta los binarios .node de Prisma porque se
  // cargan dinámicamente (no vía import estático), así que quedan afuera del
  // bundle de cada función serverless salvo que se los liste a mano acá.
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
