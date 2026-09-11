import { CategoryInfo } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'pdf',
    icon: 'FileText',
    count: 22,
    name: {
      es: 'Herramientas PDF',
      en: 'PDF Tools',
      pt: 'Ferramentas PDF',
      fr: 'Outils PDF',
      de: 'PDF-Werkzeuge',
      it: 'Strumenti PDF'
    },
    description: {
      es: 'Comprime, une, divide, convierte y organiza documentos PDF sin instalar programas.',
      en: 'Compress, merge, split, convert, and organize PDF documents without installing software.',
      pt: 'Comprima, junte, divida e converta documentos PDF sem instalar programas.',
      fr: 'Compressez, fusionnez, divisez et convertissez vos PDF en ligne.',
      de: 'PDF-Dateien komprimieren, zusammenfügen, trennen und konvertieren.',
      it: 'Comprimi, unisci, dividi e converti PDF senza installare software.'
    }
  },
  {
    id: 'images',
    icon: 'Image',
    count: 18,
    name: {
      es: 'Imágenes y Fotos',
      en: 'Images & Photos',
      pt: 'Imagens e Fotos',
      fr: 'Images et Photos',
      de: 'Bilder & Fotos',
      it: 'Immagini e Foto'
    },
    description: {
      es: 'Comprime, redimensiona, recorta y convierte formatos JPG, PNG, WebP y genera favicons.',
      en: 'Compress, resize, crop, and convert JPG, PNG, WebP formats, and create favicons.',
      pt: 'Comprima, redimensione e converta imagens JPG, PNG e WebP com rapidez.',
      fr: 'Compressez, redimensionnez et convertissez vos images facilement.',
      de: 'Bilder komprimieren, Größe anpassen und in WebP konvertieren.',
      it: 'Comprimi, ridimensiona e converti immagini JPG, PNG e WebP.'
    }
  },
  {
    id: 'text',
    icon: 'AlignLeft',
    count: 17,
    name: {
      es: 'Texto y Análisis',
      en: 'Text & Analysis',
      pt: 'Texto e Análise',
      fr: 'Texte et Analyse',
      de: 'Text & Analyse',
      it: 'Testo e Analisi'
    },
    description: {
      es: 'Contador de palabras, comparador de textos, conversor de mayúsculas y formateadores.',
      en: 'Word counter, text comparison diff, case converter, and formatting utilities.',
      pt: 'Contador de palavras, comparador de texto e formatadores rápidos.',
      fr: 'Compteur de mots, comparaison de textes et outils de mise en forme.',
      de: 'Wortzähler, Textvergleich und Formatierungswerkzeuge.',
      it: 'Conteggio parole, confronto testi e formattazione rapida.'
    }
  },
  {
    id: 'qr',
    icon: 'QrCode',
    count: 10,
    name: {
      es: 'Códigos QR',
      en: 'QR Codes',
      pt: 'Códigos QR',
      fr: 'Codes QR',
      de: 'QR-Codes',
      it: 'Codici QR'
    },
    description: {
      es: 'Genera códigos QR de alta resolución para enlaces, redes WiFi, textos y contactos.',
      en: 'Generate high-res QR codes for web links, WiFi networks, text, and contacts.',
      pt: 'Crie códigos QR para links, redes WiFi, textos e cartões de contato.',
      fr: 'Générez des codes QR pour liens, réseaux WiFi, textes et contacts.',
      de: 'QR-Codes für URLs, WLAN-Netzwerke, Kontakte und Text erstellen.',
      it: 'Genera codici QR per URL, WiFi, contatti e testo in alta risoluzione.'
    }
  },
  {
    id: 'productivity',
    icon: 'CheckCircle',
    count: 12,
    name: {
      es: 'Productividad',
      en: 'Productivity',
      pt: 'Produtividade',
      fr: 'Productivité',
      de: 'Produktivität',
      it: 'Produttività'
    },
    description: {
      es: 'Generador de contraseñas seguras, diferencias de fechas, cronómetros y temporizadores.',
      en: 'Secure password generator, date differences, countdowns, and timers.',
      pt: 'Gerador de senhas seguras, cálculo de datas e ferramentas de foco.',
      fr: 'Générateur de mots de passe, calcul de dates et minuteurs.',
      de: 'Sichere Passwörter generieren, Datumsdifferenzen und Timer.',
      it: 'Generatore di password sicure, calcolo date e strumenti di produttività.'
    }
  },
  {
    id: 'developer',
    icon: 'Code',
    count: 14,
    name: {
      es: 'Desarrollador',
      en: 'Developer',
      pt: 'Desenvolvedor',
      fr: 'Développeur',
      de: 'Entwickler',
      it: 'Sviluppatore'
    },
    description: {
      es: 'Formateador de JSON, codificador Base64, URL encoder y herramientas técnicas.',
      en: 'JSON formatter, Base64 encoder/decoder, URL encoder, and technical tools.',
      pt: 'Formatador JSON, codificador Base64 e ferramentas web essenciais.',
      fr: 'Formateur JSON, encodeur Base64 et outils pour développeurs.',
      de: 'JSON-Formatierer, Base64-Konverter und URL-Kodierung.',
      it: 'Formattatore JSON, codificatore Base64 e strumenti per programmatori.'
    }
  },
  {
    id: 'students',
    icon: 'GraduationCap',
    count: 10,
    name: {
      es: 'Estudiantes',
      en: 'Students',
      pt: 'Estudantes',
      fr: 'Étudiants',
      de: 'Studenten',
      it: 'Studenti'
    },
    description: {
      es: 'Convertidor de unidades, regla de tres, promedio de notas y cálculos de estudio.',
      en: 'Unit converter, rule of three, grade average, and academic calculators.',
      pt: 'Conversor de unidades, regra de três e cálculos para estudos.',
      fr: 'Convertisseur d’unités, règle de trois et calculs scolaires.',
      de: 'Einheitenumrechner, Dreisatz und Notendurchschnitt.',
      it: 'Convertitore di unità, regola del tre e strumenti di studio.'
    }
  },
  {
    id: 'business',
    icon: 'Briefcase',
    count: 8,
    name: {
      es: 'Negocios',
      en: 'Business',
      pt: 'Negócios',
      fr: 'Entreprise',
      de: 'Geschäft',
      it: 'Business'
    },
    description: {
      es: 'Cálculo de márgenes, impuestos, descuentos y herramientas para pequeñas empresas.',
      en: 'Margin calculations, taxes, discounts, and utilities for small businesses.',
      pt: 'Cálculo de margens, impostos, descontos e utilitários para negócios.',
      fr: 'Calculs de marges, taxes, remises et outils pour entreprises.',
      de: 'Margenrechner, Steuer, Rabatte und Kleinunternehmer-Tools.',
      it: 'Calcolo margini, imposte, sconti e strumenti per professionisti.'
    }
  }
];
