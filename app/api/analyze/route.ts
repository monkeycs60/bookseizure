import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { parsePDF, createSummaryPDF } from '@/lib/services/pdf-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	try {
		console.log('Request headers:', Object.fromEntries(req.headers));

		const formData = await req.formData();
		console.log('FormData received, entries:');
		for (const [key, value] of formData.entries()) {
			console.log(key, typeof value, value);
		}

		const file = formData.get('file') as File | null;
		const summaryType = formData.get('summaryType') as string | null;

		console.log(
			'File details:',
			file
				? {
						name: file.name,
						type: file.type,
						size: file.size,
				  }
				: 'No file'
		);

		if (!file) {
			return NextResponse.json(
				{ error: "Aucun fichier n'a été fourni" },
				{ status: 400 }
			);
		}

		if (!summaryType) {
			return NextResponse.json(
				{ error: 'Type de résumé non spécifié' },
				{ status: 400 }
			);
		}
		// const formData = await req.formData();
		// console.log('formData', formData);
		// const file = formData.get('file') as File;
		// console.log('file', file);
		// const summaryType = formData.get('summaryType') as string;
		// console.log('summaryType', summaryType);

		// Conversion du fichier en buffer
		const buffer = Buffer.from(await file.arrayBuffer());
		console.log('buffer', buffer);

		// Analyse du PDF
		const { sections, metadata } = await parsePDF(buffer);
		console.log('sections', sections);
		console.log('metadata', metadata);

		// Définir la longueur du résumé selon le type
		const summaryLengths = {
			flash: 'environ 1 page (500 mots)',
			detailed: 'environ 5 pages (2500 mots)',
			extra: 'environ 15 pages (7500 mots)',
		};

		const result = await streamText({
			model: anthropic('claude-3-haiku-20240307'),
			messages: [
				{
					role: 'system',
					content: 'Tu es un expert en analyse et synthèse de livres.',
				},
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: `Analyse ce texte et crée un résumé structuré en ${
								summaryLengths[
									summaryType as keyof typeof summaryLengths
								]
							}. 
              Le résumé doit inclure :
              - Les points clés
              - Les idées principales
              - Les conclusions importantes
              
              Texte à analyser : ${sections.join('\n\n')}`,
						},
					],
				},
			],
		});
		console.log('result', result);

		let summary = '';
		for await (const chunk of result.textStream) {
			summary += chunk;
		}

		// Création du PDF
		const pdfBytes = await createSummaryPDF(summary, metadata);
		console.log('pdfBytes', pdfBytes);

		// Retourner le résumé et le PDF
		return new Response(
			JSON.stringify({
				summary,
				pdf: Buffer.from(pdfBytes).toString('base64'),
			}),
			{
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Error:', error);
		return new Response(
			JSON.stringify({ error: "Une erreur est survenue lors de l'analyse" }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}
