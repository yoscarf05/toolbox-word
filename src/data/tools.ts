import { ToolDefinition } from '../types';

export const TOOLS: ToolDefinition[] = [
  // 1. PDF a Word (Top Priority Tool)
  {
    id: 'pdf-to-word',
    slug: 'pdf-to-word',
    categoryId: 'pdf',
    name: {
      es: 'PDF a Word',
      en: 'PDF to Word',
      pt: 'PDF para Word',
      fr: 'PDF en Word',
      de: 'PDF in Word',
      it: 'PDF in Word'
    },
    shortDescription: {
      es: 'Convierte archivos PDF a documentos Word (.docx) 100% editables conservando estructura.',
      en: 'Convert PDF files into 100% editable Word (.docx) documents preserving layout.',
      pt: 'Converta arquivos PDF em documentos Word (.docx) editáveis preservando a estrutura.',
      fr: 'Convertissez des fichiers PDF en documents Word (.docx) éditables en préservant la structure.',
      de: 'PDF-Dateien in 100% bearbeitbare Word-Dokumente (.docx) konvertieren.',
      it: 'Converti file PDF in documenti Word (.docx) modificabili preservando la struttura.'
    },
    fullDescription: {
      es: 'Transforma cualquier archivo PDF en un documento Microsoft Word (.docx) completamente editable. Extrae texto, párrafos y estructura de forma nativa directamente en tu navegador web, sin subir archivos a servidores externos ni poner en riesgo tu privacidad.',
      en: 'Transform any PDF file into a fully editable Microsoft Word (.docx) document. Native browser processing ensures total privacy with no file uploads to external servers.'
    },
    icon: 'FileType',
    badge: 'TOP #1',
    isPopular: true,
    processLocally: true,
    keywords: ['pdf', 'word', 'docx', 'convertir', 'editable', 'documento', 'office', 'microsoft word'],
    steps: [
      {
        step: 1,
        title: { es: 'Carga tu archivo PDF', en: 'Upload your PDF file' },
        desc: { es: 'Arrastra tu PDF o selecciónalo desde tu dispositivo sin límite de páginas.', en: 'Drag your PDF or select it from your device with no page limit.' }
      },
      {
        step: 2,
        title: { es: 'Configura estilo y opciones', en: 'Configure style & options' },
        desc: { es: 'Elige la tipografía (Calibri, Arial, Times New Roman) y opciones de interlineado.', en: 'Choose typography (Calibri, Arial, Times New Roman) and spacing options.' }
      },
      {
        step: 3,
        title: { es: 'Descarga tu documento .docx', en: 'Download your .docx document' },
        desc: { es: 'Obtén tu documento Word nativo listo para abrir en Word, Google Docs o LibreOffice.', en: 'Get your native Word document ready for Word, Google Docs, or LibreOffice.' }
      }
    ],
    faqs: [
      {
        question: { es: '¿El documento Word generado es compatible con todas las versiones de Office?', en: 'Is the Word document compatible with all Office versions?' },
        answer: { es: 'Sí, el archivo se genera en el estándar internacional DOCX, compatible con Microsoft Word 2010-2024, Microsoft 365, Google Docs y LibreOffice Writer.', en: 'Yes, it uses the international DOCX standard compatible with Microsoft Word, Office 365, Google Docs, and LibreOffice.' }
      },
      {
        question: { es: '¿Mis archivos PDF se suben a la nube o son guardados?', en: 'Are my PDF files uploaded or stored on servers?' },
        answer: { es: 'No. En Toolbox Word toda la conversión se realiza dentro del motor JavaScript de tu navegador. Ningún dato ni documento sale jamás de tu dispositivo.', en: 'No. Everything is processed directly inside your web browser. No files are ever sent to remote servers.' }
      }
    ]
  },

  // 1b. Word a PDF
  {
    id: 'word-to-pdf',
    slug: 'word-to-pdf',
    categoryId: 'pdf',
    name: {
      es: 'Word a PDF',
      en: 'Word to PDF',
      pt: 'Word para PDF',
      fr: 'Word en PDF',
      de: 'Word in PDF',
      it: 'Word in PDF'
    },
    shortDescription: {
      es: 'Convierte documentos Word (.docx) a archivos PDF estándar de alta calidad vectorial.',
      en: 'Convert Word (.docx) documents to standard high-quality vector PDF files.',
      pt: 'Converta documentos Word (.docx) em arquivos PDF vetoriais de alta qualidade.',
      fr: 'Convertissez des documents Word (.docx) en fichiers PDF vectoriels de haute qualité.',
      de: 'Word-Dokumente (.docx) in hochwertige vektorielle PDF-Dateien konvertieren.',
      it: 'Converti documenti Word (.docx) in file PDF vettoriali di alta qualità.'
    },
    fullDescription: {
      es: 'Convierte tus documentos de Microsoft Word (.docx) en archivos PDF legítimos con renderizado vectorial nativo, respetando encabezados, títulos, tablas, listas y márgenes. Procesamiento 100% privado en tu navegador.',
      en: 'Convert Microsoft Word (.docx) documents into legitimate PDF files with native vector rendering, respecting headings, tables, lists, and margins. 100% private in-browser processing.'
    },
    icon: 'FileText',
    badge: 'NUEVO',
    isPopular: true,
    processLocally: true,
    keywords: ['word', 'docx', 'pdf', 'convertir', 'word a pdf', 'imprimir', 'documento', 'office'],
    steps: [
      {
        step: 1,
        title: { es: 'Carga tu archivo Word (.docx)', en: 'Upload your Word document (.docx)' },
        desc: { es: 'Arrastra tu archivo DOCX o búscalo en tu ordenador.', en: 'Drag your DOCX file or browse it from your computer.' }
      },
      {
        step: 2,
        title: { es: 'Ajusta tamaño y márgenes', en: 'Adjust size & margins' },
        desc: { es: 'Elige tamaño A4 o Carta y el espaciado de márgenes deseado.', en: 'Choose A4 or Letter size and desired margin spacing.' }
      },
      {
        step: 3,
        title: { es: 'Descarga tu documento PDF', en: 'Download your PDF' },
        desc: { es: 'Obtén tu PDF vectorial listo para compartir, firmar o imprimir.', en: 'Get your vector PDF ready for sharing, signing, or printing.' }
      }
    ],
    faqs: [
      {
        question: { es: '¿El PDF generado es compatible con lectores oficiales de PDF?', en: 'Is the generated PDF compatible with standard readers?' },
        answer: { es: 'Sí, el archivo cumple con las especificaciones ISO de PDF y se abre perfectamente en Adobe Acrobat Reader, Google Chrome, Edge, Safari y teléfonos móviles.', en: 'Yes, it complies with PDF ISO standards and opens in Adobe Acrobat Reader, browsers, and mobile devices.' }
      },
      {
        question: { es: '¿Se requiere tener Microsoft Word instalado?', en: 'Is Microsoft Word required?' },
        answer: { es: 'No. El procesamiento de OpenXML se efectúa de forma independiente en tu navegador sin requerir licencias de Office ni software externo.', en: 'No. The OpenXML engine processes the file independently in your browser without needing Office.' }
      }
    ]
  },

  // 2. Generador de Citas y Referencias (Top Priority Tool)
  {
    id: 'citation-generator',
    slug: 'citation-generator',
    categoryId: 'students',
    name: {
      es: 'Generador de Citas y Referencias',
      en: 'Citation & Reference Generator',
      pt: 'Gerador de Citações e Referências',
      fr: 'Générateur de Citations et Références',
      de: 'Zitier- und Quellenangaben-Generator',
      it: 'Generatore di Citazioni e Riferimenti'
    },
    shortDescription: {
      es: 'Genera citas bibliográficas en APA 7, MLA 9, Chicago, Harvard, Vancouver e IEEE al instante.',
      en: 'Generate bibliographic citations in APA 7, MLA 9, Chicago, Harvard, Vancouver & IEEE.',
      pt: 'Gere citações bibliográficas em APA 7, MLA 9, Chicago, Harvard, Vancouver e IEEE.',
      fr: 'Générez des citations bibliographiques en APA 7, MLA 9, Chicago, Harvard, Vancouver et IEEE.',
      de: 'Erstellen Sie Zitate in APA 7, MLA 9, Chicago, Harvard, Vancouver und IEEE sofort.',
      it: 'Genera citazioni bibliografiche in APA 7, MLA 9, Chicago, Harvard, Vancouver e IEEE.'
    },
    fullDescription: {
      es: 'Crea citas dentro del texto y referencias bibliográficas completas para libros, artículos científicos, páginas web, tesis, periódicos y videos. Cumple con los estándares internacionales más rigurosos para tesis, trabajos universitarios e investigaciones académicas.',
      en: 'Create accurate in-text citations and full reference lists for books, journal articles, websites, theses, and reports in APA 7, MLA 9, Chicago, Harvard, Vancouver, and IEEE.'
    },
    icon: 'BookOpen',
    badge: 'DESTACADO',
    isPopular: true,
    processLocally: true,
    keywords: ['citas', 'referencias', 'apa', 'apa 7', 'mla', 'mla 9', 'chicago', 'harvard', 'vancouver', 'ieee', 'tesis', 'bibliografia', 'universidad'],
    steps: [
      {
        step: 1,
        title: { es: 'Elige el estilo y tipo de fuente', en: 'Choose style & source type' },
        desc: { es: 'Selecciona entre APA 7, MLA 9, Chicago, Harvard, Vancouver o IEEE, y el tipo de material.', en: 'Select APA 7, MLA 9, Chicago, Harvard, Vancouver, or IEEE, and material type.' }
      },
      {
        step: 2,
        title: { es: 'Ingresa los datos del documento', en: 'Enter metadata' },
        desc: { es: 'Completa autores, año, título, editorial o enlace DOI con validación asistida.', en: 'Fill in authors, year, title, publisher, or DOI with validation.' }
      },
      {
        step: 3,
        title: { es: 'Copia o exporta tu bibliografía', en: 'Copy or export bibliography' },
        desc: { es: 'Copia la cita dentro del texto o la referencia completa, o acumula varias fuentes y descárgalas en .txt.', en: 'Copy in-text or full citation, or build and export a complete bibliography.' }
      }
    ],
    faqs: [
      {
        question: { es: '¿Cuál es la diferencia entre la cita en texto y la referencia bibliográfica?', en: 'What is the difference between an in-text citation and a reference?' },
        answer: { es: 'La cita dentro del texto identifica brevemente la fuente en el cuerpo de tu redacción (ej. (García Márquez, 1967)), mientras que la referencia bibliográfica proporciona los datos completos al final del documento para que el lector pueda localizarla.', en: 'The in-text citation briefly identifies the source in your paragraph (e.g. (Smith, 2023)), while the full reference provides complete publisher details in your bibliography.' }
      },
      {
        question: { es: '¿Qué formato debo usar para mi tesis o trabajo de grado?', en: 'Which style should I use for my thesis?' },
        answer: { es: 'Para psicología, educación y ciencias sociales suele requerirse APA 7. Para medicina y salud, Vancouver. Para humanidades, literatura y arte, MLA 9. Para ingeniería y tecnología, IEEE.', en: 'APA 7 is common for social sciences & education. Vancouver for medicine. MLA 9 for humanities. IEEE for engineering.' }
      }
    ]
  },

  // 3. Comprimir PDF
  {
    id: 'compress-pdf',
    slug: 'compress-pdf',
    categoryId: 'pdf',
    name: {
      es: 'Comprimir PDF',
      en: 'Compress PDF',
      pt: 'Comprimir PDF',
      fr: 'Compresser PDF',
      de: 'PDF komprimieren',
      it: 'Comprimi PDF'
    },
    shortDescription: {
      es: 'Reduce el tamaño de tu archivo PDF manteniendo una excelente legibilidad.',
      en: 'Reduce the file size of your PDF while retaining optimal readability.',
      pt: 'Reduza o tamanho do seu PDF mantendo excelente legibilidade.',
      fr: 'Réduisez la taille de votre PDF tout en préservant une bonne qualité.',
      de: 'Reduzieren Sie die PDF-Dateigröße bei optimaler Lesbarkeit.',
      it: 'Riduci le dimensioni del tuo PDF mantenendo un’ottima leggibilità.'
    },
    fullDescription: {
      es: 'Optimiza documentos PDF para enviarlos rápidamente por correo electrónico, WhatsApp o plataformas web. Puedes seleccionar el nivel de compresión que mejor se adapte a tus necesidades.',
      en: 'Optimize PDF documents for fast sharing via email, messaging apps, or online portals. Select the compression level that best suits your requirements.'
    },
    icon: 'FileDown',
    isPopular: true,
    processLocally: true,
    keywords: ['pdf', 'comprimir', 'reducir', 'tamaño', 'peso', 'shrink', 'compress', 'documento', 'email'],
    steps: [
      {
        step: 1,
        title: { es: 'Selecciona tu archivo', en: 'Select your file' },
        desc: { es: 'Arrastra tu PDF o pulsa el botón para elegirlo desde tu dispositivo.', en: 'Drag and drop your PDF or click the button to browse from your device.' }
      },
      {
        step: 2,
        title: { es: 'Elige el nivel de compresión', en: 'Choose compression level' },
        desc: { es: 'Selecciona entre compresión recomendada, básica o máxima según tu necesidad.', en: 'Choose between recommended, light, or high compression based on your preference.' }
      },
      {
        step: 3,
        title: { es: 'Pulsa en Comprimir', en: 'Click Compress' },
        desc: { es: 'El navegador optimizará la estructura de datos y metadatos de forma instantánea.', en: 'The browser will optimize data structures and metadata instantly.' }
      },
      {
        step: 4,
        title: { es: 'Descarga tu documento', en: 'Download your document' },
        desc: { es: 'Revisa el porcentaje de ahorro obtenido y guarda el nuevo archivo comprimido.', en: 'Review the saved percentage and download the newly compressed PDF.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿La compresión afecta la calidad del texto?',
          en: 'Does compression affect text quality?'
        },
        answer: {
          es: 'No. El texto vectorial y las fuentes tipográficas se mantienen 100% nítidos independientemente del nivel de compresión.',
          en: 'No. Vector text and font glyphs remain crisp and readable regardless of the compression level applied.'
        }
      },
      {
        question: {
          es: '¿Mis documentos privados se envían a algún servidor?',
          en: 'Are my private documents sent to any server?'
        },
        answer: {
          es: 'Absolutamente no. Toda la optimización se realiza dentro de la memoria de tu propio navegador web, garantizando privacidad total.',
          en: 'Absolutely not. All processing occurs locally within your browser memory, guaranteeing total privacy.'
        }
      }
    ],
    relatedToolIds: ['merge-pdf', 'pdf-to-jpg', 'jpg-to-pdf'],
    exampleUse: {
      es: 'Reducir un PDF de 8 MB a menos de 2 MB para poder adjuntarlo en un correo con límite de peso.',
      en: 'Shrinking an 8 MB PDF to under 2 MB to attach it to an email with strict attachment limits.'
    }
  },

  // 2. Unir PDF
  {
    id: 'merge-pdf',
    slug: 'merge-pdf',
    categoryId: 'pdf',
    name: {
      es: 'Unir PDF',
      en: 'Merge PDF',
      pt: 'Juntar PDF',
      fr: 'Fusionner PDF',
      de: 'PDF zusammenfügen',
      it: 'Unisci PDF'
    },
    shortDescription: {
      es: 'Combina varios documentos PDF en un único archivo ordenado.',
      en: 'Combine multiple PDF documents into a single, organized file.',
      pt: 'Combine vários PDFs em um único documento ordenado.',
      fr: 'Combinez plusieurs fichiers PDF en un seul document organisé.',
      de: 'Kombinieren Sie mehrere PDF-Dateien in einem geordneten Dokument.',
      it: 'Unisci più documenti PDF in un unico file organizzato.'
    },
    fullDescription: {
      es: 'Junta facturas, contratos, trabajos académicos o capítulos en un solo archivo PDF continuo. Puedes reordenar los archivos antes de generar el resultado.',
      en: 'Merge invoices, contracts, academic papers, or chapters into one seamless PDF. Reorder documents before creating the final file.'
    },
    icon: 'Layers',
    isPopular: true,
    processLocally: true,
    keywords: ['pdf', 'unir', 'juntar', 'combinar', 'merge', 'combine', 'fusionar', 'documentos'],
    steps: [
      {
        step: 1,
        title: { es: 'Carga dos o más archivos PDF', en: 'Upload two or more PDFs' },
        desc: { es: 'Selecciona todos los documentos PDF que deseas unificar.', en: 'Select all the PDF documents you wish to bring together.' }
      },
      {
        step: 2,
        title: { es: 'Organiza el orden de las páginas', en: 'Arrange file sequence' },
        desc: { es: 'Mueve los documentos arriba o abajo para establecer la secuencia deseada.', en: 'Move files up or down to arrange them in the exact order you need.' }
      },
      {
        step: 3,
        title: { es: 'Pulsa en Unir PDF', en: 'Click Merge PDF' },
        desc: { es: 'El motor local de PDF procesará la unión en milisegundos.', en: 'The client-side PDF engine will merge all pages in milliseconds.' }
      },
      {
        step: 4,
        title: { es: 'Guarda tu PDF combinado', en: 'Save combined PDF' },
        desc: { es: 'Descarga el nuevo documento consolidado listo para compartir.', en: 'Download the newly consolidated document ready to share.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Hay un límite en el número de archivos que puedo unir?',
          en: 'Is there a limit on how many files I can merge?'
        },
        answer: {
          es: 'Puedes unir tantos archivos como la memoria de tu dispositivo lo permita. Generalmente decenas de archivos sin inconvenientes.',
          en: 'You can merge as many files as your device memory allows, easily handling dozens of files smoothly.'
        }
      }
    ],
    relatedToolIds: ['compress-pdf', 'jpg-to-pdf'],
    exampleUse: {
      es: 'Unir una portada, el cuerpo de un informe y los anexos en una sola entrega formal.',
      en: 'Merging a cover page, report body, and appendixes into a single formal submission.'
    }
  },

  // 3. JPG a PDF
  {
    id: 'jpg-to-pdf',
    slug: 'jpg-to-pdf',
    categoryId: 'pdf',
    name: {
      es: 'JPG a PDF',
      en: 'JPG to PDF',
      pt: 'JPG para PDF',
      fr: 'JPG en PDF',
      de: 'JPG in PDF',
      it: 'JPG in PDF'
    },
    shortDescription: {
      es: 'Convierte fotos e imágenes JPG en un documento PDF listo para imprimir o enviar.',
      en: 'Convert JPG photos and images into a print-ready or shareable PDF.',
      pt: 'Converta imagens JPG em um documento PDF pronto para compartilhar.',
      fr: 'Convertissez des photos JPG en un document PDF prêt à être partagé.',
      de: 'Wandeln Sie JPG-Bilder in ein druckfertiges PDF-Dokument um.',
      it: 'Converti foto JPG in un documento PDF pronto per la condivisione.'
    },
    fullDescription: {
      es: 'Transforma una o varias imágenes JPG en un PDF profesional. Ajusta la orientación (vertical u horizontal) y márgenes de página fácilmente.',
      en: 'Transform one or several JPG photos into a clean PDF. Set orientation and margins to create polished presentations or archives.'
    },
    icon: 'FilePlus2',
    isPopular: true,
    processLocally: true,
    keywords: ['jpg', 'jpeg', 'pdf', 'convertir', 'fotos a pdf', 'imagen a pdf', 'escaner'],
    steps: [
      {
        step: 1,
        title: { es: 'Sube tus imágenes JPG', en: 'Upload JPG photos' },
        desc: { es: 'Arrastra o selecciona las fotos que deseas convertir en documento.', en: 'Drag or select photos you want to transform into a document.' }
      },
      {
        step: 2,
        title: { es: 'Elige orientación y márgenes', en: 'Choose orientation & margins' },
        desc: { es: 'Configura si deseas orientación vertical u horizontal y el espacio de margen.', en: 'Set portrait or landscape orientation along with page margins.' }
      },
      {
        step: 3,
        title: { es: 'Generar PDF', en: 'Generate PDF' },
        desc: { es: 'Pulsa el botón para compilar las imágenes en páginas de alta calidad.', en: 'Click the button to compile the images into high quality pages.' }
      },
      {
        step: 4,
        title: { es: 'Descarga tu archivo', en: 'Download your file' },
        desc: { es: 'Obtén tu documento PDF limpio al instante.', en: 'Get your clean PDF document instantly.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Conserva la resolución de mis fotografías?',
          en: 'Does it retain my photo resolution?'
        },
        answer: {
          es: 'Sí, las imágenes se insertan preservando su nitidez y fidelidad de color.',
          en: 'Yes, images are embedded preserving their sharpness and color fidelity.'
        }
      }
    ],
    relatedToolIds: ['image-to-pdf', 'pdf-to-jpg', 'compress-pdf']
  },

  // 4. PDF a JPG
  {
    id: 'pdf-to-jpg',
    slug: 'pdf-to-jpg',
    categoryId: 'pdf',
    name: {
      es: 'PDF a JPG',
      en: 'PDF to JPG',
      pt: 'PDF para JPG',
      fr: 'PDF en JPG',
      de: 'PDF in JPG',
      it: 'PDF in JPG'
    },
    shortDescription: {
      es: 'Extrae y convierte cada página de tu documento PDF en una imagen JPG de alta definición.',
      en: 'Extract and convert every page of your PDF into high-definition JPG images.',
      pt: 'Converta páginas de documentos PDF em imagens JPG de alta resolução.',
      fr: 'Convertissez les pages d’un PDF en images JPG haute définition.',
      de: 'Konvertieren Sie PDF-Seiten in hochauflösende JPG-Bilder.',
      it: 'Converti ogni pagina PDF in un’immagine JPG ad alta risoluzione.'
    },
    fullDescription: {
      es: 'Convierte tus páginas PDF a JPG directamente en el navegador sin subir documentos privados a servidores externos. Descarga páginas individuales o todas juntas.',
      en: 'Convert PDF pages to JPG directly in your browser without uploading private documents to external servers. Download individual pages or all at once.'
    },
    icon: 'FileImage',
    isPopular: true,
    processLocally: true,
    keywords: ['pdf', 'jpg', 'convertir', 'extraer', 'imagenes', 'foto', 'captura'],
    steps: [
      {
        step: 1,
        title: { es: 'Selecciona tu PDF', en: 'Select your PDF' },
        desc: { es: 'Carga el archivo PDF que deseas convertir a imagen.', en: 'Upload the PDF document you want to convert to images.' }
      },
      {
        step: 2,
        title: { es: 'Revisa las páginas', en: 'Preview pages' },
        desc: { es: 'El visor procesará las páginas en el lienzo de tu navegador.', en: 'The viewer renders pages directly on your browser canvas.' }
      },
      {
        step: 3,
        title: { es: 'Descarga en formato JPG', en: 'Download JPG' },
        desc: { es: 'Descarga la página deseada o un paquete con todas.', en: 'Download desired pages individually or in bulk.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Puedo convertir PDFs con varias páginas?',
          en: 'Can I convert multi-page PDFs?'
        },
        answer: {
          es: 'Sí, todas las páginas se renderizan y se ofrecen para descargar con alta nitidez.',
          en: 'Yes, all pages are rendered and available for sharp download.'
        }
      }
    ],
    relatedToolIds: ['jpg-to-pdf', 'compress-pdf']
  },

  // 5. Comprimir imágenes
  {
    id: 'compress-image',
    slug: 'compress-image',
    categoryId: 'images',
    name: {
      es: 'Comprimir imagen',
      en: 'Compress Image',
      pt: 'Comprimir imagem',
      fr: 'Compresser une image',
      de: 'Bild komprimieren',
      it: 'Comprimi immagine'
    },
    shortDescription: {
      es: 'Disminuye el peso de archivos JPG, PNG y WebP con control de calidad visual.',
      en: 'Reduce the file size of JPG, PNG, and WebP files with visual quality control.',
      pt: 'Reduza o peso de imagens JPG, PNG e WebP com controle de qualidade.',
      fr: 'Diminuez le poids de vos images JPG, PNG et WebP sans perte visible.',
      de: 'Reduzieren Sie die Dateigröße von JPG-, PNG- und WebP-Bildern.',
      it: 'Riduci il peso di JPG, PNG e WebP controllando la qualità finale.'
    },
    fullDescription: {
      es: 'Optimiza tus fotografías para sitios web, tiendas online y redes sociales. Comprueba el antes y el después con estimación exacta de kilobytes ahorrados.',
      en: 'Optimize photos for websites, e-commerce stores, and social feeds. Compare before and after with exact kilobyte savings calculations.'
    },
    icon: 'Minimize2',
    isPopular: true,
    processLocally: true,
    keywords: ['imagen', 'comprimir', 'foto', 'reducir', 'peso', 'jpg', 'png', 'webp', 'optimizacion'],
    steps: [
      {
        step: 1,
        title: { es: 'Carga tu imagen', en: 'Upload your image' },
        desc: { es: 'Arrastra cualquier archivo JPG, PNG o WebP.', en: 'Drag and drop any JPG, PNG, or WebP photo.' }
      },
      {
        step: 2,
        title: { es: 'Ajusta el nivel de calidad', en: 'Adjust quality slider' },
        desc: { es: 'Mueve el control deslizante para balancear tamaño y calidad visual.', en: 'Move the slider to find the sweet spot between file size and visual fidelity.' }
      },
      {
        step: 3,
        title: { es: 'Descarga la imagen optimizada', en: 'Download optimized image' },
        desc: { es: 'Guarda la imagen comprimida lista para tu página o red social.', en: 'Save the compressed image ready for your site or social profile.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Cuánto peso se puede ahorrar?',
          en: 'How much file size can be saved?'
        },
        answer: {
          es: 'Normalmente entre un 50% y un 85% de reducción sin pérdida apreciable a simple vista.',
          en: 'Typically between 50% and 85% reduction without noticeable loss to the human eye.'
        }
      }
    ],
    relatedToolIds: ['resize-image', 'jpg-to-webp', 'png-to-webp']
  },

  // 6. Redimensionar imagen
  {
    id: 'resize-image',
    slug: 'resize-image',
    categoryId: 'images',
    name: {
      es: 'Redimensionar imagen',
      en: 'Resize Image',
      pt: 'Redimensionar imagem',
      fr: 'Redimensionner une image',
      de: 'Bildgröße ändern',
      it: 'Ridimensiona immagine'
    },
    shortDescription: {
      es: 'Cambia ancho y alto en píxeles o porcentaje, con plantillas para redes sociales.',
      en: 'Change width and height in pixels or percentage, with social media presets.',
      pt: 'Altere largura e altura em pixels com modelos para redes sociais.',
      fr: 'Modifiez la largeur et hauteur en pixels avec préréglages réseaux sociaux.',
      de: 'Breite und Höhe in Pixeln oder Prozent mit Social-Media-Vorlagen anpassen.',
      it: 'Modifica larghezza e altezza in pixel con preset per social media.'
    },
    fullDescription: {
      es: 'Adapta tus fotos a medidas específicas (Instagram 1080x1080, Stories 1080x1920, YouTube Banner, Twitter/X) o define dimensiones personalizadas bloqueando la proporción.',
      en: 'Fit photos to exact dimensions (Instagram post 1080x1080, Story 1080x1920, YouTube banner) or set custom pixel dimensions with aspect ratio lock.'
    },
    icon: 'Maximize2',
    isPopular: true,
    processLocally: true,
    keywords: ['redimensionar', 'resize', 'dimensiones', 'pixeles', 'instagram', 'facebook', 'youtube', 'recortar'],
    steps: [
      {
        step: 1,
        title: { es: 'Carga tu foto', en: 'Upload photo' },
        desc: { es: 'Selecciona la imagen que deseas adaptar.', en: 'Select the image you want to resize.' }
      },
      {
        step: 2,
        title: { es: 'Elige un preset o píxeles', en: 'Choose preset or pixels' },
        desc: { es: 'Elige Instagram, YouTube o ingresa ancho y alto libre.', en: 'Select Instagram, YouTube, or type custom width and height.' }
      },
      {
        step: 3,
        title: { es: 'Descarga con nuevas medidas', en: 'Download resized image' },
        desc: { es: 'Obtén la imagen redimensionada de inmediato.', en: 'Get your resized photo instantly.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Se deforma la imagen si cambio el tamaño?',
          en: 'Will the image distort when resized?'
        },
        answer: {
          es: 'No, la opción de mantener proporción (aspect ratio lock) está activa por defecto.',
          en: 'No, the aspect ratio lock is enabled by default to prevent stretching.'
        }
      }
    ],
    relatedToolIds: ['compress-image', 'favicon-generator']
  },

  // 7. JPG a WebP
  {
    id: 'jpg-to-webp',
    slug: 'jpg-to-webp',
    categoryId: 'images',
    name: {
      es: 'JPG a WebP',
      en: 'JPG to WebP',
      pt: 'JPG para WebP',
      fr: 'JPG en WebP',
      de: 'JPG in WebP',
      it: 'JPG in WebP'
    },
    shortDescription: {
      es: 'Convierte imágenes JPG al formato moderno WebP para acelerar sitios web.',
      en: 'Convert JPG images to the modern WebP format for blazing-fast websites.',
      pt: 'Converta fotos JPG para WebP para carregar sites com rapidez.',
      fr: 'Convertissez des images JPG en WebP pour accélérer vos sites.',
      de: 'Konvertieren Sie JPG-Bilder in WebP für maximale Web-Geschwindigkeit.',
      it: 'Converti JPG in formato WebP per velocizzare il caricamento del tuo sito.'
    },
    fullDescription: {
      es: 'WebP es el estándar recomendado por Google para imágenes web. Ofrece un peso hasta 35% menor que JPG manteniendo la misma nitidez visual.',
      en: 'WebP is the modern image format recommended by Google. It delivers up to 35% smaller file sizes than JPG with identical visual quality.'
    },
    icon: 'Sparkles',
    isPopular: true,
    processLocally: true,
    keywords: ['jpg', 'webp', 'convertir', 'formato', 'google webp', 'web performance', 'seo imagenes'],
    steps: [
      {
        step: 1,
        title: { es: 'Carga tu archivo JPG', en: 'Upload JPG' },
        desc: { es: 'Selecciona una o varias imágenes de tu biblioteca.', en: 'Choose one or more JPG images from your library.' }
      },
      {
        step: 2,
        title: { es: 'Conversión automática', en: 'Automatic conversion' },
        desc: { es: 'El motor del navegador codifica el formato WebP en segundos.', en: 'The browser engine re-encodes into WebP within seconds.' }
      },
      {
        step: 3,
        title: { es: 'Descarga en WebP', en: 'Download WebP' },
        desc: { es: 'Guarda tu nuevo archivo ultra ligero.', en: 'Save your ultra-lightweight image file.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Todos los navegadores soportan WebP?',
          en: 'Do all browsers support WebP?'
        },
        answer: {
          es: 'Sí, Chrome, Safari, Firefox, Edge y navegadores móviles soportan WebP universalmente.',
          en: 'Yes, Chrome, Safari, Firefox, Edge, and all mobile browsers have universal WebP support.'
        }
      }
    ],
    relatedToolIds: ['png-to-webp', 'compress-image']
  },

  // 8. PNG a WebP
  {
    id: 'png-to-webp',
    slug: 'png-to-webp',
    categoryId: 'images',
    name: {
      es: 'PNG a WebP',
      en: 'PNG to WebP',
      pt: 'PNG para WebP',
      fr: 'PNG en WebP',
      de: 'PNG in WebP',
      it: 'PNG in WebP'
    },
    shortDescription: {
      es: 'Convierte archivos PNG a WebP manteniendo la transparencia alfa y reduciendo el peso.',
      en: 'Convert PNG to WebP while preserving alpha transparency with smaller file size.',
      pt: 'Converta PNG para WebP mantendo fundo transparente.',
      fr: 'Convertissez PNG en WebP en préservant la transparence.',
      de: 'PNG in WebP konvertieren mit Beibehaltung transparenter Hintergründe.',
      it: 'Converti PNG in WebP mantenendo la trasparenza dello sfondo.'
    },
    fullDescription: {
      es: 'Reduce drásticamente el peso de logos, ilustraciones y gráficos sin perder el canal de transparencia imprescindible en diseño web.',
      en: 'Dramatically reduce the file size of logos, icons, and illustrations without sacrificing the essential transparency layer.'
    },
    icon: 'Layers',
    isPopular: false,
    processLocally: true,
    keywords: ['png', 'webp', 'transparencia', 'alpha', 'convertir', 'logo', 'ilustracion'],
    steps: [
      {
        step: 1,
        title: { es: 'Carga tu PNG', en: 'Upload PNG' },
        desc: { es: 'Selecciona la imagen con fondo transparente o sólido.', en: 'Select the image with transparent or solid background.' }
      },
      {
        step: 2,
        title: { es: 'Verifica la vista previa', en: 'Check preview' },
        desc: { es: 'Comprueba que la transparencia se conserve intacta.', en: 'Verify that transparency is preserved cleanly.' }
      },
      {
        step: 3,
        title: { es: 'Descarga en WebP', en: 'Download WebP' },
        desc: { es: 'Obtén tu gráfico optimizado listo para publicar.', en: 'Get your optimized graphic ready to publish.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Se mantiene el fondo transparente?',
          en: 'Is transparent background preserved?'
        },
        answer: {
          es: 'Sí. WebP soporta canal alfa de transparencia completo exactamente como PNG.',
          en: 'Yes. WebP natively supports full alpha transparency channels just like PNG.'
        }
      }
    ],
    relatedToolIds: ['jpg-to-webp', 'compress-image', 'favicon-generator']
  },

  // 9. Contador de palabras
  {
    id: 'word-counter',
    slug: 'word-counter',
    categoryId: 'text',
    name: {
      es: 'Contador de palabras',
      en: 'Word Counter',
      pt: 'Contador de palavras',
      fr: 'Compteur de mots',
      de: 'Wortzähler',
      it: 'Conteggio parole'
    },
    shortDescription: {
      es: 'Cuenta palabras, caracteres con/sin espacios, párrafos y tiempo estimado de lectura.',
      en: 'Count words, characters with/without spaces, paragraphs, and reading time.',
      pt: 'Conte palavras, caracteres, parágrafos e tempo estimado de leitura.',
      fr: 'Comptez les mots, caractères, paragraphes et temps de lecture.',
      de: 'Wörter, Zeichen mit/ohne Leerzeichen, Absätze und Lesezeit zählen.',
      it: 'Conta parole, caratteri, paragrafi e tempo stimato di lettura.'
    },
    fullDescription: {
      es: 'Analizador de texto completo para redactores, estudiantes y profesionales de SEO. Incluye densidad de palabras clave y tiempo estimado para hablar en voz alta.',
      en: 'Comprehensive text analysis utility for writers, students, and SEO pros. Includes keyword density metrics and estimated speech presentation time.'
    },
    icon: 'FileText',
    isPopular: true,
    processLocally: true,
    keywords: ['contador', 'palabras', 'caracteres', 'texto', 'word count', 'redaccion', 'tiempo de lectura', 'seo'],
    steps: [
      {
        step: 1,
        title: { es: 'Pega o escribe tu texto', en: 'Paste or type text' },
        desc: { es: 'Ingresa el contenido en el área de trabajo.', en: 'Input your content into the work area.' }
      },
      {
        step: 2,
        title: { es: 'Revisa las métricas en vivo', en: 'Review live metrics' },
        desc: { es: 'Observa palabras, caracteres, oraciones y tiempos al instante.', en: 'Check words, characters, sentences, and timing metrics instantly.' }
      },
      {
        step: 3,
        title: { es: 'Copia o limpia con un clic', en: 'Copy or clear' },
        desc: { es: 'Usa las acciones rápidas para formatear o limpiar el texto.', en: 'Use one-click quick actions to format or clear the workspace.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Cómo se calcula el tiempo de lectura?',
          en: 'How is reading time estimated?'
        },
        answer: {
          es: 'Se calcula tomando como estándar un ritmo promedio de 200 a 220 palabras por minuto en adultos.',
          en: 'It is estimated using the standard average pace of 200 to 220 words per minute for adults.'
        }
      }
    ],
    relatedToolIds: ['text-diff', 'json-formatter']
  },

  // 10. Comparador de texto
  {
    id: 'text-diff',
    slug: 'text-diff',
    categoryId: 'text',
    name: {
      es: 'Comparador de texto',
      en: 'Text Diff Checker',
      pt: 'Comparador de texto',
      fr: 'Comparateur de texte',
      de: 'Textvergleich',
      it: 'Confronto testo'
    },
    shortDescription: {
      es: 'Compara dos textos o bloques de código y resalta cambios, adiciones y eliminaciones.',
      en: 'Compare two texts or code snippets side-by-side with highlight changes.',
      pt: 'Compare dois textos e veja adições e exclusões destacadas.',
      fr: 'Comparez deux textes côte à côte avec surbrillance des différences.',
      de: 'Vergleichen Sie zwei Texte nebeneinander mit hervorgehobenen Änderungen.',
      it: 'Confronta due testi fianco a fianco evidenziando differenze e modifiche.'
    },
    fullDescription: {
      es: 'Detecta rápidamente diferencias en contratos, borradores, traducciones o líneas de código fuente. Visualización paralela clara con colores intuitivos.',
      en: 'Quickly spot edits in contracts, drafts, translated texts, or code files. Clean side-by-side view with intuitive color highlights.'
    },
    icon: 'GitCompare',
    isPopular: true,
    processLocally: true,
    keywords: ['comparar', 'texto', 'diff', 'diferencias', 'cambios', 'codigo', 'revision', 'contratos'],
    steps: [
      {
        step: 1,
        title: { es: 'Texto original', en: 'Original text' },
        desc: { es: 'Pega la versión inicial en el panel izquierdo.', en: 'Paste initial version on the left panel.' }
      },
      {
        step: 2,
        title: { es: 'Texto modificado', en: 'Modified text' },
        desc: { es: 'Pega la versión nueva o editada en el panel derecho.', en: 'Paste updated version on the right panel.' }
      },
      {
        step: 3,
        title: { es: 'Inspecciona diferencias', en: 'Inspect differences' },
        desc: { es: 'Visualiza en verde las adiciones y en rojo las líneas eliminadas.', en: 'See additions highlighted in green and removals in red.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Compara palabra por palabra o línea por línea?',
          en: 'Does it compare word-by-word or line-by-line?'
        },
        answer: {
          es: 'Compara tanto la estructura por líneas como las palabras modificadas dentro de cada línea.',
          en: 'It compares both line structure and specific modified tokens within each line.'
        }
      }
    ],
    relatedToolIds: ['word-counter', 'json-formatter']
  },

  // 11. Generador QR
  {
    id: 'qr-generator',
    slug: 'qr-generator',
    categoryId: 'qr',
    name: {
      es: 'Generador QR',
      en: 'QR Code Generator',
      pt: 'Gerador de QR Code',
      fr: 'Générateur de QR Code',
      de: 'QR-Code-Generator',
      it: 'Generatore QR Code'
    },
    shortDescription: {
      es: 'Crea códigos QR personalizados para URLs, texto libre, emails, teléfonos y vCards.',
      en: 'Create custom QR codes for web URLs, plain text, emails, phones, and vCards.',
      pt: 'Crie códigos QR para sites, textos, e-mails e contatos.',
      fr: 'Créez des QR codes personnalisés pour liens web, textes et contacts.',
      de: 'Erstellen Sie QR-Codes für URLs, Text, E-Mail und Kontaktdaten.',
      it: 'Crea codici QR personalizzati per siti web, testo, email e contatti.'
    },
    fullDescription: {
      es: 'Genera códigos QR estáticos libres que nunca caducan. Personaliza el color frontal y de fondo, define el nivel de corrección de errores y descarga en PNG de alta resolución o SVG vectorial.',
      en: 'Generate free permanent QR codes that never expire. Customize foreground/background colors, set error correction, and download in crystal-clear PNG or vector SVG.'
    },
    icon: 'QrCode',
    isPopular: true,
    processLocally: true,
    keywords: ['qr', 'codigo qr', 'crear qr', 'generador', 'url qr', 'vectorial', 'svg', 'descargar qr'],
    steps: [
      {
        step: 1,
        title: { es: 'Elige el tipo de contenido', en: 'Choose content type' },
        desc: { es: 'Selecciona URL, texto, email o teléfono.', en: 'Select URL, text, email, or telephone.' }
      },
      {
        step: 2,
        title: { es: 'Ingresa los datos y estilo', en: 'Enter data & styling' },
        desc: { es: 'Escribe tu enlace y personaliza los colores si lo deseas.', en: 'Type your link and tweak color scheme if desired.' }
      },
      {
        step: 3,
        title: { es: 'Descarga en PNG o SVG', en: 'Download PNG or SVG' },
        desc: { es: 'Guarda tu código QR listo para imprimir en volantes, menús o pantallas.', en: 'Save your QR code ready for print menus, flyers, or digital screens.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Los códigos QR generados caducan?',
          en: 'Do generated QR codes expire?'
        },
        answer: {
          es: 'No. Son códigos estáticos directos que codifican los datos en su matriz sin intermediarios, por lo que funcionan para siempre.',
          en: 'No. They are static QR codes that directly encode the payload into the matrix, so they work forever.'
        }
      }
    ],
    relatedToolIds: ['qr-wifi', 'url-encoder']
  },

  // 12. QR WiFi
  {
    id: 'qr-wifi',
    slug: 'qr-wifi',
    categoryId: 'qr',
    name: {
      es: 'QR para WiFi',
      en: 'WiFi QR Code',
      pt: 'QR Code para WiFi',
      fr: 'QR Code pour WiFi',
      de: 'WLAN-QR-Code',
      it: 'QR Code per WiFi'
    },
    shortDescription: {
      es: 'Genera un código QR para conectar smartphones a tu red WiFi sin escribir la contraseña.',
      en: 'Generate a QR code to connect smartphones to your WiFi without typing the password.',
      pt: 'Crie um QR Code para conectar ao WiFi sem digitar senhas longas.',
      fr: 'Générez un QR code pour vous connecter au WiFi sans saisir le mot de passe.',
      de: 'WLAN-Zugang per QR-Code ohne Passworttippen teilen.',
      it: 'Crea un QR Code per connetterti al WiFi senza digitare password complesse.'
    },
    fullDescription: {
      es: 'Ideal para cafeterías, hogares, oficinas y eventos. Los invitados solo apuntan la cámara de su móvil y se conectan automáticamente a la red inalámbrica de forma segura.',
      en: 'Ideal for cafes, homes, offices, and conferences. Guests simply scan with their phone camera to connect instantly without typing complicated keys.'
    },
    icon: 'Wifi',
    isPopular: true,
    processLocally: true,
    keywords: ['wifi', 'qr wifi', 'red', 'wpa', 'conectar', 'escanear wifi', 'clave wifi'],
    steps: [
      {
        step: 1,
        title: { es: 'Ingresa el nombre de la red (SSID)', en: 'Enter network SSID' },
        desc: { es: 'Escribe el nombre exacto de tu señal WiFi.', en: 'Type the exact name of your WiFi network.' }
      },
      {
        step: 2,
        title: { es: 'Escribe la contraseña', en: 'Enter password' },
        desc: { es: 'Indica el tipo de seguridad (WPA/WPA2/WPA3 o abierta).', en: 'Specify security type (WPA/WPA2/WPA3 or open).' }
      },
      {
        step: 3,
        title: { es: 'Descarga o imprime', en: 'Download or print' },
        desc: { es: 'Coloca el código QR en una tarjeta visible para tus visitas.', en: 'Print and display the QR card for quick guest access.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Es seguro generar el QR de mi WiFi aquí?',
          en: 'Is it safe to generate my WiFi QR here?'
        },
        answer: {
          es: 'Totalmente seguro. Los datos se procesan exclusivamente dentro de tu navegador; ninguna contraseña se transmite por internet.',
          en: '100% safe. Processing happens exclusively in your client-side browser; no password is ever transmitted over the web.'
        }
      }
    ],
    relatedToolIds: ['qr-generator', 'password-generator']
  },

  // 13. Generador de contraseñas
  {
    id: 'password-generator',
    slug: 'password-generator',
    categoryId: 'productivity',
    name: {
      es: 'Generador de contraseñas',
      en: 'Password Generator',
      pt: 'Gerador de senhas',
      fr: 'Générateur de mot de passe',
      de: 'Passwort-Generator',
      it: 'Generatore di password'
    },
    shortDescription: {
      es: 'Crea contraseñas robustas e imposibles de adivinar con medidor de entropía y seguridad.',
      en: 'Generate ultra-secure, uncrackable passwords with entropy and strength meter.',
      pt: 'Crie senhas fortes e seguras com medidor de robustez em tempo real.',
      fr: 'Créez des mots de passe robustes et sécurisés avec indicateur de force.',
      de: 'Erstellen Sie hochsichere Passwörter mit Entropie- und Stärke-Anzeige.',
      it: 'Crea password ultra sicure con indicatore di robustezza in tempo reale.'
    },
    fullDescription: {
      es: 'Utiliza el motor criptográfico seguro del navegador (`crypto.getRandomValues`) para generar claves aleatorias de alta entropía. Configura longitud, mayúsculas, números y símbolos.',
      en: 'Leverages the browser’s native cryptographic generator (`crypto.getRandomValues`) to produce high-entropy secure keys. Configure length, case, numbers, and special symbols.'
    },
    icon: 'KeyRound',
    isPopular: true,
    processLocally: true,
    keywords: ['password', 'contraseña', 'seguridad', 'clave', 'generator', 'entropy', 'pin'],
    steps: [
      {
        step: 1,
        title: { es: 'Configura la longitud', en: 'Set password length' },
        desc: { es: 'Recomendamos 16 caracteres o más para máxima seguridad.', en: 'We recommend 16 characters or more for top security.' }
      },
      {
        step: 2,
        title: { es: 'Elige los caracteres', en: 'Select character sets' },
        desc: { es: 'Activa o desactiva mayúsculas, números o símbolos especiales.', en: 'Toggle uppercase, lowercase, numbers, or special symbols.' }
      },
      {
        step: 3,
        title: { es: 'Copia con un clic', en: 'Copy with one click' },
        desc: { es: 'Copia al portapapeles y pégala en tu gestor de contraseñas.', en: 'Copy to clipboard and paste into your preferred password manager.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Cómo se garantiza que nadie más vea mi contraseña?',
          en: 'How is it guaranteed that no one else sees my password?'
        },
        answer: {
          es: 'La generación ocurre localmente mediante la API criptográfica de tu navegador. Ninguna clave viaja a través de la red.',
          en: 'Generation runs strictly locally via your browser Web Crypto API. No password data is sent across the network.'
        }
      }
    ],
    relatedToolIds: ['qr-generator', 'base64-converter']
  },

  // 14. Convertidor de unidades
  {
    id: 'unit-converter',
    slug: 'unit-converter',
    categoryId: 'students',
    name: {
      es: 'Convertidor de unidades',
      en: 'Unit Converter',
      pt: 'Conversor de unidades',
      fr: 'Convertisseur d’unités',
      de: 'Einheitenumrechner',
      it: 'Convertitore di unità'
    },
    shortDescription: {
      es: 'Convierte al instante longitud, masa, temperatura, datos digitales, velocidad y área.',
      en: 'Convert length, mass, temperature, digital data, speed, and area in real-time.',
      pt: 'Converta comprimento, peso, temperatura e dados digitais instantaneamente.',
      fr: 'Convertissez longueur, poids, température, données numériques et vitesse.',
      de: 'Länge, Masse, Temperatur, digitale Daten, Geschwindigkeit und Fläche umrechnen.',
      it: 'Converti lunghezza, peso, temperatura, dati digitali, velocità e area.'
    },
    fullDescription: {
      es: 'Herramienta educativa y técnica que calcula conversiones métricas e imperiales al vuelo con fórmulas explicativas detalladas.',
      en: 'Educational and practical tool calculating metric and imperial unit conversions on the fly with detailed explanatory formulas.'
    },
    icon: 'Scale',
    isPopular: true,
    processLocally: true,
    keywords: ['convertidor', 'unidades', 'metros', 'libras', 'kilos', 'temperatura', 'celsius', 'fahrenheit', 'megabytes', 'gigabytes'],
    steps: [
      {
        step: 1,
        title: { es: 'Selecciona la categoría', en: 'Select category' },
        desc: { es: 'Elige longitud, peso, temperatura, datos o velocidad.', en: 'Pick length, mass, temperature, data, or speed.' }
      },
      {
        step: 2,
        title: { es: 'Ingresa el valor', en: 'Input value' },
        desc: { es: 'Escribe el número en la unidad de origen.', en: 'Type the number in the source unit.' }
      },
      {
        step: 3,
        title: { es: 'Lee el resultado', en: 'View converted value' },
        desc: { es: 'Obtén la equivalencia precisa con fórmula y notación.', en: 'Get the exact equivalent with formula and notation.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Tiene soporte para unidades imperiales y métricas?',
          en: 'Does it support both imperial and metric systems?'
        },
        answer: {
          es: 'Sí, cubre metros, pies, pulgadas, kilogramos, libras, grados Celsius, Fahrenheit y más.',
          en: 'Yes, it supports meters, feet, inches, kilograms, pounds, Celsius, Fahrenheit, and more.'
        }
      }
    ],
    relatedToolIds: ['date-difference', 'word-counter']
  },

  // 15. Diferencia entre fechas
  {
    id: 'date-difference',
    slug: 'date-difference',
    categoryId: 'productivity',
    name: {
      es: 'Diferencia entre fechas',
      en: 'Date Difference Calculator',
      pt: 'Diferença entre datas',
      fr: 'Différence entre dates',
      de: 'Datumsdifferenz-Rechner',
      it: 'Calcolo differenza date'
    },
    shortDescription: {
      es: 'Calcula los días, semanas, meses, horas y días laborables exactos entre dos fechas.',
      en: 'Calculate the exact days, weeks, months, hours, and business days between dates.',
      pt: 'Calcule dias, semanas, meses e dias úteis entre duas datas.',
      fr: 'Calculez le nombre de jours, semaines, mois et jours ouvrés entre deux dates.',
      de: 'Tage, Wochen, Monate und Werktage zwischen zwei Daten berechnen.',
      it: 'Calcola giorni, settimane, mesi e giorni lavorativi esatti tra due date.'
    },
    fullDescription: {
      es: 'Descubre con exactitud cuántos días faltan para un evento, la duración de un proyecto o tu edad exacta en días y horas totales.',
      en: 'Calculate exactly how many days remain until a deadline, project length, or your exact age in total days and hours.'
    },
    icon: 'Calendar',
    isPopular: false,
    processLocally: true,
    keywords: ['fechas', 'dias', 'calendario', 'duracion', 'plazo', 'dias laborables', 'tiempo'],
    steps: [
      {
        step: 1,
        title: { es: 'Selecciona la fecha inicial', en: 'Select start date' },
        desc: { es: 'Elige el día de partida.', en: 'Pick your beginning date.' }
      },
      {
        step: 2,
        title: { es: 'Selecciona la fecha final', en: 'Select end date' },
        desc: { es: 'Elige el día de destino.', en: 'Pick your ending date.' }
      },
      {
        step: 3,
        title: { es: 'Ver desglose completo', en: 'View detailed breakdown' },
        desc: { es: 'Consulta el total en días naturales, semanas y días hábiles.', en: 'View breakdown in calendar days, weeks, and business days.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Distingue entre días naturales y laborables?',
          en: 'Does it calculate business days separately?'
        },
        answer: {
          es: 'Sí, muestra tanto el total de días consecutivos como la cantidad de días hábiles de lunes a viernes.',
          en: 'Yes, it breaks down both full calendar days and Monday-Friday business workdays.'
        }
      }
    ],
    relatedToolIds: ['unit-converter', 'password-generator']
  },

  // 16. JSON Formatter
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    categoryId: 'developer',
    name: {
      es: 'Formateador de JSON',
      en: 'JSON Formatter & Validator',
      pt: 'Formatador de JSON',
      fr: 'Formateur de JSON',
      de: 'JSON-Formatierer',
      it: 'Formattatore JSON'
    },
    shortDescription: {
      es: 'Embellece, valida sintaxis, repara y minifica código JSON con detección de errores.',
      en: 'Beautify, validate syntax, format, and minify JSON code with error detection.',
      pt: 'Formate, valide e minifique código JSON com detecção de erros.',
      fr: 'Formatez, validez et minifiez du code JSON avec détection d’erreurs.',
      de: 'JSON formatieren, validieren und minifizieren mit genauen Fehlerhinweisen.',
      it: 'Formatta, valida e minimizza codice JSON con rilevamento errori di sintassi.'
    },
    fullDescription: {
      es: 'Herramienta esencial para programadores y diseñadores de APIs. Indenta a 2 o 4 espacios, comprime en una sola línea y localiza exactamente la línea del error sintáctico.',
      en: 'Essential tool for developers and API designers. Indent to 2 or 4 spaces, minify into a single line, and pinpoint exact syntax error locations.'
    },
    icon: 'Code2',
    isPopular: true,
    processLocally: true,
    keywords: ['json', 'formatear', 'beautify', 'minify', 'validar', 'parse', 'api', 'desarrollo'],
    steps: [
      {
        step: 1,
        title: { es: 'Pega tu JSON', en: 'Paste your JSON' },
        desc: { es: 'Introduce el texto o código en el editor.', en: 'Input your raw JSON string into the editor.' }
      },
      {
        step: 2,
        title: { es: 'Pulsa Formatear o Minificar', en: 'Click Format or Minify' },
        desc: { es: 'Ajusta la sangría o remueve todos los espacios innecesarios.', en: 'Adjust spacing or remove all whitespace.' }
      },
      {
        step: 3,
        title: { es: 'Copia el resultado', en: 'Copy result' },
        desc: { es: 'Copia el código limpio al portapapeles.', en: 'Copy the valid formatted code to your clipboard.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Detecta si hay comas sobrantes o comillas erróneas?',
          en: 'Does it detect trailing commas or misplaced quotes?'
        },
        answer: {
          es: 'Sí, muestra el mensaje exacto y la posición para que puedas corregirlo al instante.',
          en: 'Yes, it highlights the exact error line and message so you can fix it immediately.'
        }
      }
    ],
    relatedToolIds: ['base64-converter', 'url-encoder']
  },

  // 17. Base64 Encoder/Decoder
  {
    id: 'base64-converter',
    slug: 'base64-converter',
    categoryId: 'developer',
    name: {
      es: 'Codificador Base64',
      en: 'Base64 Encoder & Decoder',
      pt: 'Codificador Base64',
      fr: 'Encodeur / Décodeur Base64',
      de: 'Base64-Konverter',
      it: 'Codificatore Base64'
    },
    shortDescription: {
      es: 'Codifica y decodifica texto o archivos binarios en formato Base64 con soporte UTF-8.',
      en: 'Encode and decode plain text or binary files to/from Base64 with full UTF-8 support.',
      pt: 'Codifique e decodifique texto e arquivos em Base64 com suporte UTF-8.',
      fr: 'Encodez et décodez du texte ou des fichiers en Base64 avec support UTF-8.',
      de: 'Text und Dateien in Base64 kodieren und dekodieren mit UTF-8-Unterstützung.',
      it: 'Codifica e decodifica testo e file in Base64 con supporto completo UTF-8.'
    },
    fullDescription: {
      es: 'Transforma cadenas de texto o imágenes en representación Base64 segura para incrustar en CSS, HTML o transferir en cabeceras HTTP.',
      en: 'Transform text strings or small assets into safe Base64 strings suitable for embedding in CSS, HTML, or transmitting over HTTP.'
    },
    icon: 'Binary',
    isPopular: false,
    processLocally: true,
    keywords: ['base64', 'codificar', 'decodificar', 'encode', 'decode', 'binary', 'utf8', 'ascii'],
    steps: [
      {
        step: 1,
        title: { es: 'Elige modo', en: 'Select mode' },
        desc: { es: 'Selecciona si deseas Codificar a Base64 o Decodificar.', en: 'Choose whether you want to Encode or Decode.' }
      },
      {
        step: 2,
        title: { es: 'Ingresa texto o archivo', en: 'Input text or file' },
        desc: { es: 'Escribe tu mensaje o arrastra un archivo.', en: 'Type your message or drag a file.' }
      },
      {
        step: 3,
        title: { es: 'Obtén el resultado', en: 'Get output' },
        desc: { es: 'Copia el texto codificado o descarga el contenido decodificado.', en: 'Copy encoded text or download decoded content.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Soporta caracteres especiales y acentos en español?',
          en: 'Does it support special characters and accents?'
        },
        answer: {
          es: 'Sí, utiliza codificación nativa UTF-8 para garantizar que tildes, ñ y emojis no se corrompan.',
          en: 'Yes, it uses UTF-8 text encoding to guarantee accents and emoji characters remain intact.'
        }
      }
    ],
    relatedToolIds: ['url-encoder', 'json-formatter']
  },

  // 18. URL Encoder/Decoder
  {
    id: 'url-encoder',
    slug: 'url-encoder',
    categoryId: 'developer',
    name: {
      es: 'URL Encoder / Decoder',
      en: 'URL Encoder & Decoder',
      pt: 'URL Encoder / Decoder',
      fr: 'Encodeur / Décodeur d’URL',
      de: 'URL-Kodierer / Dekodierer',
      it: 'URL Encoder & Decoder'
    },
    shortDescription: {
      es: 'Codifica y decodifica parámetros y caracteres especiales en direcciones URL.',
      en: 'Encode and decode query parameters and special characters in web URLs.',
      pt: 'Codifique e decodifique parâmetros em links e URLs.',
      fr: 'Encodez et décodez les paramètres d’adresses web.',
      de: 'URL-Parameter und Sonderzeichen kodieren und dekodieren.',
      it: 'Codifica e decodifica parametri e caratteri speciali negli indirizzi URL.'
    },
    fullDescription: {
      es: 'Convierte espacios y símbolos reservados en secuencias `%20`, `%2F`, etc., permitiendo que los enlaces web funcionen sin errores en navegadores y servidores.',
      en: 'Converts spaces and reserved characters into `%20`, `%2F`, etc., ensuring web links work seamlessly across browsers and web servers.'
    },
    icon: 'Link',
    isPopular: false,
    processLocally: true,
    keywords: ['url', 'uri', 'encode', 'decode', 'percent encoding', 'query params', 'enlaces'],
    steps: [
      {
        step: 1,
        title: { es: 'Pega la URL o texto', en: 'Paste URL or text' },
        desc: { es: 'Introduce la cadena que contiene caracteres especiales.', en: 'Input the string containing special characters.' }
      },
      {
        step: 2,
        title: { es: 'Elige la acción', en: 'Choose action' },
        desc: { es: 'Pulsa Encode para codificar o Decode para volver al texto legible.', en: 'Click Encode to protect or Decode to return to readable text.' }
      },
      {
        step: 3,
        title: { es: 'Copia el resultado', en: 'Copy result' },
        desc: { es: 'Utiliza el enlace seguro en tu código o navegador.', en: 'Use the safe link in your code or browser.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Cuál es la diferencia entre encodeURI y encodeURIComponent?',
          en: 'What is the difference between encodeURI and encodeURIComponent?'
        },
        answer: {
          es: 'encodeURI respeta la estructura completa de la dirección (`http://`), mientras que encodeURIComponent codifica todos los símbolos para parámetros seguros.',
          en: 'encodeURI preserves address scheme symbols (`http://`), while encodeURIComponent encodes everything for safe query parameters.'
        }
      }
    ],
    relatedToolIds: ['base64-converter', 'qr-generator']
  },

  // 19. Imagen a PDF
  {
    id: 'image-to-pdf',
    slug: 'image-to-pdf',
    categoryId: 'pdf',
    name: {
      es: 'Imagen a PDF',
      en: 'Image to PDF',
      pt: 'Imagem para PDF',
      fr: 'Image en PDF',
      de: 'Bild in PDF',
      it: 'Immagine in PDF'
    },
    shortDescription: {
      es: 'Une múltiples imágenes PNG, JPG, GIF o WebP en un único archivo PDF continuo.',
      en: 'Combine multiple PNG, JPG, GIF, or WebP images into a single continuous PDF.',
      pt: 'Reúna fotos PNG, JPG e WebP em um único arquivo PDF.',
      fr: 'Assemblez plusieurs images PNG, JPG et WebP en un seul fichier PDF.',
      de: 'Mehrere PNG-, JPG- oder WebP-Bilder zu einem einzigen PDF zusammenfügen.',
      it: 'Unisci più immagini PNG, JPG e WebP in un unico documento PDF.'
    },
    fullDescription: {
      es: 'Escanea documentos, tickets o apuntes con tu cámara y conviértelos en un PDF limpio y ordenado para entregas escolares, laborales o archivos personales.',
      en: 'Compile receipts, notes, or scanned documents from your camera into a neat PDF for school, business, or personal archival.'
    },
    icon: 'FilePlus',
    isPopular: true,
    processLocally: true,
    keywords: ['imagen a pdf', 'png a pdf', 'fotos a pdf', 'recibos a pdf', 'escaner movil'],
    steps: [
      {
        step: 1,
        title: { es: 'Selecciona las fotos', en: 'Select photos' },
        desc: { es: 'Puedes cargar múltiples fotos a la vez.', en: 'Upload multiple photos at the same time.' }
      },
      {
        step: 2,
        title: { es: 'Reordena las páginas', en: 'Reorder pages' },
        desc: { es: 'Ajusta el orden en que aparecerán en el PDF final.', en: 'Set the sequence they will appear in the final PDF.' }
      },
      {
        step: 3,
        title: { es: 'Compilar y Descargar', en: 'Compile & Download' },
        desc: { es: 'Genera el PDF con las fotos centradas y optimizadas.', en: 'Generate the PDF with photos centered and optimized.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Puedo mezclar formatos de imagen diferentes?',
          en: 'Can I mix different image formats?'
        },
        answer: {
          es: 'Sí, puedes incluir JPG, PNG y WebP juntos en el mismo PDF.',
          en: 'Yes, you can combine JPG, PNG, and WebP images together in one PDF.'
        }
      }
    ],
    relatedToolIds: ['jpg-to-pdf', 'merge-pdf', 'compress-pdf']
  },

  // 20. Favicon Generator
  {
    id: 'favicon-generator',
    slug: 'favicon-generator',
    categoryId: 'images',
    name: {
      es: 'Generador de Favicon',
      en: 'Favicon Generator',
      pt: 'Gerador de Favicon',
      fr: 'Générateur de Favicon',
      de: 'Favicon-Generator',
      it: 'Generatore Favicon'
    },
    shortDescription: {
      es: 'Crea paquetes de iconos favicon.ico, 16x16, 32x32, 48x48 y Apple Touch Icon para tu web.',
      en: 'Generate complete favicon packages including 16x16, 32x32, 48x48, and Apple Touch icon.',
      pt: 'Crie pacotes de favicon completos com tamanhos 16x16, 32x32 e Apple Touch.',
      fr: 'Créez un pack complet de favicons 16x16, 32x32 et Apple Touch.',
      de: 'Komplettes Favicon-Paket für 16x16, 32x32, 48x48 und Apple Touch Icon generieren.',
      it: 'Crea pacchetti completi di favicon 16x16, 32x32 e Apple Touch per il tuo sito.'
    },
    fullDescription: {
      es: 'Sube tu logo o imagen cuadrada y genera al instante todas las dimensiones necesarias para navegadores modernos, iOS y Android con el código HTML listo para copiar.',
      en: 'Upload your logo or square graphic to generate all standard dimensions required by modern browsers, iOS, and Android with copy-paste HTML tags.'
    },
    icon: 'Globe',
    isPopular: true,
    processLocally: true,
    keywords: ['favicon', 'ico', 'icono', 'logo web', 'apple touch icon', 'generador favicon', 'manifest'],
    steps: [
      {
        step: 1,
        title: { es: 'Sube tu imagen o logo', en: 'Upload image or logo' },
        desc: { es: 'Recomendamos una imagen cuadrada de al menos 512x512 píxeles.', en: 'We recommend a square graphic of at least 512x512 pixels.' }
      },
      {
        step: 2,
        title: { es: 'Elige forma y fondo', en: 'Choose shape & background' },
        desc: { es: 'Ajusta si deseas esquinas redondeadas o fondo transparente.', en: 'Select rounded corners or preserve transparent background.' }
      },
      {
        step: 3,
        title: { es: 'Descarga paquete ZIP', en: 'Download ZIP bundle' },
        desc: { es: 'Descarga todos los archivos generados y copia la etiqueta HTML.', en: 'Download all generated sizes and copy the HTML head snippet.' }
      }
    ],
    faqs: [
      {
        question: {
          es: '¿Qué tamaños incluye el paquete?',
          en: 'What sizes are included in the bundle?'
        },
        answer: {
          es: 'Incluye 16x16, 32x32, 48x48, 180x180 (Apple Touch Icon) y 192x192 para Android.',
          en: 'It includes 16x16, 32x32, 48x48, 180x180 (Apple Touch Icon), and 192x192 for Android.'
        }
      }
    ],
    relatedToolIds: ['resize-image', 'png-to-webp', 'compress-image']
  }
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.slug === slug || tool.id === slug);
}

export function getToolsByCategory(categoryId: string): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.categoryId === categoryId);
}

export function searchTools(query: string, lang: string = 'es'): ToolDefinition[] {
  if (!query.trim()) return TOOLS;
  const q = query.toLowerCase().trim();
  
  return TOOLS.filter((tool) => {
    // Check name in any lang
    const nameMatch = Object.values(tool.name).some((n) => n?.toLowerCase().includes(q));
    // Check short description
    const descMatch = Object.values(tool.shortDescription).some((d) => d?.toLowerCase().includes(q));
    // Check keywords
    const kwMatch = tool.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
    // Synonyms mapping
    const synonyms: Record<string, string[]> = {
      foto: ['imagen', 'jpg', 'png', 'resize', 'compress'],
      fotografia: ['imagen', 'jpg'],
      pdf: ['compress-pdf', 'merge-pdf', 'jpg-to-pdf', 'pdf-to-jpg'],
      unir: ['merge', 'combinar'],
      reducir: ['compress', 'comprimir', 'tamaño'],
      wifi: ['qr-wifi', 'qr'],
      clave: ['password', 'contraseña'],
      json: ['formatter', 'validador'],
      base64: ['encode', 'decode'],
      dias: ['date', 'fecha', 'diferencia']
    };
    
    const synMatch = Object.entries(synonyms).some(([key, matches]) => {
      if (q.includes(key)) {
        return matches.some((m) => tool.id.includes(m) || tool.keywords.includes(m));
      }
      return false;
    });

    return nameMatch || descMatch || kwMatch || synMatch;
  });
}
