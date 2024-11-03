import * as z from 'zod';

export const uploadFormSchema = z.object({
	file: z
		.instanceof(File, { message: 'Le fichier est requis' })
		.refine(
			(file) => file.type === 'application/pdf',
			'Seuls les fichiers PDF sont acceptés pour le moment.'
		)
		.refine(
			(file) => file.size <= 10000000,
			'La taille maximum est de 10MB.'
		),
	summaryType: z.enum(['flash', 'detailed', 'extra'], {
		required_error: 'Veuillez sélectionner un type de résumé',
	}),
});

export type UploadFormValues = z.infer<typeof uploadFormSchema>;
