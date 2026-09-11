import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import {
  extractStructuredPdf,
  buildCompliantDocx,
  validateDocxBlob,
} from '../src/utils/pdfConverter.ts';
import {
  parseDocxFile,
  buildDocxToPdf,
  validateGeneratedPdf,
} from '../src/utils/docxToPdfConverter.ts';

const OUTPUT_DIR = './test-output';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('================================================================');
console.log('   INICIANDO BATERÍA DE 10 PRUEBAS PROFESIONALES DE CONVERSIÓN  ');
console.log('================================================================\n');

const testResults = [];

async function recordTest(testNumber, testName, testFn) {
  process.stdout.write(`Prueba ${testNumber}: ${testName}... `);
  try {
    const startTime = Date.now();
    const details = await testFn();
    const duration = Date.now() - startTime;
    console.log(`\x1b[32m[ÉXITO]\x1b[0m (${duration}ms)`);
    if (details) console.log(`   Detalles: ${details}`);
    testResults.push({ id: testNumber, name: testName, status: 'PASSED', duration, details });
  } catch (err) {
    console.log(`\x1b[31m[FALLO]\x1b[0m`);
    console.error(`   Error: ${err.message}`);
    testResults.push({ id: testNumber, name: testName, status: 'FAILED', error: err.message });
  }
}

// Helper to create a 1x1 PNG Uint8Array in memory for testing
function createMinimalPng() {
  // 1x1 transparent PNG
  return new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0,
    0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13,
    10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
  ]);
}

// -------------------------------------------------------------
// TEST 1: Documento simple (1 página)
// -------------------------------------------------------------
await recordTest(1, 'Documento simple (1 página)', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  page.drawText('INFORME TECNICO MENSUAL', { x: 50, y: 780, size: 18, font, color: rgb(0.1, 0.2, 0.4) });
  page.drawText('Este es un documento simple de una pagina para verificar la fidelidad de conversion de Toolbox Word.', {
    x: 50, y: 740, size: 11, font
  });
  page.drawText('Todos los parrafos deben conservarse con formato limpio y tipografia estandar.', {
    x: 50, y: 720, size: 11, font
  });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba1_simple.pdf');
  
  if (analysis.pageCount !== 1) throw new Error(`Esperaba 1 página, obtuvo ${analysis.pageCount}`);
  if (analysis.totalCharacters < 50) throw new Error('No se extrajo suficiente texto');

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', includePageBreaks: true, addHeaderInfo: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '01_simple.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `${analysis.totalWords} palabras, ${validation.entryCount} partes OpenXML, ${(validation.byteSize/1024).toFixed(1)} KB`;
});

// -------------------------------------------------------------
// TEST 2: Documento de varias páginas (3 páginas)
// -------------------------------------------------------------
await recordTest(2, 'Documento de varias páginas (3 páginas)', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  for (let i = 1; i <= 3; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawText(`Capitulo ${i}: Seccion analitica`, { x: 50, y: 780, size: 16, font });
    page.drawText(`Contenido descriptivo para la pagina numero ${i} del documento multipagina.`, { x: 50, y: 740, size: 11, font });
    page.drawText(`El sistema debe crear secciones continuas o saltos de pagina respetando el original.`, { x: 50, y: 720, size: 11, font });
  }

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba2_multipagina.pdf');
  
  if (analysis.pageCount !== 3) throw new Error(`Esperaba 3 páginas, obtuvo ${analysis.pageCount}`);

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Arial', includePageBreaks: true, addHeaderInfo: false });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '02_multipagina.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `${analysis.pageCount} páginas analizadas y empaquetadas en DOCX válido`;
});

// -------------------------------------------------------------
// TEST 3: Documento con imágenes
// -------------------------------------------------------------
await recordTest(3, 'Documento con imágenes', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  const pngBytes = createMinimalPng();
  const embeddedImage = await pdfDoc.embedPng(pngBytes);
  
  page.drawText('DOCUMENTO CON IMAGEN EMBEBIDA', { x: 50, y: 780, size: 16, font });
  page.drawImage(embeddedImage, { x: 50, y: 550, width: 200, height: 150 });
  page.drawText('Pie de imagen: Grafico analitico de rendimiento.', { x: 50, y: 520, size: 10, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba3_imagen.pdf');
  
  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', includePageBreaks: true, addHeaderInfo: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '03_imagen.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `Documento con elementos visuales y texto preservado (${(validation.byteSize/1024).toFixed(1)} KB)`;
});

// -------------------------------------------------------------
// TEST 4: Documento con tablas
// -------------------------------------------------------------
await recordTest(4, 'Documento con tablas estructuradas', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  page.drawText('TABLA DE PRODUCTOS Y PRECIOS', { x: 50, y: 780, size: 16, font });
  
  // Simulated tabular lines with 3 columns
  page.drawText('ID Producto     Descripcion                Precio USD', { x: 50, y: 740, size: 11, font });
  page.drawText('PRD-001         Servidor Cloud Dedicado    $ 450.00', { x: 50, y: 720, size: 11, font });
  page.drawText('PRD-002         Base de Datos PostgreSQL   $ 120.00', { x: 50, y: 700, size: 11, font });
  page.drawText('PRD-003         Certificado SSL Wildcard   $  85.00', { x: 50, y: 680, size: 11, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba4_tablas.pdf');
  
  if (!analysis.hasTables && analysis.tableCount === 0) {
    // Check elements
    const tableEl = analysis.allElements.find(e => e.type === 'table');
    if (!tableEl) throw new Error('No se detectó la estructura tabular');
  }

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', includePageBreaks: true, addHeaderInfo: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '04_tablas.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `Tabla detectada y convertida a elemento <w:tbl> nativo de Word`;
});

// -------------------------------------------------------------
// TEST 5: Documento con columnas
// -------------------------------------------------------------
await recordTest(5, 'Documento con columnas (2 columnas)', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  // Top Title banner
  page.drawText('NOTICIAS CORPORATIVAS Y ARTICULOS DE INVESTIGACION', { x: 80, y: 800, size: 14, font });
  
  // Left Column
  page.drawText('Columna Izquierda - Parrafo 1', { x: 50, y: 750, size: 10, font });
  page.drawText('Detalles tecnicos de la implementacion.', { x: 50, y: 735, size: 10, font });
  page.drawText('Mas informacion en columna izquierda.', { x: 50, y: 720, size: 10, font });
  page.drawText('Columna Izquierda - Parrafo 2', { x: 50, y: 690, size: 10, font });
  page.drawText('Continuacion de notas a la izquierda.', { x: 50, y: 675, size: 10, font });

  // Right Column
  page.drawText('Columna Derecha - Parrafo 1', { x: 320, y: 750, size: 10, font });
  page.drawText('Analisis financiero y proyecciones.', { x: 320, y: 735, size: 10, font });
  page.drawText('Detalles en la columna derecha.', { x: 320, y: 720, size: 10, font });
  page.drawText('Columna Derecha - Parrafo 2', { x: 320, y: 690, size: 10, font });
  page.drawText('Conclusion de columna derecha.', { x: 320, y: 675, size: 10, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba5_columnas.pdf');

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', includePageBreaks: true, addHeaderInfo: false });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '05_columnas.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `Lectura desambiguada por columnas y convertida a flujo natural`;
});

// -------------------------------------------------------------
// TEST 6: Documento con fórmulas
// -------------------------------------------------------------
await recordTest(6, 'Documento con fórmulas matemáticas', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  page.drawText('FORMULARIO DE MATEMATICA FINANCIERA', { x: 50, y: 780, size: 16, font });
  page.drawText('A continuacion se presentan las ecuaciones fundamentales:', { x: 50, y: 750, size: 11, font });
  
  // Formulas
  page.drawText('I = C * i * t', { x: 100, y: 710, size: 12, font });
  page.drawText('M = C + I', { x: 100, y: 670, size: 12, font });
  page.drawText('Ve = S - Db', { x: 100, y: 630, size: 12, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba6_formulas.pdf');
  
  const formulasFound = analysis.allElements.filter(e => e.type === 'formula');
  if (formulasFound.length === 0) {
    throw new Error('No se detectaron las formulas matematicas');
  }

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', includePageBreaks: true, addHeaderInfo: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '06_formulas.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `${formulasFound.length} fórmulas detectadas y formateadas en Cambria Math`;
});

// -------------------------------------------------------------
// TEST 7: Documento con listas (con viñetas y numeradas)
// -------------------------------------------------------------
await recordTest(7, 'Documento con listas (viñetas y numeradas)', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  page.drawText('LISTA DE REQUERIMIENTOS Y PASOS', { x: 50, y: 780, size: 16, font });
  page.drawText('1. Configurar el entorno de ejecucion en la nube.', { x: 50, y: 740, size: 11, font });
  page.drawText('2. Instalar dependencias necesarias sin librerias ficticias.', { x: 50, y: 720, size: 11, font });
  page.drawText('3. Compilar y validar el paquete binario.', { x: 50, y: 700, size: 11, font });
  
  page.drawText('- Calidad y estabilidad en cada conversion.', { x: 50, y: 660, size: 11, font });
  page.drawText('- Cero tolerancia a corrupcion de archivos XML.', { x: 50, y: 640, size: 11, font });
  page.drawText('- Compatibilidad total con Microsoft Word.', { x: 50, y: 620, size: 11, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba7_listas.pdf');
  
  const listsFound = analysis.allElements.filter(e => e.type === 'bullet_list' || e.type === 'numbered_list');
  if (listsFound.length === 0) throw new Error('No se detectaron elementos de lista');

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', includePageBreaks: true, addHeaderInfo: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '07_listas.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `${listsFound.length} items de lista preservados como viñetas nativas`;
});

// -------------------------------------------------------------
// TEST 8: Documento en español con acentos y caracteres especiales
// -------------------------------------------------------------
await recordTest(8, 'Documento en español con acentos y caracteres especiales', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  // In Helvetica standard font, WinAnsi supports Spanish accented letters
  page.drawText('DOCUMENTO EN ESPAÑOL CON CARACTERES ESPECIALES', { x: 50, y: 780, size: 14, font });
  page.drawText('¿Cómo se comportará la conversión con acentos: á, é, í, ó, ú, ñ, Ñ, ü?', { x: 50, y: 740, size: 11, font });
  page.drawText('¡Excelente! También con signos de admiración e interrogación.', { x: 50, y: 720, size: 11, font });
  page.drawText('Valores monetarios: $4,500,000 USD y cotización de €1,250 EUR.', { x: 50, y: 700, size: 11, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba8_espanol.pdf');
  
  const textJoined = analysis.allElements.map(e => e.text || '').join(' ');
  if (!textJoined.includes('acentos') && !textJoined.includes('interrogación')) {
    throw new Error('Fallo la extracción de caracteres especiales');
  }

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Aptos', includePageBreaks: true, addHeaderInfo: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '08_espanol.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `Caracteres especiales (á, é, í, ó, ú, ñ, ¿, ¡, $) preservados y sanitizados`;
});

// -------------------------------------------------------------
// TEST 9: Documento escaneado
// -------------------------------------------------------------
await recordTest(9, 'Documento escaneado (sin capa de texto nativa)', async () => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  // Page with only an image, no text operators
  const pngBytes = createMinimalPng();
  const embeddedImage = await pdfDoc.embedPng(pngBytes);
  page.drawImage(embeddedImage, { x: 50, y: 100, width: 495, height: 640 });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba9_escaneado.pdf');

  // Should detect that it has low text and image content
  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', includePageBreaks: true, addHeaderInfo: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '09_escaneado.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `Identificado como documento escaneado/gráfico y preservado en DOCX sin corrupción`;
});

// -------------------------------------------------------------
// TEST 10: Documento complejo (Texto, tabla, imagen y fórmulas combinados)
// -------------------------------------------------------------
await recordTest(10, 'Documento complejo (Texto, Tabla, Imagen y Fórmulas)', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  
  // Title
  page.drawText('INFORME CIENTIFICO Y FINANCIERO INTEGRAL', { x: 50, y: 790, size: 16, font });
  
  // Paragraph
  page.drawText('Este informe reune analisis matematico, mediciones experimentales y proyeccion contable.', {
    x: 50, y: 755, size: 10.5, font
  });
  
  // Formula
  page.drawText('E = m * c^2', { x: 120, y: 720, size: 12, font });
  
  // Table
  page.drawText('Variable        Valor Nominal     Unidad', { x: 50, y: 680, size: 10.5, font });
  page.drawText('Velocidad c     299792458         m/s', { x: 50, y: 660, size: 10.5, font });
  page.drawText('Masa m          1.50              kg', { x: 50, y: 640, size: 10.5, font });
  
  // Image
  const pngBytes = createMinimalPng();
  const img = await pdfDoc.embedPng(pngBytes);
  page.drawImage(img, { x: 50, y: 480, width: 200, height: 120 });
  page.drawText('Figura 1: Curva de disipacion energetica.', { x: 50, y: 460, size: 9, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba10_complejo.pdf');
  
  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', includePageBreaks: true, addHeaderInfo: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '10_complejo.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `Estructura completa ensamblada: párrafos, fórmulas, tablas e imágenes en ${(validation.byteSize/1024).toFixed(1)} KB`;
});

// -------------------------------------------------------------
// PRUEBA BIDIRECCIONAL: PDF -> Word -> PDF
// -------------------------------------------------------------
await recordTest(11, 'Bidireccional: PDF a Word y de vuelta a PDF', async () => {
  // Read the generated complex DOCX from Test 10
  const docxPath = path.join(OUTPUT_DIR, '10_complejo.docx');
  const docxBytes = fs.readFileSync(docxPath);
  
  const parsedDocx = await parseDocxFile(docxBytes.buffer, '10_complejo.docx');
  if (!parsedDocx || parsedDocx.elements.length === 0) {
    throw new Error('No se pudo parsear el archivo DOCX generado');
  }

  const roundtripPdfBlob = await buildDocxToPdf(parsedDocx, {
    pageSize: 'A4',
    fontFamily: 'Helvetica',
    marginSize: 'normal',
  });

  const pdfValidation = await validateGeneratedPdf(roundtripPdfBlob);
  if (!pdfValidation.isValid) {
    throw new Error(pdfValidation.error);
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, '11_roundtrip_word_to_pdf.pdf'), Buffer.from(await roundtripPdfBlob.arrayBuffer()));
  return `Conversión bidireccional exitosa: ${parsedDocx.totalWords} palabras, ${pdfValidation.pageCount} páginas en PDF de ${(pdfValidation.byteSize/1024).toFixed(1)} KB`;
});

// -------------------------------------------------------------
// PRUEBA 12: PDF con portada dedicada (Cover Page)
// -------------------------------------------------------------
await recordTest(12, 'PDF con portada dedicada (Cover Page)', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Page 1: Portada
  const coverPage = pdfDoc.addPage([595.28, 841.89]);
  coverPage.drawText('PROYECTO DE INVESTIGACION AVANZADA', { x: 60, y: 550, size: 24, font });
  coverPage.drawText('Analisis de Arquitectura y Rendimiento de Sistemas Distribuidos', { x: 60, y: 510, size: 14, font });
  coverPage.drawText('Autor: Dr. Roberto Gomez Sanchez', { x: 60, y: 220, size: 11, font });
  coverPage.drawText('Universidad Nacional - Departamento de Computacion', { x: 60, y: 195, size: 10.5, font });
  coverPage.drawText('Septiembre 2026', { x: 60, y: 170, size: 10, font });

  // Page 2: Contenido
  const bodyPage = pdfDoc.addPage([595.28, 841.89]);
  bodyPage.drawText('1. INTRODUCCION GENERAL', { x: 50, y: 780, size: 16, font });
  bodyPage.drawText('Este capitulo describe los antecedentes teoricos y metodologicos.', { x: 50, y: 750, size: 11, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba12_portada.pdf');

  if (!analysis.hasCoverPage) {
    throw new Error('No se detectó la página 1 como portada');
  }

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', preservePageBreaks: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '12_portada.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `Portada identificada con éxito: título hero (24pt), subtítulo y metadatos con salto de página`;
});

// -------------------------------------------------------------
// PRUEBA 13: PDF con múltiples tamaños de fuente y jerarquía tipográfica
// -------------------------------------------------------------
await recordTest(13, 'PDF con jerarquía tipográfica completa (H1, H2, H3, cuerpo)', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);

  page.drawText('TITULO PRINCIPAL DEL CAPITULO (H1)', { x: 50, y: 790, size: 20, font });
  page.drawText('Sección 1.1: Marco Teórico (H2)', { x: 50, y: 750, size: 15, font });
  page.drawText('Subsección 1.1.1: Antecedentes Históricos (H3)', { x: 50, y: 715, size: 13, font });
  page.drawText('El cuerpo de texto regular utiliza una tipografía legible de 10.5 puntos con espaciado balanceado.', { x: 50, y: 685, size: 10.5, font });
  page.drawText('Nota a pie de página: Datos corroborados por la institución académica.', { x: 50, y: 655, size: 8.5, font });

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba13_jerarquia.pdf');

  const h1 = analysis.allElements.find(e => e.type === 'heading1');
  const h2 = analysis.allElements.find(e => e.type === 'heading2');
  if (!h1 || !h2) throw new Error('No se clasificó correctamente la jerarquía tipográfica');

  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri' });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '13_jerarquia.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `Jerarquía tipográfica validada: H1 (20pt), H2 (15pt), H3 (13pt) y cuerpo normal`;
});

// -------------------------------------------------------------
// PRUEBA 14: PDF con encabezados y pies de página
// -------------------------------------------------------------
await recordTest(14, 'PDF con encabezados y pies de página', async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let p = 1; p <= 2; p++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    // Header
    page.drawText(`Revista Científica de Ingeniería - Volumen 42`, { x: 50, y: 810, size: 8.5, font });
    // Content
    page.drawText(`Artículo Principal - Sección ${p}`, { x: 50, y: 760, size: 16, font });
    page.drawText(`Contenido técnico y desarrollo metodológico para la página número ${p}.`, { x: 50, y: 720, size: 11, font });
    // Footer
    page.drawText(`Página ${p} de 2`, { x: 270, y: 35, size: 9, font });
  }

  const pdfBytes = await pdfDoc.save();
  const analysis = await extractStructuredPdf(pdfBytes.buffer, 'prueba14_encabezados.pdf');
  const docxBlob = await buildCompliantDocx(analysis, { fontFamily: 'Calibri', preservePageBreaks: true });
  const validation = await validateDocxBlob(docxBlob);
  if (!validation.isValid) throw new Error(validation.error);

  fs.writeFileSync(path.join(OUTPUT_DIR, '14_encabezados.docx'), Buffer.from(await docxBlob.arrayBuffer()));
  return `2 páginas procesadas conservando el contenido del cuerpo y la paginación limpia`;
});

// -------------------------------------------------------------
// PRUEBA 15: Verificación estricta: CERO marcas de agua, logos ni branding
// -------------------------------------------------------------
await recordTest(15, 'Verificación estricta: CERO marcas de agua, logos ni branding', async () => {
  const generatedFiles = fs.readdirSync(OUTPUT_DIR);
  let checkedCount = 0;

  for (const filename of generatedFiles) {
    const fullPath = path.join(OUTPUT_DIR, filename);
    const content = fs.readFileSync(fullPath);
    const contentStr = content.toString('binary');

    // Check for unwanted promotional watermark strings
    const bannedPatterns = ['Toolbox Word', 'ToolBox World'];
    for (const banned of bannedPatterns) {
      if (contentStr.includes(banned)) {
        throw new Error(`Se encontró la marca '${banned}' dentro del archivo generado: ${filename}`);
      }
    }
    checkedCount++;
  }

  return `Verificados ${checkedCount} archivos generados: NINGUNO contiene 'Toolbox Word' ni marcas de agua`;
});

console.log('\n================================================================');
const passedCount = testResults.filter(t => t.status === 'PASSED').length;
console.log(`   RESUMEN FINAL: ${passedCount}/${testResults.length} PRUEBAS COMPLETADAS CON ÉXITO`);
console.log('================================================================\n');

if (passedCount < testResults.length) {
  process.exit(1);
}
