#!/bin/bash
# 1. Fuerza a Git a reconocer todos los cambios: borrados, nuevos y modificados.
echo "-> Añadiendo todos los archivos nuevos y marcando borrados..."
git add -A

# 2. Confirma el estado para verificar que index.html y las carpetas están correctas
echo "-> Verificando estado (debería mostrar los cambios en index.html y la carpeta 'frontend' modificada)..."
git status

# 3. Confirma la reestructuración y la corrección del index.html
echo "-> Confirmando el commit..."
git commit -m "REESTRUCTURA Y FIX FINAL: Sincronizar index.html y aceptar la nueva estructura frontend/backend"

# 4. Sube la reestructuración y la corrección
echo "-> Subiendo cambios a GitHub..."
git push
