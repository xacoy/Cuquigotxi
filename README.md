# 🥚 Cuquigotxi

Una mascota virtual **moderna** con todas las funciones clásicas del Tamagotchi, dibujada con gráficos vectoriales suaves (gradientes, brillos y animaciones) en lugar de píxeles. Sin dependencias: HTML + CSS + JavaScript puro, funciona offline y se puede instalar como app (PWA).

![Cuquigotxi](docs/screenshot.png)

## Cómo jugar

Abre `index.html` en el navegador (o sírvelo con cualquier servidor estático, p. ej. `python3 -m http.server`).

### Controles

| Acción | Teclado | Mando en pantalla (móvil, vertical) |
|---|---|---|
| Mover selección | `←` `→` `↑` `↓` (o `WASD`) | Cruceta |
| Aceptar / calentar huevo | `Z`, `Enter`, `Espacio` | **A** |
| Atrás / cancelar | `X`, `Esc`, `Backspace` | **B** |
| Ajustes | `Tab` | **START** |
| Estado (estadísticas) | `Shift` | **SELECT** |

## Pantallas

En **Ajustes → Pantalla** puedes elegir cómo se ve el juego (la carcasa también cambia):

| Moderno | Color retro | Clásico verde |
|---|---|---|
| Vectorial, suave y con gradientes | Píxeles grandes con paleta limitada | LCD de 4 tonos verdes, como los de antes |

## Funciones

**Clásicas**
- 🥚 Huevo que hay que calentar hasta que eclosiona
- 🍎 Comida y dulces, con hambre, felicidad, salud, peso, edad y disciplina
- 💩 Cacas, enfermedad (2 dosis de medicina), luz y sueño, llamadas de atención y errores de cuidado
- 🧬 Evolución por etapas (Bebé → Niño → Joven → Adulto → Senior) con **13 criaturas** según cómo lo cuides y qué entrene (Fortachón, Sabio, Diva…), incluida una secreta (cuidado perfecto)
- 👻 Puede morir (hambre, enfermedad o vejez) y empezar de nuevo con otro huevo

**Modernas**
- 🪙 **Monedas** que se ganan con minijuegos, entrenos, trabajos, logros, cumpleaños y el regalo diario
- 🛒 **Tienda**: 7 comidas y medicinas (la favorita de cada mascota da más felicidad), 4 juguetes, 11 accesorios (cabeza, cara y cuello) y 6 fondos
- 🎒 **Mochila** para usar objetos, vestir a la mascota y cambiar de fondo
- 🎮 **5 minijuegos**: ¿Izquierda o derecha?, Atrapa estrellas, Mayor o menor, Piedra-papel-tijera y Memoria
- 🏋️ **Entrenamiento** (Fuerza, Mente, Encanto) con barra de energía, que influye en la evolución
- 🛁 **Baño** e higiene, 💞 caricias y afecto, 🎸 juguetes con animaciones
- 💼 **Trabajo**: tu mascota se va un rato (3 oficios) y vuelve con monedas
- 👫 **Amigos**: visita a 6 amigos con nivel de amistad y regalos
- 🏆 **21 logros** y 📖 **álbum** de criaturas descubiertas
- 🧑‍🎤 **Personalidad** (glotón, juguetón, tranquilo, travieso, sociable) y comida favorita
- 🌦️ Clima real (sol, nubes, lluvia, nieve, tormenta) y ciclo día/noche
- 📷 Modo foto, ⏰ reloj opcional, 🔊 volumen, 📳 vibración
- 💾 Guardado automático, exportar/importar partida, mascota viva aunque cierres la pestaña
- ⏩ Velocidad ajustable (1x / 4x / 16x / 60x) y PWA instalable con modo offline

## Estructura

```
index.html        pantalla y mando
style.css         carcasa y diseño responsive (un tema por pantalla)
js/data.js        catálogos: comida, juguetes, ropa, fondos, trabajos, amigos, logros
js/game.js        reglas, simulación y acciones
js/sprites.js     dibujo de criaturas, comida e iconos
js/sprites2.js    nuevas criaturas, accesorios, juguetes, cartas
js/scene.js       fondos, clima y filtros de pantalla retro
js/ui.js          render, menús, minijuegos y controles
js/audio.js       efectos de sonido (WebAudio)
```

## Licencia

MIT
