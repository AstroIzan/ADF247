# Tareas Pendientes

## No bloqueantes detectadas en validacion

1. Presupuesto de bundle inicial excedido en frontend.
   - Limite: 500 kB
   - Actual: 786.40 kB
   - Comando: `npm run build` en `client/`

2. Presupuesto CSS excedido en `home.component.css`.
   - Limite: 12.00 kB
   - Actual: 17.99 kB

3. Presupuesto CSS excedido en `notifications-admin.component.css`.
   - Limite: 12.00 kB
   - Actual: 12.07 kB

## Validacion completada

- `npm test` en raiz: OK (API + Client tests CI)
- `npm run build` en `client/`: OK con warnings de presupuesto
