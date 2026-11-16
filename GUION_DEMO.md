# Guion para la demostración (3 minutos)

Antes de empezar: abre `index.html` en el navegador con la lista **vacía** (si hay datos, usa "Borrar todos los gastos") y deja DevTools cerrado. Ten a mano VS Code con `js/app.js` abierto.

| Tiempo | Qué hacer | Qué decir |
|---|---|---|
| 0:00 – 0:20 | Mostrar la pantalla inicial. | "Es un control de gastos hecho con JavaScript ES6, sin servidor. Los datos se guardan en el localStorage del navegador." |
| 0:20 – 0:45 | Clic en **Agregar gasto** con el formulario vacío. Luego escribir "ab", monto "-5" y una fecha futura. | "Antes de guardar se valida: la descripción es obligatoria, el monto debe ser mayor que cero, hay que elegir categoría y la fecha no puede ser futura. Los mensajes aparecen bajo cada campo." |
| 0:45 – 1:20 | Agregar 3 o 4 gastos de distintas categorías (ej. "Comida en la cafetería" 85.50 Comida; "Camión a FIME" 12 Transporte; "Libro de JavaScript" 450 Escuela; "Cine" 160 Entretenimiento). | "La tabla y el resumen se actualizan sin recargar la página: total, total del mes, contador y la categoría con más gasto, además de las barras por categoría." |
| 1:20 – 1:45 | **Editar** el libro y cambiar el monto a 399.90. **Eliminar** el cine. | "Editar carga el registro en el formulario; eliminar pide confirmación. Los totales se recalculan solos." |
| 1:45 – 2:10 | Escribir "cam" en el buscador. Borrarlo, filtrar por **Comida** y ordenar por **Monto mayor**. | "Como función extra hay búsqueda, filtro por categoría y ordenamiento. Abajo muestra cuántos coinciden y su subtotal." |
| 2:10 – 2:35 | Recargar la página (F5). Abrir DevTools → Application → Local Storage → `control-gastos:v1`. | "Al recargar los datos siguen ahí porque se guardan en localStorage como JSON." |
| 2:35 – 3:00 | En VS Code, enseñar en `app.js`: el arreglo `gastos`, `validar()`, `obtenerVisibles()` (filter + sort) y el listener del formulario con `preventDefault()`. | "Los datos son un arreglo de objetos; usé arrow functions, template literals, map, filter, reduce y spread. Todo el código y el README están en el repositorio." |

Consejo: si grabas video, usa la grabación de pantalla de Windows (Win + Alt + R) o OBS, y practica una vez con cronómetro.
