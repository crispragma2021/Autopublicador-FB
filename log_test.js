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
