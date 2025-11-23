echo "--- 1. Instalando Winston (ignorando errores de otras librerías) ---"
npm install winston --no-save --loglevel=error

echo "--- 2. Creando archivo de prueba ---"
cat > log_test.js <<'JS'
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [new winston.transports.Console()]
});

console.log("\n>>> RESULTADO DE LA PRUEBA <<<");
logger.info("¡Si ves este mensaje verde, los LOGS funcionan!");
logger.error("Esto es una prueba de error.");
console.log(">>> FIN DE LA PRUEBA <<<\n");
JS

echo "--- 3. Ejecutando prueba ---"
node log_test.js
