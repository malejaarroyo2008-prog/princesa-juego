# Princesa: temporada sin scroll

Juego personal para dejar el uso compulsivo del celular entre el **18 de noviembre de 2026** y el **18 de mayo de 2027**. El centro del juego es Princesa, una gata siamesa *blue point* dibujada a partir de las fotos de la gata real. Se alimenta de los puntos de experiencia (XP) que se ganan cumpliendo metas en la vida real.

- Es una página web hecha solo con HTML, CSS y JavaScript. No tiene servidor ni base de datos.
- Todo se guarda en el navegador de quien la abre (`localStorage`). Cada persona juega su propia partida y nadie puede tocar la de otra.
- Es una **PWA**: se instala en Android desde Chrome y funciona sin internet.

## Qué hay en cada archivo

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página y la barra de navegación. |
| `css/styles.css` | Colores, diseño y **todas las animaciones de Princesa** (al final del archivo). |
| `js/data.js` | **Las reglas fijas**: XP de cada casilla, metas por fecha, niveles, precios de la tienda, misiones, jefes y colores de Princesa. Si quieres cambiar un número, se cambia aquí. |
| `js/logic.js` | Las reglas como funciones: fechas, pancita, rachas, multiplicadores, escudo y niveles. |
| `js/princesa.js` | El dibujo de Princesa en SVG: sentada, comiendo, jugando, dormida, panza arriba y escondida debajo de la cama. |
| `js/app.js` | Las pantallas, el guardado, la demo y la copia de seguridad. |
| `sw.js` y `manifest.json` | Lo que hace que se pueda instalar y que funcione sin internet. |
| `iconos/` | Íconos de la app. |
| `tests.html` | Pruebas de la lógica con datos simulados. |
| `referencias/` | Carpeta para las fotos de Princesa (no se publican en la app). |

## Cómo abrirlo en el computador

El navegador necesita un pequeño servidor local para que funcione el modo sin internet. Con Python instalado, desde la carpeta `princesa-juego`:

```
python -m http.server 8765
```

Luego se abre en el navegador: <http://localhost:8765>

Para ver las pruebas: <http://localhost:8765/tests.html>. Las 40 deben salir en verde.

> También se puede abrir `index.html` con doble clic: el juego funciona, pero sin el modo sin conexión.

## Cómo publicarlo en GitHub Pages

1. Crear una cuenta gratuita en <https://github.com>.
2. Crear un repositorio nuevo llamado `princesa-juego`, público.
3. Subir **el contenido** de esta carpeta (que `index.html` quede en la raíz del repositorio). Se puede arrastrar todo en la página del repositorio con «Add file → Upload files», o con Git:
   ```
   git init
   git add .
   git commit -m "Princesa: primera versión"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/princesa-juego.git
   git push -u origin main
   ```
4. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`, y **Save**.
5. Al par de minutos queda en: `https://TU-USUARIO.github.io/princesa-juego/`

## Instalarlo en el Samsung

1. Abrir el enlace en Chrome.
2. Menú de tres puntos → «Agregar a la pantalla de inicio» o «Instalar aplicación».
3. Una vez por semana: **Ajustes → Exportar JSON** y guardar el archivo en el correo o en Drive.

## Cómo funciona el juego

- **Hoy** (pantalla principal): el registro nocturno. Se escriben las horas de Bienestar digital y se marcan casillas y contadores. Se puede editar hoy y ayer.
- **Princesa**: su cuarto, la pancita, darle de comer, mimos, jugar, siesta y sus accesorios.
- **Retos**: racha y multiplicador, escudo semanal, 3 misiones de la semana y el jefe del mes.
- **Tienda**: accesorios para Princesa y recompensas de la vida real (con historial).
- **Progreso**: gráfico de horas contra la meta, promedios por semana, preguntas del domingo y el balance final (desde el 18 de mayo de 2027).
- **Ajustes** (⚙️): nombre, fecha de inicio, línea base, colores de Princesa, metas editables, copia de seguridad, modo demostración y reiniciar.

Reglas importantes:

- La pancita baja 4 puntos por hora. Princesa **nunca muere ni se va**: tras 2 días sin comer se esconde debajo de la cama y sale con el primer plato.
- Cada XP suma al XP total (que define el nivel y nunca baja por gastar), a la comida y a las monedas.
- Racha de 3 días: x1,2 · 7 días: x1,5 · 14 días: x2. El multiplicador se aplica a los días en que se cumple la meta.
- A los 3 minutos de uso seguido, Princesa se duerme y la app invita a soltar el celular. Los mimos dejan de contar hasta volver más tarde.
- La **demo** usa una partida aparte, con una franja amarilla arriba. Al salir se borra y la partida real queda intacta.

## Si cambias algo y el celular no lo muestra

La app busca primero la versión nueva en internet y solo usa la copia guardada si no hay conexión. Si aun así no aparece, cierra la app del todo y ábrela de nuevo.
