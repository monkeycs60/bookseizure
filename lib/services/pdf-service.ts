import { PDFDocument, StandardFonts } from 'pdf-lib';
import PDFParser from 'pdf-parse';

interface PDFMetadata {
  pages: number;
  title: string;
  author: string;
}

export async function parsePDF(file: Buffer) {
  // Utiliser pdf-parse pour extraire le texte
  const pdfData = await PDFParser(file);
  const text = pdfData.text;
  
  // Découpage en sections de ~1000 mots
  const words = text.split(/\s+/);
  const sections = [];
  let currentSection = [];
  
  for (const word of words) {
    if (word) {
      currentSection.push(word);
      if (currentSection.length >= 1000) {
        sections.push(currentSection.join(' '));
        currentSection = [];
      }
    }
  }
  
  if (currentSection.length > 0) {
    sections.push(currentSection.join(' '));
  }

  // Utiliser pdf-lib pour les métadonnées
  const pdfDoc = await PDFDocument.load(file);
  
  return {
    sections,
    metadata: {
      pages: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || 'Document sans titre',
      author: pdfDoc.getAuthor() || 'Auteur inconnu'
    } as PDFMetadata
  };
}

export async function createSummaryPDF(summary: string, metadata: PDFMetadata): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage();
  
  // En-tête
  page.setFont(timesRomanFont);
  page.setFontSize(20);
  page.drawText('Résumé par Book Leizure', {
    x: 50,
    y: page.getHeight() - 50,
    size: 20
  });
  
  page.drawText(`Titre original : ${metadata.title}`, {
    x: 50,
    y: page.getHeight() - 100,
    size: 14
  });
  
  page.drawText(`Auteur : ${metadata.author}`, {
    x: 50,
    y: page.getHeight() - 120,
    size: 12
  });
  
  // Contenu
  const contentLines = summary.split('\n');
  let yPosition = page.getHeight() - 160;
  let currentPage = page;
  
  for (const line of contentLines) {
    if (yPosition < 50) {
      // Ajouter une nouvelle page si nécessaire
      currentPage = pdfDoc.addPage();
      currentPage.setFont(timesRomanFont);
      yPosition = currentPage.getHeight() - 50;
    }
    
    currentPage.drawText(line, {
      x: 50,
      y: yPosition,
      size: 12,
      maxWidth: currentPage.getWidth() - 100
    });
    
    yPosition -= 15; // Espacement entre les lignes
  }
  
  return pdfDoc.save();
} 