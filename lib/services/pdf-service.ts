import { PDFDocument, StandardFonts } from 'pdf-lib';
import PDFParser from 'pdf-parse';

interface PDFMetadata {
  pages: number;
  title: string;
  author: string;
}

export async function parsePDF(file: Buffer) {
  try {
    // Utiliser pdf-parse pour extraire le texte et les métadonnées
    const pdfData = await PDFParser(file);
    
    // Découpage en sections de ~1000 mots
    const words = pdfData.text.split(/\s+/).filter(Boolean);
    const sections = [];
    let currentSection = [];
    
    for (const word of words) {
      currentSection.push(word);
      if (currentSection.length >= 1000) {
        sections.push(currentSection.join(' '));
        currentSection = [];
      }
    }
    
    if (currentSection.length > 0) {
      sections.push(currentSection.join(' '));
    }

    // Extraire les métadonnées
    const metadata: PDFMetadata = {
      pages: pdfData.numpages,
      title: pdfData.info?.Title || 'Document sans titre',
      author: pdfData.info?.Author || 'Auteur inconnu'
    };
    
    return { sections, metadata };
  } catch (error) {
    console.error('Erreur lors du parsing du PDF:', error);
    throw new Error('Impossible de lire le fichier PDF');
  }
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