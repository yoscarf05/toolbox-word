// Script to generate the comprehensive 100+ guides catalog for Toolbox Word
const fs = require('fs');
const path = require('path');

const GUIDES_RAW = [
  // CATEGORY 1: PDF (12 guides)
  {
    id: 'como-reducir-tamano-pdf',
    slug: 'como-reducir-tamano-pdf',
    category: 'pdf',
    readTime: '4 min',
    relatedToolId: 'compress-pdf',
    title: {
      es: 'Cómo reducir el tamaño de un PDF sin perder calidad visual',
      en: 'How to reduce PDF file size without losing visual quality'
    },
    summary: {
      es: 'Aprende a comprimir documentos PDF pesados para enviarlos por correo electrónico o subirlos a portales universitarios y gubernamentales.',
      en: 'Learn how to compress heavy PDF documents for email attachments or university and government portal submissions.'
    },
    seoTitle: {
      es: 'Cómo Reducir el Tamaño de un PDF sin Perder Calidad | Toolbox Word',
      en: 'How to Reduce PDF File Size Without Losing Quality | Toolbox Word'
    },
    metaDescription: {
      es: 'Guía paso a paso para optimizar y comprimir archivos PDF de forma 100% gratuita y privada en tu navegador web.',
      en: 'Step-by-step guide to optimize and compress PDF files 100% free and privately in your web browser.'
    },
    steps: [
      { title: 'Abre la herramienta Comprimir PDF', desc: 'Ingresa a Toolbox Word sin registrarte ni instalar software adicional.' },
      { title: 'Selecciona tu archivo PDF', desc: 'Arrastra el documento directamente al área de trabajo de tu navegador.' },
      { title: 'Elige el nivel de compresión', desc: 'Selecciona entre compresión recomendada (60% ahorro) o máxima para límites estrictos.' },
      { title: 'Descarga tu archivo optimizado', desc: 'Guarda el PDF reducido directamente en tu dispositivo sin marcas de agua.' }
    ],
    content: {
      es: `## ¿Por qué los archivos PDF suelen pesar tanto?
La mayoría de los documentos PDF generados desde escáneres, suites de diseño o procesadores de texto contienen capas de imágenes sin comprimir a 300 DPI, fuentes incrustadas duplicadas y metadatos innecesarios.

### Tres soluciones clave para reducir el peso
1. **Optimización de mapas de bits**: Reducir la resolución de imágenes secundarias de 300 a 150 DPI mantiene la nitidez en pantalla y reduce hasta un 70% del peso total.
2. **Eliminación de metadatos redundantes**: Las copias de revisión intermedias acumulan historial que incrementa el archivo sin aportar valor visual.
3. **Compresión local segura**: Al utilizar Toolbox Word, la optimización ocurre en tu memoria RAM sin transferir tus contratos o registros a servidores de terceros.

### Límites comunes de carga en plataformas
- Correo electrónico estándar (Gmail, Outlook): Máximo 25 MB por archivo.
- Portales de empleo y universidades: Generalmente exigen límites entre 2 MB y 5 MB.
- Plataformas gubernamentales y juzgados: Límites estrictos de 5 MB a 10 MB.`,
      en: `## Why do PDF files get so large?
Most PDF documents exported from scanners or graphic design applications contain uncompressed 300 DPI scans, duplicated font subsets, and redundant metadata streams.

### Key methods to optimize PDF files
1. **Downsampling image streams**: Lowering resolution from 300 to 150 DPI maintains sharp retina display reading while cutting up to 70% of storage.
2. **Removing redundant metadata**: Revision logs and color profile attachments inflate files needlessly.
3. **Local client-side execution**: In Toolbox Word, compression runs entirely in your local browser engine with zero server uploads.`
    }
  },
  {
    id: 'como-convertir-pdf-a-word-editable',
    slug: 'como-convertir-pdf-a-word-editable',
    category: 'pdf',
    readTime: '5 min',
    relatedToolId: 'pdf-to-word',
    title: {
      es: 'Cómo convertir un archivo PDF a Word (.docx) editable gratis',
      en: 'How to convert a PDF file to editable Word (.docx) for free'
    },
    summary: {
      es: 'Descubre cómo transformar documentos PDF en archivos Word totalmente editables conservando párrafos, títulos y estructura limpia.',
      en: 'Discover how to transform PDF documents into fully editable Word files preserving paragraphs, headings, and clean structure.'
    },
    seoTitle: {
      es: 'Convertir PDF a Word DOCX Editable Gratis | Toolbox Word',
      en: 'Convert PDF to Editable Word DOCX Free | Toolbox Word'
    },
    metaDescription: {
      es: 'Convierte tus documentos PDF en archivos Microsoft Word (.docx) editables de forma instantánea y privada en tu navegador.',
      en: 'Convert PDF documents to editable Microsoft Word (.docx) files instantly and privately in your browser.'
    },
    steps: [
      { title: 'Accede a la herramienta PDF a Word', desc: 'Entra a Toolbox Word y selecciona la herramienta destacada PDF a Word.' },
      { title: 'Carga tu documento PDF', desc: 'Arrastra el archivo PDF que deseas convertir a formato DOCX.' },
      { title: 'Personaliza formato y fuentes', desc: 'Elige la tipografía de destino (Calibri, Arial o Times New Roman) e interlineado.' },
      { title: 'Descarga tu documento .docx', desc: 'Abre y edita tu archivo en Microsoft Word, Google Docs o LibreOffice sin restricciones.' }
    ],
    content: {
      es: `## La ventaja de convertir PDF a formato DOCX
El formato PDF es ideal para preservar el aspecto visual exacto de un documento al imprimirlo o enviarlo, pero modificar su texto es sumamente engorroso. Al convertirlo a DOCX nativo obtienes total libertad editorial.

### ¿Qué elementos se transfieren a Word?
- **Párrafos fluidos**: El texto extraído se organiza en párrafos continuos para que puedas editar oraciones sin saltos de línea forzados.
- **Tipografías estándar**: Puedes seleccionar Calibri, Arial o Times New Roman para adecuar el documento a los estándares de tu empresa o universidad.
- **Interlineado y márgenes**: Configuración lista para continuar trabajando en procesadores de texto modernos.

### Privacidad absoluta durante la conversión
Muchos convertidores online envían tus estados de cuenta, contratos o historiales médicos a servidores remotos. En Toolbox Word, la extracción y compilación binaria del archivo .docx ocurre 100% dentro de tu propio navegador web.`,
      en: `## Why convert PDF to DOCX format?
PDF format is designed for visual preservation, making direct editing difficult. Converting to standard DOCX grants complete textual editing freedom.

### Preserved elements
- **Flowing text paragraphs**: Text fragments are consolidated into paragraphs for natural typing.
- **Standard typography**: Choose between Calibri, Arial, or Times New Roman.
- **Complete client-side safety**: Processing is executed in the browser sandbox with no external uploads.`
    }
  },
  {
    id: 'guia-completa-citas-apa-7-edicion',
    slug: 'guia-completa-citas-apa-7-edicion',
    category: 'citas',
    readTime: '6 min',
    relatedToolId: 'citation-generator',
    title: {
      es: 'Guía completa de citas y referencias en formato APA 7.ª edición',
      en: 'Complete guide to APA 7th edition citations and references'
    },
    summary: {
      es: 'Aprende las normas oficiales de la APA 7.ª edición para citar libros, artículos científicos, páginas web y redactar la bibliografía de tu tesis.',
      en: 'Learn official APA 7th edition guidelines to cite books, journal articles, websites, and format thesis bibliographies.'
    },
    seoTitle: {
      es: 'Normas APA 7.ª Edición: Guía de Citas y Referencias | Toolbox Word',
      en: 'APA 7th Edition Guidelines: Citations & References | Toolbox Word'
    },
    metaDescription: {
      es: 'Manual paso a paso con ejemplos reales para dominar citas textuales, paráfrasis y lista de referencias en formato APA 7.',
      en: 'Step-by-step guide with real examples for APA 7 citations, paraphrasing, and reference lists.'
    },
    steps: [
      { title: 'Identifica los 4 datos clave', desc: '¿Quién es el autor? ¿Cuándo se publicó? ¿Cómo se titula la obra? ¿Dónde se localiza (editorial, URL, DOI)?' },
      { title: 'Formula la cita en el texto', desc: 'Usa el sistema Autor-Año: (González, 2023) o González (2023) según la narrativa.' },
      { title: 'Aplica sangría francesa en las referencias', desc: 'La primera línea va alineada a la izquierda y las siguientes llevan sangría de 1.27 cm.' }
    ],
    content: {
      es: `## ¿Qué novedades introdujo APA 7.ª edición?
La séptima edición del manual de la American Psychological Association simplificó significativamente la forma en que referenciamos fuentes digitales e impresas:

1. **Hasta 20 autores en la lista de referencias**: Ya no se trunca la lista con *et al.* a partir del séptimo autor como ocurría en APA 6.
2. **Eliminación del lugar de publicación en libros**: Ya no se escribe la ciudad ni el país de la editorial (por ejemplo, antes "Madrid, España: Editorial Santillana", ahora simplemente "Editorial Santillana").
3. **Formato uniforme de enlaces DOI y URL**: Se deben presentar como hipervínculos funcionales directos que comiencen con https://doi.org/...
4. **Citas en texto de 3 o más autores**: Desde la primera mención en el texto se utiliza el primer autor seguido de *et al.* (ej. Smith et al., 2020).

### Estructura básica de una referencia en APA 7
- **Libro**: Apellido, N. (Año). *Título del libro en cursiva*. Editorial. https://doi.org/...
- **Artículo de revista**: Apellido, N. (Año). Título del artículo. *Nombre de la Revista*, *volumen*(número), páginas. https://doi.org/...
- **Página web**: Apellido, N. o Entidad. (Año, día mes). *Título de la publicación*. Nombre del sitio web. URL`,
      en: `## What changed in APA 7th edition?
The 7th edition of the APA Publication Manual introduced major improvements:
1. **Up to 20 authors in references**: Authors 1 through 20 are now listed before using an ellipsis.
2. **No publication location for books**: Omit publisher city and country.
3. **DOIs as active URLs**: Standardized format using https://doi.org/...`
    }
  },
  {
    id: 'como-unir-varios-archivos-pdf',
    slug: 'como-unir-varios-archivos-pdf',
    category: 'pdf',
    readTime: '3 min',
    relatedToolId: 'merge-pdf',
    title: {
      es: 'Cómo unir y combinar varios archivos PDF en un solo documento',
      en: 'How to merge and combine multiple PDF files into one document'
    },
    summary: {
      es: 'Combina contratos, anexos, certificados o informes sueltos en un único archivo PDF ordenado y profesional.',
      en: 'Combine contracts, appendixes, certificates, or reports into a single orderly PDF file.'
    },
    seoTitle: {
      es: 'Cómo Unir Varios Archivos PDF en Uno Solo Gratis | Toolbox Word',
      en: 'How to Merge Multiple PDF Files into One Free | Toolbox Word'
    },
    metaDescription: {
      es: 'Aprende a unir documentos PDF de forma rápida, segura y privada en tu navegador sin instalar programas.',
      en: 'Learn how to merge PDF documents quickly, safely, and privately in your browser with zero installations.'
    },
    steps: [
      { title: 'Abre la herramienta Unir PDF', desc: 'Haz clic en Unir PDF en Toolbox Word.' },
      { title: 'Sube todos tus documentos', desc: 'Selecciona 2 o más archivos PDF a la vez.' },
      { title: 'Reordena la secuencia', desc: 'Arrastra los documentos para colocar portadas primero y anexos al final.' },
      { title: 'Genera el PDF unificado', desc: 'Descarga un solo archivo consolidado listo para enviar.' }
    ],
    content: {
      es: `## Cuándo es indispensable unir archivos PDF
Enviar múltiples archivos adjuntos en un correo suele causar confusión y traspapelado de información. En trámites bancarios, postulaciones a becas y licitaciones públicas se exige la entrega de un único documento consolidado.

### Consejos antes de fusionar tus PDFs
- **Verifica la orientación**: Asegúrate de que todas las páginas estén en sentido vertical u horizontal homogéneo.
- **Nombra los archivos con prefijos**: Utiliza 01_Portada.pdf, 02_Propuesta.pdf para mantener el orden natural.
- **Revisa el peso final**: Si el archivo combinado supera los 15 MB, pasa el resultado final por la herramienta Comprimir PDF.`,
      en: `## When to merge PDF documents
Sending loose attachments often results in lost pages. Consolidating into one orderly PDF guarantees the recipient reads content in your intended order.`
    }
  },
  {
    id: 'como-dividir-extraer-paginas-pdf',
    slug: 'como-dividir-extraer-paginas-pdf',
    category: 'pdf',
    readTime: '3 min',
    relatedToolId: 'split-pdf',
    title: {
      es: 'Cómo dividir un PDF y extraer páginas específicas fácilmente',
      en: 'How to split a PDF and extract specific pages easily'
    },
    summary: {
      es: 'Extrae una sola página o separa un capítulo entero de un libro o documento PDF extenso en segundos.',
      en: 'Extract a single page or separate an entire chapter from a lengthy PDF document in seconds.'
    },
    seoTitle: {
      es: 'Dividir y Extraer Páginas de un PDF Gratis | Toolbox Word',
      en: 'Split & Extract Pages from a PDF Free | Toolbox Word'
    },
    metaDescription: {
      es: 'Separa páginas de documentos PDF sin perder calidad ni comprometer la privacidad de tus datos.',
      en: 'Extract pages from PDF documents without losing quality or compromising data privacy.'
    },
    steps: [
      { title: 'Abre la herramienta Dividir PDF', desc: 'Ingresa a la sección de herramientas PDF de Toolbox Word.' },
      { title: 'Carga tu archivo', desc: 'Arrastra el documento del cual deseas extraer contenido.' },
      { title: 'Define el rango de páginas', desc: 'Indica las páginas que necesitas (ejemplo: 1-3, 5, 8-12).' },
      { title: 'Descarga el nuevo PDF', desc: 'Obtén tu archivo con únicamente las páginas seleccionadas.' }
    ],
    content: {
      es: `## ¿Por qué extraer páginas de un PDF?
Frecuentemente recibimos manuales técnicos, libros enteros o contratos de 50 páginas cuando únicamente necesitamos compartir una cláusula, un certificado de notas o un recibo específico.

### Ventajas de dividir archivos localmente
- Ahorras ancho de banda al enviar archivos mucho más ligeros.
- Proteges tu privacidad al no compartir información irrelevante o confidencial contenida en las páginas restantes.`,
      en: `## Why extract pages from a PDF?
Often you only need to submit a specific certificate or invoice from a 100-page book or statement.`
    }
  },
  {
    id: 'guia-citas-mla-9-edicion',
    slug: 'guia-citas-mla-9-edicion',
    category: 'mla',
    readTime: '5 min',
    relatedToolId: 'citation-generator',
    title: {
      es: 'Guía de citas y referencias en formato MLA 9.ª edición',
      en: 'MLA 9th edition citation and reference style guide'
    },
    summary: {
      es: 'Domina las normas de la Modern Language Association (MLA 9) para ensayos de literatura, artes, filosofía y humanidades.',
      en: 'Master Modern Language Association (MLA 9) rules for essays in literature, arts, philosophy, and humanities.'
    },
    seoTitle: {
      es: 'Formato MLA 9.ª Edición: Citas y Obras Citadas | Toolbox Word',
      en: 'MLA 9th Edition Guidelines: In-Text Citations & Works Cited | Toolbox Word'
    },
    metaDescription: {
      es: 'Aprende a citar con el sistema Autor-Página y a construir la lista de Obras Citadas en estilo MLA 9.',
      en: 'Learn how to use Author-Page in-text citations and format Works Cited lists in MLA 9 style.'
    },
    steps: [
      { title: 'Aplica el sistema Autor-Página', desc: 'En el cuerpo del texto usa (Apellido 45) sin comas entre autor y número de página.' },
      { title: 'Identifica el contenedor', desc: 'En MLA, el contenedor es la plataforma o revista que aloja la obra (ej. Netflix, JSTOR, Spotify).' },
      { title: 'Prepara la lista de Obras Citadas', desc: 'Ordena alfabéticamente por apellido y aplica sangría francesa.' }
    ],
    content: {
      es: `## La filosofía del formato MLA 9.ª edición
A diferencia del formato APA que prioriza la fecha de publicación porque la evidencia científica caduca rápidamente, el formato MLA prioriza la autoría y la ubicación exacta de las palabras (número de página) porque en literatura y filosofía el texto original es permanente.

### Elementos nucleares del contenedor MLA
1. Autor.
2. Título de la fuente.
3. Título del contenedor,
4. Otros colaboradores,
5. Versión,
6. Número,
7. Editorial,
8. Fecha de publicación,
9. Ubicación (página, URL o DOI).`,
      en: `## The philosophy behind MLA 9
MLA emphasizes the author and the precise page location because in humanities, historical literary texts remain timeless.`
    }
  },
  {
    id: 'guia-estilo-chicago-autor-fecha',
    slug: 'guia-estilo-chicago-autor-fecha',
    category: 'chicago',
    readTime: '5 min',
    relatedToolId: 'citation-generator',
    title: {
      es: 'Formato Chicago: Manual de estilo Autor-Fecha y Notas al Pie',
      en: 'Chicago Style Manual: Author-Date and Notes/Bibliography'
    },
    summary: {
      es: 'Conoce los dos sistemas de citación del manual de Chicago (17.ª ed.) y aprende cuándo utilizar cada uno en tus investigaciones.',
      en: 'Explore both Chicago citation systems (17th ed.) and learn when to apply each in your research papers.'
    },
    seoTitle: {
      es: 'Estilo Chicago 17.ª Edición: Citas y Bibliografía | Toolbox Word',
      en: 'Chicago Style 17th Edition: Citations & Bibliography | Toolbox Word'
    },
    metaDescription: {
      es: 'Explicación clara del Manual de Estilo de Chicago para citas autor-fecha y notas a pie de página en historia y humanidades.',
      en: 'Clear explanation of the Chicago Manual of Style for author-date citations and footnotes in history and humanities.'
    },
    steps: [
      { title: 'Elige tu sistema Chicago', desc: 'Autor-Fecha (ciencias sociales) o Notas y Bibliografía (historia y arte).' },
      { title: 'Genera notas al pie', desc: 'Inserta superíndices numéricos ¹ en el texto y detalle al pie de página.' },
      { title: 'Compila la bibliografía final', desc: 'Agrega la lista completa ordenada alfabéticamente al final del trabajo.' }
    ],
    content: {
      es: `## Los dos sistemas del Manual de Estilo de Chicago
1. **Notas y Bibliografía (Notes and Bibliography)**: Es el formato preferido en historia, religión y literatura. Permite al lector consultar la fuente al pie de página sin perder el hilo de lectura.
2. **Autor-Fecha (Author-Date)**: Utilizado comúnmente en antropología, ciencias políticas y economía, muy similar en estructura a APA.`,
      en: `## The two systems of Chicago style
1. **Notes and Bibliography**: Preferred in history and arts, placing citations in footnotes or endnotes.
2. **Author-Date**: Widely used in social sciences.`
    }
  },
  {
    id: 'guia-estilo-vancouver-medicina',
    slug: 'guia-estilo-vancouver-medicina',
    category: 'citas',
    readTime: '4 min',
    relatedToolId: 'citation-generator',
    title: {
      es: 'Normas Vancouver: Citas y referencias para medicina y ciencias de la salud',
      en: 'Vancouver Style: Citations and references for medicine and health sciences'
    },
    summary: {
      es: 'Guía oficial del sistema Vancouver para redactar artículos médicos, casos clínicos y trabajos de investigación en salud.',
      en: 'Official Vancouver style guide for medical papers, clinical case studies, and healthcare research.'
    },
    seoTitle: {
      es: 'Normas Vancouver para Medicina y Salud | Toolbox Word',
      en: 'Vancouver Reference Style for Medical Sciences | Toolbox Word'
    },
    metaDescription: {
      es: 'Aprende a citar con el sistema numérico consecutivo de Vancouver para revistas biomédicas y tesis de salud.',
      en: 'Learn how to format consecutive numerical citations in Vancouver style for biomedical journals.'
    },
    steps: [
      { title: 'Asigna números por orden de aparición', desc: 'La primera fuente citada en el texto será (1), la segunda (2).' },
      { title: 'Usa abreviaturas de revistas NLM', desc: 'Los nombres de revistas científicas se abrevian según el Index Medicus.' },
      { title: 'Hasta 6 autores', desc: 'Enumera hasta 6 autores separados por comas; a partir del séptimo añade et al.' }
    ],
    content: {
      es: `## ¿Cómo funciona el sistema Vancouver?
El estilo Vancouver es un sistema de citas numérico adoptado por el International Committee of Medical Journal Editors (ICMJE).
- En el texto las citas se indican con números arábigos entre paréntesis (1) o en superíndice¹.
- Si una fuente se vuelve a citar más adelante, conserva el mismo número que se le asignó originalmente.
- La bibliografía final se ordena estrictamente por orden numérico correlativo (1, 2, 3...), NUNCA por orden alfabético.`,
      en: `## How Vancouver numerical style works
Vancouver assigns a sequential number to each source based on its appearance in text. The final reference list follows numerical order, not alphabetical.`
    }
  },
  {
    id: 'guia-citas-ieee-ingenieria',
    slug: 'guia-citas-ieee-ingenieria',
    category: 'citas',
    readTime: '4 min',
    relatedToolId: 'citation-generator',
    title: {
      es: 'Formato IEEE: Guía de citación para ingeniería y ciencias de la computación',
      en: 'IEEE Citation Style: Guide for engineering and computer science'
    },
    summary: {
      es: 'Aprende a utilizar el formato oficial del Institute of Electrical and Electronics Engineers para papers y proyectos de software.',
      en: 'Learn official IEEE format for computer science, telecommunications, and engineering research papers.'
    },
    seoTitle: {
      es: 'Formato IEEE para Ingeniería y Computación | Toolbox Word',
      en: 'IEEE Citation Style Guide for Engineering | Toolbox Word'
    },
    metaDescription: {
      es: 'Manual práctico de citas entre corchetes [1] y referencias bibliográficas en formato IEEE.',
      en: 'Practical guide to bracketed citations [1] and references in IEEE format.'
    },
    steps: [
      { title: 'Inserta citas entre corchetes', desc: 'Usa [1] o [2]-[4] directamente dentro de la oración.' },
      { title: 'Iniciales antes del apellido', desc: 'En IEEE se colocan las iniciales de nombre antes del apellido (ej. J. K. Smith).' },
      { title: 'Títulos de artículos entre comillas', desc: 'Los artículos llevan comillas dobles y las conferencias o revistas van en cursiva.' }
    ],
    content: {
      es: `## Reglas básicas del formato IEEE
El estándar IEEE es la norma de referencia en robótica, telecomunicaciones, inteligencia artificial y desarrollo de software:
- Las citas dentro del texto se encierran entre corchetes rectos: "[1] demostró que..." o "...según recientes algoritmos [2], [5]".
- No se menciona el nombre del autor ni el año en el cuerpo del texto a menos que sea gramaticalmente necesario.
- La lista de referencias se organiza por el orden de aparición numérica [1], [2], [3].`,
      en: `## Core rules of IEEE style
IEEE references are formatted with bracketed numbers [1]. Titles of conference proceedings and journals are italicized.`
    }
  },
  {
    id: 'como-citar-con-estilo-harvard',
    slug: 'como-citar-con-estilo-harvard',
    category: 'harvard',
    readTime: '4 min',
    relatedToolId: 'citation-generator',
    title: {
      es: 'Sistema de citas Harvard: Estructura, ejemplos y reglas prácticas',
      en: 'Harvard Referencing System: Structure, examples, and practical rules'
    },
    summary: {
      es: 'Todo lo que necesitas saber sobre el sistema Autor-Fecha Harvard, ampliamente requerido en universidades de Reino Unido y Europa.',
      en: 'Everything you need to know about the Harvard Author-Date referencing system widely used in universities.'
    },
    seoTitle: {
      es: 'Sistema de Citas Harvard: Guía Completa | Toolbox Word',
      en: 'Harvard Referencing Guide & Examples | Toolbox Word'
    },
    metaDescription: {
      es: 'Ejemplos claros para citar libros, páginas web y artículos con el sistema de referencias Harvard.',
      en: 'Clear examples for citing books, websites, and articles with the Harvard referencing system.'
    },
    steps: [
      { title: 'Cita en texto (Autor, Año)', desc: 'Ejemplo: (Johnson, 2021) o según Johnson (2021).' },
      { title: 'Lista de referencias alfabética', desc: 'Usa sangría francesa y apellidos en mayúscula o estándar según tu universidad.' },
      { title: 'Fechas de acceso en webs', desc: 'Indica siempre la fecha en que consultaste fuentes en línea.' }
    ],
    content: {
      es: `## Particularidades del estilo Harvard
El estilo Harvard es un sistema de autor-fecha flexible. En la lista final:
- Los títulos de libros van en cursiva.
- Los títulos de artículos de revistas van entre comillas simples 'ejemplo'.
- Las referencias web incluyen siempre la leyenda "Disponible en: [URL] (Accedido el: DD/MM/AAAA)".`,
      en: `## Characteristics of Harvard style
Harvard uses (Author, Year) in-text citations. Book titles are italicized and article titles are enclosed in single quotes.`
    }
  },
  {
    id: 'como-citar-pagina-web-apa-7',
    slug: 'como-citar-pagina-web-apa-7',
    category: 'apa',
    readTime: '4 min',
    relatedToolId: 'citation-generator',
    title: {
      es: 'Cómo citar una página web, blog o artículo online en APA 7',
      en: 'How to cite a website, blog, or online article in APA 7'
    },
    summary: {
      es: 'Aprende a citar páginas de internet con autor individual, autor corporativo, artículos sin fecha o sitios institucionales.',
      en: 'Learn how to cite web pages with personal authors, corporate authors, undated sites, or online portals.'
    },
    seoTitle: {
      es: 'Cómo Citar Páginas Web en APA 7.ª Edición | Toolbox Word',
      en: 'How to Cite Websites in APA 7th Edition | Toolbox Word'
    },
    metaDescription: {
      es: 'Aprende la fórmula correcta para citar páginas web y artículos de internet en normas APA 7.',
      en: 'Learn the exact formula to cite websites and internet articles in APA 7 standards.'
    },
    steps: [
      { title: 'Localiza el autor o entidad responsable', desc: 'Puede ser una persona (Pérez, J.) o una organización (NASA, OMS).' },
      { title: 'Busca la fecha exacta de publicación', desc: 'Si solo hay año, coloca (2024). Si no hay fecha, escribe (s.f.).' },
      { title: 'Coloca el título en cursiva', desc: 'El título de la página web específica va en letra cursiva.' },
      { title: 'Añade el sitio y el enlace directo', desc: 'Indica el portal y copia el enlace URL completo.' }
    ],
    content: {
      es: `## La fórmula oficial para páginas web en APA 7
**Estructura:**
Apellido, Inicial del nombre. (Año, Día de Mes). *Título de la página o entrada*. Nombre del portal web. URL

### Ejemplos prácticos:
- **Con autor individual**: Martínez, C. (2023, 14 de mayo). *Impacto de la inteligencia artificial en la docencia*. Portal Universitario. https://ejemplo.com/ia-docencia
- **Con autor corporativo**: Organización Mundial de la Salud. (2024, 10 de febrero). *Recomendaciones sobre actividad física*. https://who.int/actividad-fisica
- **Sin fecha conocida**: Real Academia Española. (s.f.). *Diccionario de la lengua española*. Recuperado el 15 de marzo de 2024, de https://dle.rae.es`,
      en: `## Official APA 7 formula for webpages
Author, A. A. (Year, Month Day). *Title of webpage*. Site Name. URL`
    }
  },
  {
    id: 'como-citar-libro-apa-7',
    slug: 'como-citar-libro-apa-7',
    category: 'apa',
    readTime: '4 min',
    relatedToolId: 'citation-generator',
    title: {
      es: 'Cómo citar libros impresos y electrónicos (e-books) en APA 7',
      en: 'How to cite printed and digital books (e-books) in APA 7'
    },
    summary: {
      es: 'Guía paso a paso para referenciar libros completos, capítulos con autor diferente y versiones digitales con DOI.',
      en: 'Step-by-step guide to referencing complete books, edited book chapters, and ebooks with DOI.'
    },
    seoTitle: {
      es: 'Cómo Citar Libros en APA 7 con Ejemplos | Toolbox Word',
      en: 'How to Cite Books in APA 7 with Examples | Toolbox Word'
    },
    metaDescription: {
      es: 'Aprende a citar libros impresos, electrónicos y capítulos en normas APA 7.',
      en: 'Learn how to cite print books, ebooks, and edited chapters in APA 7 format.'
    },
    steps: [
      { title: 'Identifica los autores', desc: 'Apellido e inicial del nombre de los autores.' },
      { title: 'Año de edición', desc: 'Año de publicación de la versión que estás consultando.' },
      { title: 'Título del libro en cursiva', desc: 'Aplica cursiva al título del libro y mayúscula inicial.' },
      { title: 'Editorial y DOI/URL', desc: 'Nombre de la editorial sin ciudad ni país.' }
    ],
    content: {
      es: `## Fórmula de citación de libros en APA 7
Apellido, N. (Año). *Título del libro en cursiva* (n.ª ed.). Editorial. https://doi.org/...

### Ejemplo real:
Hernández-Sampieri, R., & Mendoza, C. P. (2018). *Metodología de la investigación: Las rutas cuantitativa, cualitativa y mixta*. McGraw-Hill Education.`,
      en: `## Book citation formula in APA 7
Author, A. A. (Year). *Title of work* (edition). Publisher. DOI or URL`
    }
  }
];

// Helper to generate the remaining structured guides to reach 105+
const CATEGORY_EXPANSIONS = [
  // WORD (9 more guides)
  { cat: 'word', titleEs: 'Cómo dar formato profesional a una tesis en Microsoft Word', titleEn: 'How to format a university thesis professionally in Microsoft Word', tool: 'pdf-to-word' },
  { cat: 'word', titleEs: 'Cómo numerar páginas a partir de una sección específica en Word', titleEn: 'How to start page numbering from a specific page in Word', tool: 'pdf-to-word' },
  { cat: 'word', titleEs: 'Cómo crear una tabla de contenido o índice automático en Word', titleEn: 'How to create an automatic table of contents in Word', tool: 'pdf-to-word' },
  { cat: 'word', titleEs: 'Cómo reducir el peso de un documento Word con muchas imágenes', titleEn: 'How to reduce the file size of a Word document with images', tool: 'compress-image' },
  { cat: 'word', titleEs: 'Cómo recuperar un documento Word no guardado o cerrado por error', titleEn: 'How to recover an unsaved or accidentally closed Word document', tool: 'word-counter' },
  { cat: 'word', titleEs: 'Guía de combinación de correspondencia en Microsoft Word', titleEn: 'Guide to mail merge in Microsoft Word', tool: 'pdf-to-word' },
  { cat: 'word', titleEs: 'Cómo convertir Word a PDF sin desconfigurar fuentes ni márgenes', titleEn: 'How to export Word to PDF without losing fonts or layouts', tool: 'pdf-to-word' },
  { cat: 'word', titleEs: 'Cómo utilizar el Control de Cambios en Word para revisiones colaborativas', titleEn: 'How to use Track Changes in Word for collaborative document review', tool: 'text-diff' },
  { cat: 'word', titleEs: '25 atajos de teclado esenciales para duplicar tu productividad en Word', titleEn: '25 essential keyboard shortcuts to double your productivity in Word', tool: 'word-counter' },

  // CITAS / APA / MLA / CHICAGO (12 more guides)
  { cat: 'citas', titleEs: 'Cómo citar artículos de revistas científicas con código DOI en APA 7', titleEn: 'How to cite scientific journal articles with DOI in APA 7', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cómo citar tesis de licenciatura, maestría y doctorado en APA 7', titleEn: 'How to cite undergraduate and doctoral theses in APA 7', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cómo citar videos de YouTube, podcasts y conferencias online en APA 7', titleEn: 'How to cite YouTube videos, podcasts, and online talks in APA 7', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cómo citar publicaciones de redes sociales (Instagram, X, LinkedIn) en APA 7', titleEn: 'How to cite social media posts in APA 7', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Diferencias clave entre APA 7 y MLA 9: ¿cuál debes usar?', titleEn: 'Key differences between APA 7 and MLA 9: which one should you choose?', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cita textual corta, cita en bloque y paráfrasis: cómo citar sin plagio', titleEn: 'Short direct quotes, block quotes, and paraphrasing without plagiarism', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cómo aplicar la sangría francesa en la bibliografía en Word y Docs', titleEn: 'How to apply hanging indent for bibliography in Word and Docs', tool: 'pdf-to-word' },
  { cat: 'citas', titleEs: 'Qué hacer cuando una fuente bibliográfica no tiene autor identificado', titleEn: 'What to do when a reference has no identifiable author', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cómo citar fuentes sin fecha de publicación oficial (s.f. o n.d.)', titleEn: 'How to cite sources with no publication date (n.d.)', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Reglas para ordenar alfabéticamente tu lista final de referencias en APA 7', titleEn: 'Rules for alphabetically sorting your final reference list in APA 7', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cómo citar leyes, decretos, resoluciones y normativas jurídicas', titleEn: 'How to cite laws, government decrees, and legal rulings', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cómo citar informes técnicos y documentos PDF gubernamentales', titleEn: 'How to cite technical reports and government PDF documents', tool: 'citation-generator' },

  // INVESTIGACIÓN ACADÉMICA (10 guides)
  { cat: 'investigacion', titleEs: 'Cómo redactar una introducción académica clara y persuasiva', titleEn: 'How to write a clear and persuasive academic introduction', tool: 'word-counter' },
  { cat: 'investigacion', titleEs: 'Pasos para formular el planteamiento del problema en una tesis', titleEn: 'Steps to formulate the problem statement in a thesis', tool: 'word-counter' },
  { cat: 'investigacion', titleEs: 'Cómo construir un marco teórico sólido y rigurosamente fundamentado', titleEn: 'How to construct a solid and well-grounded theoretical framework', tool: 'citation-generator' },
  { cat: 'investigacion', titleEs: 'Cómo plantear hipótesis y variables en investigaciones cuantitativas', titleEn: 'How to formulate hypotheses and variables in quantitative research', tool: 'word-counter' },
  { cat: 'investigacion', titleEs: 'Metodología cualitativa vs. cuantitativa: criterios de selección', titleEn: 'Qualitative vs. quantitative methodology: selection criteria', tool: 'word-counter' },
  { cat: 'investigacion', titleEs: 'Cómo realizar una revisión sistemática de literatura o estado del arte', titleEn: 'How to conduct a systematic literature review or state of the art', tool: 'citation-generator' },
  { cat: 'investigacion', titleEs: 'Buenas prácticas para diseñar encuestas y cuestionarios de investigación', titleEn: 'Best practices for designing research surveys and questionnaires', tool: 'word-counter' },
  { cat: 'investigacion', titleEs: 'Cómo presentar e interpretar tablas y gráficos estadísticos en tu tesis', titleEn: 'How to present and interpret statistical tables and charts in thesis', tool: 'pdf-to-word' },
  { cat: 'investigacion', titleEs: 'Cómo redactar conclusiones contundentes y recomendaciones útiles', titleEn: 'How to write compelling conclusions and practical recommendations', tool: 'word-counter' },
  { cat: 'investigacion', titleEs: 'Consejos para preparar y triunfar en la defensa oral de tu tesis', titleEn: 'Tips to prepare and excel in your oral thesis defense', tool: 'word-counter' },

  // ESTUDIANTES (10 guides)
  { cat: 'estudiantes', titleEs: 'Cómo estructurar y redactar un ensayo universitario con nota máxima', titleEn: 'How to structure and write a top-scoring university essay', tool: 'word-counter' },
  { cat: 'estudiantes', titleEs: 'Técnicas efectivas para resumir lecturas y textos académicos densos', titleEn: 'Effective techniques to summarize dense academic readings', tool: 'word-counter' },
  { cat: 'estudiantes', titleEs: 'El Método Cornell: cómo tomar apuntes de clase organizados y útiles', titleEn: 'The Cornell Note-Taking System: organize useful lecture notes', tool: 'word-counter' },
  { cat: 'estudiantes', titleEs: 'Estrategia de estudio para planificar semanas de exámenes finales', titleEn: 'Study strategy for planning final exam weeks effectively', tool: 'date-difference' },
  { cat: 'estudiantes', titleEs: 'Cómo aplicar la Técnica Pomodoro para estudiar con máxima concentración', titleEn: 'How to apply the Pomodoro Technique to study with peak focus', tool: 'word-counter' },
  { cat: 'estudiantes', titleEs: 'Qué es el plagio académico y cómo utilizar herramientas de citación para evitarlo', titleEn: 'What is academic plagiarism and how citation tools prevent it', tool: 'citation-generator' },
  { cat: 'estudiantes', titleEs: 'Las mejores herramientas digitales gratuitas para estudiantes universitarios', titleEn: 'The best free digital tools for university students', tool: 'pdf-to-word' },
  { cat: 'estudiantes', titleEs: 'Cómo crear mapas mentales y esquemas conceptuales para repasar materias', titleEn: 'How to create mind maps and concept diagrams for subject revision', tool: 'word-counter' },
  { cat: 'estudiantes', titleEs: 'Plantillas y pautas para redactar un correo formal a un profesor', titleEn: 'Templates and etiquette to write a formal email to a professor', tool: 'word-counter' },
  { cat: 'estudiantes', titleEs: 'Gestión del tiempo para estudiantes que trabajan: claves para no agotarse', titleEn: 'Time management for working students: keys to avoiding burnout', tool: 'date-difference' },

  // PRODUCTIVIDAD (10 guides)
  { cat: 'productividad', titleEs: 'Cómo vencer la procrastinación digital y concentrarte en el trabajo profundo', titleEn: 'How to beat digital procrastination and focus on deep work', tool: 'word-counter' },
  { cat: 'productividad', titleEs: 'La Matriz de Eisenhower: cómo priorizar tareas urgentes vs. importantes', titleEn: 'The Eisenhower Matrix: prioritizing urgent vs. important tasks', tool: 'date-difference' },
  { cat: 'productividad', titleEs: 'Metodología GTD (Getting Things Done): guía práctica para el ordenador', titleEn: 'GTD (Getting Things Done) methodology: practical PC guide', tool: 'word-counter' },
  { cat: 'productividad', titleEs: 'El sistema de 3 carpetas para tener un escritorio de ordenador limpio y ordenado', titleEn: 'The 3-folder system to keep a clean and productive PC desktop', tool: 'compress-pdf' },
  { cat: 'productividad', titleEs: 'Estrategia 3-2-1 para hacer copias de seguridad de tus documentos esenciales', titleEn: 'The 3-2-1 backup strategy for protecting your essential files', tool: 'password-generator' },
  { cat: 'productividad', titleEs: 'Ergonomía frente a la pantalla: postura, descansos y configuración visual', titleEn: 'Screen ergonomics: posture, break schedules, and visual setup', tool: 'unit-converter' },
  { cat: 'productividad', titleEs: 'Cómo gestionar cientos de pestañas abiertas en el navegador sin ralentizar la PC', titleEn: 'How to manage hundreds of browser tabs without slowing your PC', tool: 'url-encoder' },
  { cat: 'productividad', titleEs: 'Identificación y automatización de tareas digitales repetitivas', titleEn: 'Identifying and automating repetitive digital tasks', tool: 'json-formatter' },
  { cat: 'productividad', titleEs: 'Técnicas de lectura rápida y escaneo visual de documentos largos', titleEn: 'Speed reading and visual scanning techniques for long documents', tool: 'word-counter' },
  { cat: 'productividad', titleEs: 'Desconexión digital el fin de semana: recupera tu energía mental', titleEn: 'Weekend digital detox: recharge your mental energy', tool: 'date-difference' },

  // OCR Y DIGITALIZACIÓN (8 guides)
  { cat: 'ocr', titleEs: 'Qué es la tecnología OCR y cómo extraer texto de imágenes escaneadas', titleEn: 'What is OCR technology and how to extract text from scans', tool: 'pdf-to-word' },
  { cat: 'ocr', titleEs: 'Flujo de trabajo para digitalizar facturas y tickets deducibles de impuestos', titleEn: 'Workflow to digitize tax receipts and deductible invoices', tool: 'jpg-to-pdf' },
  { cat: 'ocr', titleEs: 'Cómo mejorar la legibilidad de un documento escaneado borroso antes de extraer texto', titleEn: 'How to enhance the readability of blurry scanned documents', tool: 'compress-image' },
  { cat: 'ocr', titleEs: 'Resolución recomendada (DPI) y contraste para escanear documentos oficiales', titleEn: 'Recommended resolution (DPI) and contrast for scanning paperwork', tool: 'resize-image' },
  { cat: 'ocr', titleEs: 'Cómo digitalizar páginas de libros antiguos sin dañar su encuadernación', titleEn: 'How to digitize antique book pages without damaging bindings', tool: 'jpg-to-pdf' },
  { cat: 'ocr', titleEs: 'Cómo procesar documentos bilingües con caracteres especiales y acentos', titleEn: 'How to process bilingual documents with special characters', tool: 'text-diff' },
  { cat: 'ocr', titleEs: 'Cómo crear un archivo PDF con capa de texto buscable (Searchable PDF)', titleEn: 'How to create a searchable PDF with selectable text layers', tool: 'pdf-to-word' },
  { cat: 'ocr', titleEs: 'Oficina sin papel: plan paso a paso para digitalizar archivos físicos', titleEn: 'Paperless office: step-by-step roadmap to digitize paper archives', tool: 'merge-pdf' },

  // CONVERSIÓN DE ARCHIVOS (8 guides)
  { cat: 'conversion', titleEs: 'Diferencias entre formatos de imagen JPG, PNG, WebP y AVIF', titleEn: 'Differences between image formats JPG, PNG, WebP, and AVIF', tool: 'jpg-to-webp' },
  { cat: 'conversion', titleEs: 'Por qué convertir imágenes a WebP reduce el tiempo de carga de tu web un 70%', titleEn: 'Why converting images to WebP speeds up web page load by 70%', tool: 'png-to-webp' },
  { cat: 'conversion', titleEs: 'Cómo generar un favicon profesional en formato ICO y PNG para tu web', titleEn: 'How to generate a professional favicon in ICO and PNG format', tool: 'favicon-generator' },
  { cat: 'conversion', titleEs: 'Ventajas del procesamiento de archivos 100% en el navegador frente a la nube', titleEn: 'Advantages of 100% browser-based file processing vs. cloud servers', tool: 'compress-pdf' },
  { cat: 'conversion', titleEs: 'Resolución en DPI vs. tamaño en píxeles: guía definitiva para no equivocarte', titleEn: 'DPI resolution vs. pixel dimensions: complete practical guide', tool: 'resize-image' },
  { cat: 'conversion', titleEs: 'Compresión con pérdida (lossy) vs. sin pérdida (lossless) explicada', titleEn: 'Lossy vs. lossless compression explained clearly', tool: 'compress-image' },
  { cat: 'conversion', titleEs: 'Cómo convertir imágenes de smartphones HEIC o JPG a PDF en un solo clic', titleEn: 'How to convert smartphone HEIC or JPG photos to PDF in one click', tool: 'jpg-to-pdf' },
  { cat: 'conversion', titleEs: 'Formatos vectoriales SVG vs. raster: cuándo conviene usar cada uno', titleEn: 'Vector SVG vs. raster formats: when to use each in design', tool: 'favicon-generator' },

  // SEGURIDAD Y PRIVACIDAD (8 guides)
  { cat: 'seguridad', titleEs: 'Los peligros de subir documentos confidenciales a sitios web gratuitos', titleEn: 'The hidden risks of uploading confidential files to free websites', tool: 'compress-pdf' },
  { cat: 'seguridad', titleEs: 'Cómo crear contraseñas maestras fuertes, seguras e imposibles de adivinar', titleEn: 'How to create strong, secure, and unguessable master passwords', tool: 'password-generator' },
  { cat: 'seguridad', titleEs: 'Cómo ocultar y tachar información confidencial en un documento PDF', titleEn: 'How to redact and hide sensitive personal data in a PDF', tool: 'pdf-to-word' },
  { cat: 'seguridad', titleEs: 'Qué son los metadatos de un archivo y qué información privada revelan', titleEn: 'What file metadata reveals about you and how to remove it', tool: 'compress-image' },
  { cat: 'seguridad', titleEs: 'Cómo detectar correos de phishing con archivos adjuntos fraudulentos', titleEn: 'How to identify phishing emails with malicious file attachments', tool: 'url-encoder' },
  { cat: 'seguridad', titleEs: 'Guía de autenticación de dos factores (2FA) para proteger tus cuentas', titleEn: 'Two-factor authentication (2FA) guide to secure your accounts', tool: 'password-generator' },
  { cat: 'seguridad', titleEs: 'Ajustes de privacidad y extensiones esenciales para tu navegador web', titleEn: 'Essential privacy settings and extensions for your web browser', tool: 'url-encoder' },
  { cat: 'seguridad', titleEs: 'Cómo destruir y eliminar archivos digitales de forma permanente y segura', titleEn: 'How to securely and permanently shred digital documents', tool: 'password-generator' },

  // ORGANIZACIÓN DE DOCUMENTOS (8 guides)
  { cat: 'organizacion', titleEs: 'Convención de nomenclatura profesional para encontrar archivos en segundos', titleEn: 'Professional file naming convention to find documents in seconds', tool: 'word-counter' },
  { cat: 'organizacion', titleEs: 'Estructura de carpetas recomendada para estudiantes universitarios', titleEn: 'Recommended folder hierarchy for university students', tool: 'pdf-to-word' },
  { cat: 'organizacion', titleEs: 'Cómo organizar facturas y documentos tributarios para el cierre contable', titleEn: 'How to organize tax receipts and invoices for fiscal audits', tool: 'merge-pdf' },
  { cat: 'organizacion', titleEs: 'Estrategia para encontrar y eliminar fotos y documentos duplicados en tu PC', titleEn: 'Strategy to find and delete duplicate photos and documents on PC', tool: 'compress-image' },
  { cat: 'organizacion', titleEs: 'Cómo gestionar versiones de documentos (V1, V2, Final) sin equivocarte', titleEn: 'How to manage document versions without chaos', tool: 'text-diff' },
  { cat: 'organizacion', titleEs: 'Cómo organizar una biblioteca digital de papers y artículos científicos', titleEn: 'How to organize a digital library of academic research papers', tool: 'citation-generator' },
  { cat: 'organizacion', titleEs: 'Limpieza digital de fin de año: cómo liberar espacio y ordenar tu disco', titleEn: 'Year-end digital declutter: free disk space and clean your storage', tool: 'compress-pdf' },
  { cat: 'organizacion', titleEs: 'Buenas prácticas para compartir carpetas y documentos en equipo de forma segura', titleEn: 'Best practices for securely sharing team folders and files', tool: 'qr-wifi' },
  // Additional specialized guides
  { cat: 'pdf', titleEs: 'Cómo proteger un documento PDF confidencial con contraseña criptográfica', titleEn: 'How to encrypt and protect a sensitive PDF with password', tool: 'compress-pdf' },
  { cat: 'pdf', titleEs: 'Cómo desbloquear y remover contraseñas de un PDF de tu propiedad', titleEn: 'How to unlock and remove passwords from your own PDF', tool: 'compress-pdf' },
  { cat: 'pdf', titleEs: 'Cómo rotar y enderezar páginas de un PDF escaneado al revés', titleEn: 'How to rotate and straighten upside-down scanned PDF pages', tool: 'split-pdf' },
  { cat: 'pdf', titleEs: 'Cómo firmar digitalmente un documento PDF sin imprimir en papel', titleEn: 'How to digitally sign a PDF document without printing', tool: 'pdf-to-word' },
  { cat: 'word', titleEs: 'Cómo insertar bibliografía y notas al pie automáticas en Microsoft Word', titleEn: 'How to insert automatic bibliographies and footnotes in Microsoft Word', tool: 'citation-generator' },
  { cat: 'word', titleEs: 'Cómo crear plantillas corporativas con membrete y estilos en Word', titleEn: 'How to create corporate letterhead templates in Microsoft Word', tool: 'pdf-to-word' },
  { cat: 'citas', titleEs: 'Cómo citar entrevistas personales, conferencias y comunicaciones orales', titleEn: 'How to cite personal interviews, speeches, and verbal communication', tool: 'citation-generator' },
  { cat: 'citas', titleEs: 'Cómo citar publicaciones de Wikipedia y enciclopedias digitales', titleEn: 'How to cite Wikipedia entries and digital encyclopedias properly', tool: 'citation-generator' },
  { cat: 'estudiantes', titleEs: 'Cómo redactar un resumen ejecutivo o abstract académico bilingüe', titleEn: 'How to write a bilingual academic abstract and executive summary', tool: 'word-counter' },
  { cat: 'estudiantes', titleEs: 'Guía para estructurar la dedicatoria y agradecimientos de una tesis', titleEn: 'Guide to structuring acknowledgements and dedications in thesis', tool: 'word-counter' },
  { cat: 'productividad', titleEs: 'Cómo crear códigos QR para conectar invitados a tu red Wi-Fi en 1 segundo', titleEn: 'How to create QR codes to connect guests to Wi-Fi instantly', tool: 'qr-wifi' },
  { cat: 'conversion', titleEs: 'Cómo convertir archivos Base64 a texto y viceversa sin errores', titleEn: 'How to encode and decode Base64 data safely in browser', tool: 'base64-converter' },
  { cat: 'seguridad', titleEs: 'Cómo verificar si tus correos o contraseñas han sido filtrados en internet', titleEn: 'How to check if your email or passwords were leaked online', tool: 'password-generator' }
];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const allGuides = [...GUIDES_RAW];

CATEGORY_EXPANSIONS.forEach((item, index) => {
  const slug = slugify(item.titleEs);
  allGuides.push({
    id: slug,
    slug: slug,
    category: item.cat,
    readTime: `${3 + (index % 4)} min`,
    relatedToolId: item.tool,
    title: {
      es: item.titleEs,
      en: item.titleEn
    },
    summary: {
      es: `Guía práctica y detallada con pasos claros para ${item.titleEs.toLowerCase()} de forma rápida y eficiente.`,
      en: `Step-by-step practical guide with actionable advice to ${item.titleEn.toLowerCase()} quickly and efficiently.`
    },
    seoTitle: {
      es: `${item.titleEs} | Toolbox Word`,
      en: `${item.titleEn} | Toolbox Word`
    },
    metaDescription: {
      es: `Tutorial completo: aprende ${item.titleEs.toLowerCase()} con buenas prácticas, ejemplos y herramientas gratuitas.`,
      en: `Comprehensive tutorial: learn ${item.titleEn.toLowerCase()} with best practices, examples, and free tools.`
    },
    steps: [
      { title: 'Paso 1: Preparación inicial', desc: 'Revisa los requisitos y reúne los archivos o datos necesarios antes de comenzar.' },
      { title: 'Paso 2: Aplicación del método', desc: 'Ejecuta el procedimiento paso a paso asegurando orden y consistencia en los datos.' },
      { title: 'Paso 3: Verificación y guardado', desc: 'Comprueba el resultado final y almacena copias de respaldo en tu equipo.' }
    ],
    content: {
      es: `## Introducción a esta guía
${item.titleEs} es una de las tareas más frecuentes e importantes para estudiantes, profesionales e investigadores que buscan optimizar su tiempo y garantizar resultados impecables.

### Pasos esenciales recomendados
1. **Planificación y orden**: Comienza organizando tus materiales de origen.
2. **Uso de herramientas adecuadas**: Apóyate en utilidades digitales seguras como las de Toolbox Word para procesar archivos localmente.
3. **Revisión minuciosa**: Siempre efectúa una lectura de control antes de compartir o presentar el resultado final.

### Beneficios clave
- **Mayor rapidez**: Ahorra horas de trabajo repetitivo aplicando técnicas estandarizadas.
- **Privacidad asegurada**: Al utilizar las herramientas de Toolbox Word, ningún archivo sale de tu dispositivo.
- **Calidad profesional**: Cumple con las exigencias académicas y corporativas más estrictas.`,
      en: `## Introduction
${item.titleEn} is an essential task for students, researchers, and professionals striving for efficiency and high standards.

### Recommended action steps
1. **Preparation**: Organize input sources and documents systematically.
2. **Leverage secure digital tools**: Use browser-native utilities from Toolbox Word to keep data private.
3. **Final verification**: Review your final output before submitting or sharing.`
    }
  });
});

console.log('Total guides generated:', allGuides.length);

const fileContent = `import { GuideArticle } from '../types';

export const GUIDES: GuideArticle[] = ${JSON.stringify(allGuides, null, 2)};

export const GUIDE_CATEGORIES = [
  { id: 'all', name: { es: 'Todas las guías', en: 'All Guides' } },
  { id: 'pdf', name: { es: 'PDF', en: 'PDF' } },
  { id: 'word', name: { es: 'Word', en: 'Word' } },
  { id: 'citas', name: { es: 'Citas y Referencias', en: 'Citations & References' } },
  { id: 'apa', name: { es: 'Normas APA', en: 'APA Style' } },
  { id: 'mla', name: { es: 'Normas MLA', en: 'MLA Style' } },
  { id: 'chicago', name: { es: 'Estilo Chicago', en: 'Chicago Style' } },
  { id: 'harvard', name: { es: 'Estilo Harvard', en: 'Harvard Style' } },
  { id: 'investigacion', name: { es: 'Investigación Académica', en: 'Academic Research' } },
  { id: 'estudiantes', name: { es: 'Estudiantes y Tesis', en: 'Students & Theses' } },
  { id: 'productividad', name: { es: 'Productividad', en: 'Productivity' } },
  { id: 'ocr', name: { es: 'OCR y Digitalización', en: 'OCR & Scanning' } },
  { id: 'conversion', name: { es: 'Conversión de Archivos', en: 'File Conversion' } },
  { id: 'seguridad', name: { es: 'Seguridad y Privacidad', en: 'Security & Privacy' } },
  { id: 'organizacion', name: { es: 'Organización de Documentos', en: 'File Organization' } }
];
`;

fs.writeFileSync(path.join(__dirname, '../src/data/guides.ts'), fileContent, 'utf-8');
console.log('Successfully wrote src/data/guides.ts with', allGuides.length, 'guides!');
