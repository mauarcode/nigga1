# Requisitos y Configuración de la Página Web - Barbería BarberRock

Este documento lista todos los campos de contenido que deben configurarse en el panel de administración para que la página web funcione correctamente.

## 📋 Índice
1. [Identidad y Branding](#identidad-y-branding)
2. [Barra de Navegación y Hero](#barra-de-navegación-y-hero)
3. [Servicios](#servicios)
4. [Productos](#productos)
5. [Establecimiento](#establecimiento)
6. [Galería](#galería)
7. [Testimonios](#testimonios)
8. [Ubicación](#ubicación)
9. [Contacto](#contacto)
10. [Footer](#footer)
11. [Redes Sociales](#redes-sociales)

---

## 🎨 Identidad y Branding

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `logo_barberia` | **IMAGEN** | Logo principal de la barbería | Identidad y branding → Logo principal | Barra de navegación (arriba izquierda) |
| `nombre_barberia` | Texto | Nombre de la barbería | Identidad y branding → Nombre de la barbería | Usado como fallback si no hay logo |
| `branding_color_primario` | Color | Color primario de la marca (hex) | Identidad y branding → Color primario | Botones, enlaces, acentos |
| `branding_color_secundario` | Color | Color secundario de la marca (hex) | Identidad y branding → Color secundario | Fondos secundarios |

**⚠️ IMPORTANTE:** 
- El logo debe ser una imagen PNG o JPG de alta calidad
- Tamaño recomendado: mínimo 200x200px, ideal 400x400px
- Formato: PNG con fondo transparente o JPG con fondo blanco

---

## 🎬 Barra de Navegación y Hero

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `inicio_hero_image` | **IMAGEN** | **FOTO DE FONDO DEL HERO** | Inicio / Hero → Imagen de fondo (Hero) | Sección principal (fondo completo) |
| `hero_color_fondo` | Color | Color del overlay sobre la imagen | Inicio / Hero → Color de fondo | Overlay semi-transparente (75% opacidad) |
| `inicio_titulo` | Texto | Título principal del Hero | Inicio / Hero → Título principal | Texto grande en el centro |
| `inicio_descripcion` | Texto | Descripción del Hero | Inicio / Hero → Descripción | Párrafo debajo del título |

**⚠️ CRÍTICO - Imagen de Fondo del Hero:**
- **DEBE ser una foto de muy alta calidad** de tu barbería o de un barbero en acción
- Resolución mínima recomendada: **1920x1080px** (Full HD)
- Resolución ideal: **3840x2160px** (4K) para pantallas grandes
- Formato: JPG de alta calidad o PNG
- Peso máximo recomendado: 2-3 MB (optimizado)
- La imagen se mostrará con un overlay azul semi-transparente (75% opacidad) para que el texto blanco sea legible
- La imagen debe cubrir toda la altura de la pantalla (90vh)

**Ejemplo de uso:**
- Foto de un barbero cortando el cabello a un cliente
- Vista interior de la barbería con buena iluminación
- Detalle de herramientas de barbería profesionales
- Ambiente de la barbería con estilo moderno

---

## ✂️ Servicios

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `servicios_descripcion` | Texto | Descripción general de servicios | Servicios y productos → Servicios · Descripción | Encabezado de la sección |
| `servicios_color_fondo` | Color | Color de fondo de la sección | Servicios y productos → Servicios · Color de fondo | Fondo de la sección |
| `servicios_imagen` | **IMAGEN** | Imagen principal de servicios (opcional) | Servicios y productos → Servicios · Imagen principal | Para futuras mejoras |

**Nota:** Los servicios individuales se gestionan desde el apartado "Servicios" en el admin, no desde WebsiteContent.

---

## 🛍️ Productos

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `catalogo_titulo` | Texto | Título del catálogo | Servicios y productos → Catálogo · Título | Encabezado de la sección |
| `catalogo_descripcion` | Texto | Descripción del catálogo | Servicios y productos → Catálogo · Descripción | Texto descriptivo |
| `productos_color_fondo` | Color | Color de fondo | Servicios y productos → Catálogo · Color de fondo | Fondo de la sección |

**Nota:** Los productos individuales se gestionan desde el apartado "Productos" en el admin.

---

## 🏢 Establecimiento

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `establecimiento_titulo` | Texto | Título de la sección | Establecimiento → Título | Encabezado principal |
| `establecimiento_descripcion` | Texto | Descripción principal | Establecimiento → Descripción principal | Párrafo principal |
| `descripcion_general` | Texto | Descripción secundaria | Establecimiento → Descripción secundaria | Segundo párrafo |
| `establecimiento_imagen` | **IMAGEN** | **Foto del establecimiento** | Establecimiento → Imagen | Imagen grande a la derecha |
| `establecimiento_color_fondo` | Color | Color de fondo | Establecimiento → Color de fondo | Fondo de la sección |
| `establecimiento_historia` | Texto | Historia del establecimiento | Establecimiento → Historia | (Opcional, para futuras mejoras) |
| `establecimiento_mision` | Texto | Misión | Establecimiento → Misión | (Opcional, para futuras mejoras) |
| `establecimiento_vision` | Texto | Visión | Establecimiento → Visión | (Opcional, para futuras mejoras) |

**⚠️ IMPORTANTE - Imagen del Establecimiento:**
- Foto de alta calidad del interior o exterior de la barbería
- Resolución recomendada: mínimo 1200x800px
- Formato: JPG o PNG
- Debe mostrar el ambiente y estilo de la barbería

---

## 📸 Galería

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `galeria_descripcion` | Texto | Descripción de la galería | Galería y testimonios → Galería · Descripción | Texto descriptivo |
| `galeria_color_fondo` | Color | Color de fondo | Galería y testimonios → Galería · Color de fondo | Fondo de la sección |
| `galeria_placeholder_text` | Texto | Mensaje cuando no hay imágenes | Galería y testimonios → Galería · Mensaje sin elementos | Mensaje de estado vacío |

**Nota:** Las imágenes de la galería se gestionan desde el apartado "Galería" en el admin.

---

## ⭐ Testimonios

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `testimonios_color_fondo` | Color | Color de fondo | Galería y testimonios → Testimonios · Color de fondo | Fondo de la sección |

**Nota:** Los testimonios se generan automáticamente desde las encuestas de satisfacción.

---

## 📍 Ubicación

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `ubicacion_titulo` | Texto | Título de la sección | Ubicación → Ubicación · Título | Encabezado |
| `ubicacion_descripcion` | Texto | Descripción | Ubicación → Ubicación · Descripción | Texto descriptivo |
| `ubicacion_direccion` | Texto | **Dirección física completa** | Ubicación → Ubicación · Dirección | Texto junto al mapa |
| `ubicacion_maps_url` | Texto/HTML | **URL embebida de Google Maps** | Ubicación → Ubicación · URL de Google Maps | Mapa interactivo |
| `ubicacion_color_fondo` | Color | Color de fondo | Ubicación → Ubicación · Color de fondo | Fondo de la sección |

**⚠️ CRÍTICO - URL de Google Maps:**
1. Ve a Google Maps y busca tu barbería
2. Haz clic en "Compartir" → "Insertar un mapa"
3. Copia el código HTML completo del iframe
4. Pégalo en el campo `ubicacion_maps_url`
5. Ejemplo: `<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" style="border:0" allowfullscreen="" loading="lazy"></iframe>`

**⚠️ IMPORTANTE - Dirección:**
- Debe ser la dirección física completa y exacta
- Incluye calle, número, colonia, ciudad, estado, código postal
- Ejemplo: "Mirador de San Juan 64-local 3, Fraccionamiento el Mirador, segunda planta, 76246 Santiago de Querétaro, Qro."

---

## 📞 Contacto

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `contacto_telefono` | Texto | Teléfono de contacto | Contacto → Teléfono de contacto | Sección de contacto y footer |
| `contacto_email` | Texto | Email de contacto | Contacto → Email de contacto | Sección de contacto y footer |
| `contacto_direccion` | Texto | Dirección de contacto | Contacto → Dirección de contacto | Sección de contacto (fallback si no hay ubicacion_direccion) |
| `contacto_whatsapp` | Texto | Número de WhatsApp | Contacto → WhatsApp de contacto | (Opcional, para futuras mejoras) |
| `horarios_laborales` | Texto | Horarios de atención | Contacto → Horarios laborales | Sección de contacto |
| `contacto_color_fondo` | Color | Color de fondo | Contacto → Color de fondo | Fondo de la sección |
| `contacto_color_tarjeta` | Color | Color de las tarjetas | Contacto → Color de las tarjetas | Fondo de las tarjetas de contacto |

**Formato de Horarios:**
- Puedes usar saltos de línea con `\n`
- Ejemplo: "Lun-Sáb: 9:00-19:00\nDom: 10:00-18:00"

---

## 🔗 Redes Sociales

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `social_facebook` | URL | URL de Facebook | Contacto → URL de Facebook | Footer (icono de Facebook) |
| `social_instagram` | URL | URL de Instagram | Contacto → URL de Instagram | Footer (icono de Instagram) |
| `social_twitter` | URL | URL de Twitter/X | Contacto → URL de Twitter / X | Footer (icono de Twitter) |

---

## 📄 Footer

### Campos Requeridos:

| Campo | Tipo | Descripción | Ubicación en Admin | Ubicación en Página |
|------|------|-------------|---------------------|---------------------|
| `footer_descripcion` | Texto | Descripción del footer | Footer → Descripción | Texto descriptivo |
| `footer_color_fondo` | Color | Color de fondo | Footer → Color de fondo | Fondo del footer |
| `footer_color_texto` | Color | Color del texto | Footer → Color de texto | Color del texto en el footer |
| `footer_servicio_1` | Texto | Servicio destacado 1 | Footer → Servicio destacado 1 | Lista de servicios |
| `footer_servicio_2` | Texto | Servicio destacado 2 | Footer → Servicio destacado 2 | Lista de servicios |
| `footer_servicio_3` | Texto | Servicio destacado 3 | Footer → Servicio destacado 3 | Lista de servicios |
| `footer_servicio_4` | Texto | Servicio destacado 4 | Footer → Servicio destacado 4 | Lista de servicios |

---

## 🎨 Características Destacadas (Opcional - No se muestra actualmente)

Estos campos están disponibles pero la sección no se muestra en la página actual:

| Campo | Tipo | Descripción |
|------|------|-------------|
| `caracteristica_1_titulo` | Texto | Título de característica 1 |
| `caracteristica_1_descripcion` | Texto | Descripción de característica 1 |
| `caracteristica_2_titulo` | Texto | Título de característica 2 |
| `caracteristica_2_descripcion` | Texto | Descripción de característica 2 |
| `caracteristica_3_titulo` | Texto | Título de característica 3 |
| `caracteristica_3_descripcion` | Texto | Descripción de característica 3 |
| `caracteristica_4_titulo` | Texto | Título de característica 4 |
| `caracteristica_4_descripcion` | Texto | Descripción de característica 4 |
| `features_color_fondo` | Color | Color de fondo de características |
| `features_color_icono` | Color | Color de íconos de características |

---

## 📝 Resumen de Elementos Críticos

### ✅ Elementos OBLIGATORIOS para funcionamiento básico:

1. **`logo_barberia`** (IMAGEN) - Logo de la barbería
2. **`inicio_hero_image`** (IMAGEN) - **FOTO DE FONDO DEL HERO (ALTA CALIDAD)**
3. **`inicio_titulo`** (Texto) - Título principal
4. **`inicio_descripcion`** (Texto) - Descripción principal
5. **`ubicacion_direccion`** (Texto) - Dirección física
6. **`ubicacion_maps_url`** (HTML) - URL embebida de Google Maps
7. **`contacto_telefono`** (Texto) - Teléfono
8. **`contacto_email`** (Texto) - Email

### 🎨 Elementos RECOMENDADOS para mejor experiencia:

1. **`establecimiento_imagen`** (IMAGEN) - Foto del establecimiento
2. **`servicios_descripcion`** (Texto) - Descripción de servicios
3. **`galeria_descripcion`** (Texto) - Descripción de galería
4. **`social_facebook`** (URL) - Facebook
5. **`social_instagram`** (URL) - Instagram
6. Todos los colores de branding y fondos

---

## 🖼️ Especificaciones de Imágenes

### Logo (`logo_barberia`):
- **Tamaño mínimo:** 200x200px
- **Tamaño ideal:** 400x400px
- **Formato:** PNG (transparente) o JPG (fondo blanco)
- **Peso máximo:** 500 KB

### Imagen Hero (`inicio_hero_image`):
- **Resolución mínima:** 1920x1080px (Full HD)
- **Resolución ideal:** 3840x2160px (4K)
- **Formato:** JPG de alta calidad
- **Peso máximo:** 2-3 MB (optimizado)
- **Contenido:** Foto de la barbería o barbero en acción
- **Aspecto:** Horizontal (landscape)

### Imagen Establecimiento (`establecimiento_imagen`):
- **Resolución mínima:** 1200x800px
- **Resolución ideal:** 1920x1280px
- **Formato:** JPG o PNG
- **Peso máximo:** 1-2 MB
- **Contenido:** Vista del interior o exterior de la barbería

---

## 🔧 Cómo Configurar

1. Inicia sesión en el panel de administración
2. Ve a "Configuración" → "Contenido del Sitio Web"
3. Usa la barra de búsqueda para encontrar cada campo
4. Para imágenes, haz clic en "Editar" y sube la imagen
5. Asegúrate de activar cada campo (toggle ON/OFF)
6. Guarda los cambios
7. Recarga la página principal (Ctrl+F5) para ver los cambios

---

## ⚠️ Notas Importantes

- Todos los campos tienen valores por defecto, pero es recomendable personalizarlos
- Las imágenes deben estar activas (toggle ON) para mostrarse
- Los colores deben estar en formato hexadecimal (ej: #0f172a)
- Después de subir imágenes, recarga la página con Ctrl+F5 para limpiar la caché
- La imagen del Hero es crítica para la primera impresión de los visitantes

---

## 📞 Soporte

Si tienes problemas configurando algún campo, verifica:
1. Que el campo esté activo (toggle ON)
2. Que la imagen se haya subido correctamente
3. Que los valores no estén vacíos
4. La consola del navegador (F12) para ver errores




