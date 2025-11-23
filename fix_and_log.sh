echo "--- 1. Eliminando dependencia rota ---"
npm uninstall @google/genai

echo "--- 2. Instalando Winston ---"
npm install winston

echo "--- 3. Creando script compatible (ES Modules) ---"
cat > log_test.js <<'JS'
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

console.log("\n>>> INICIO DE PRUEBA <<<");
logger.info("¡ÉXITO! El sistema de logs funciona con ES Modules.");
logger.warn("Advertencia de prueba.");
logger.error("Error de prueba.");
console.log(">>> FIN DE PRUEBA <<<\n");
JS

echo "--- 4. Ejecutando prueba ---"
node log_test.js
