import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse v2 usa pdfjs-dist v4 que referencia APIs de browser (DOMMatrix, canvas)
  // durante o bundling do Next.js. Marcar como externo faz o Node.js carregar o módulo
  // nativamente em runtime, evitando o erro de build.
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
