import PDFParser from 'pdf-parse';
import PDFDocument from 'pdfkit';

export async function parsePDF(file: Buffer) {
  const data = await PDFParser(file);
  
  // Découpage en sections de ~1000 mots
  const words = data.text.split(' ');
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
  
  return {
    sections,
    metadata: {
      pages: data.numpages,
      title: data.info?.Title || 'Document sans titre',
      author: data.info?.Author || 'Auteur inconnu'
    }
  };
}

export async function createSummaryPDF(summary: string, metadata: any): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    
    // En-tête
    doc.fontSize(20).text('Résumé par Book Leizure', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Titre original : ${metadata.title}`);
    doc.fontSize(12).text(`Auteur : ${metadata.author}`);
    doc.moveDown();
    
    // Contenu
    doc.fontSize(12).text(summary);
    
    doc.end();
  });
} 