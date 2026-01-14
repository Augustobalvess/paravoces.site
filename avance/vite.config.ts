import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { obfuscator } from 'rollup-obfuscator';

export default defineConfig({
  plugins: [
    react(),
    // O obfuscator só roda quando você faz o build (npm run build)
    obfuscator({
      global: true, // Aplica em todos os arquivos
      options: {
        compact: true,
        controlFlowFlattening: true, // Cria um fluxo confuso de lógica
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: true, // Injeta código inútil para confundir
        deadCodeInjectionThreshold: 1,
        debugProtection: true, // Tenta travar quem abre o Console/Debugger
        debugProtectionInterval: 4000,
        disableConsoleOutput: true, // Limpa console.log
        identifierNamesGenerator: 'hexadecimal', // Renomeia variaveis para ex: _0x5f3a
        log: false,
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: true, // Tenta quebrar se alguém formatar o código
        stringArray: true,
        stringArrayEncoding: ['rc4'], // Criptografa strings
        stringArrayThreshold: 1
      }
    })
  ],
  build: {
    // Esconde os sourcemaps (mapas que mostram o código original)
    sourcemap: false, 
  }
});