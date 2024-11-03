'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { uploadFormSchema, type UploadFormValues } from '@/lib/schemas/upload';
import { useAction } from "next-safe-action/hooks";
import { analyzeDocument } from "@/lib/actions/analyze";

export function UploadForm() {
	const [progress, setProgress] = useState(0);
	const [isAnalyzing, setIsAnalyzing] = useState(false);

	const form = useForm<UploadFormValues>({
		resolver: zodResolver(uploadFormSchema),
		defaultValues: {
			file: undefined,
			summaryType: 'flash',
		},
	});

	const { executeAsync, result, status } = useAction(analyzeDocument);

	async function onSubmit(values: UploadFormValues) {
		try {
			setIsAnalyzing(true);
			setProgress(0);

			// Simulation de la progression
			const progressInterval = setInterval(() => {
				setProgress((prev) => Math.min(prev + 1, 95));
			}, 500);

			const actionResult = await executeAsync(values);
			clearInterval(progressInterval);
			setProgress(100);

			if (actionResult?.data?.success && actionResult?.data.pdf) {
				// Téléchargement du PDF
				const pdfBlob = new Blob(
					[Buffer.from(actionResult.data.pdf, 'base64')],
					{
					type: 'application/pdf',
				});
				const url = window.URL.createObjectURL(pdfBlob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'resume.pdf';
				a.click();
				window.URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error('Error:', error);
		} finally {
			setIsAnalyzing(false);
		}
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			form.setValue('file', e.target.files[0]);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
				<FormField
					control={form.control}
					name='file'
					render={() => (
						<FormItem>
							<FormControl>
								<div className='grid w-full max-w-lg gap-4'>
									<div className='flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-blue-600 transition-colors'>
										<svg
											className='mx-auto h-12 w-12 text-gray-400'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
											/>
										</svg>
										<div className='mt-4 flex text-sm text-gray-600'>
											<label className='relative cursor-pointer rounded-md font-medium text-blue-600 focus-within:outline-none'>
												<span>Uploadez un fichier</span>
												<Input
													type='file'
													className='sr-only'
													accept='.pdf,.epub'
													onChange={handleFileChange}
												/>
											</label>
											<p className='pl-1'>ou glissez-déposez</p>
										</div>
										<p className='text-xs text-gray-500'>
											PDF ou EPUB jusqu'à 10MB
										</p>
									</div>
									{progress > 0 && (
										<div className='w-full space-y-2'>
											<Progress
												value={progress}
												className='w-full'
											/>
											<p className='text-sm text-gray-600 text-center'>
												{progress}%{' '}
												{progress === 100
													? 'Terminé'
													: "En cours d'analyse"}
											</p>
										</div>
									)}
									<Button type='submit' disabled={isAnalyzing}>
										{isAnalyzing
											? 'Analyse en cours...'
											: 'Analyser le document'}
									</Button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='summaryType'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Type de résumé</FormLabel>
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									defaultValue={field.value}
									className='grid grid-cols-3 gap-4'>
									<FormItem className='flex gap-1 items-center'>
										<FormControl>
											<RadioGroupItem value='flash' id='flash' />
										</FormControl>
										<FormLabel htmlFor='flash'>
											Résumé éclair (1 page)
										</FormLabel>
									</FormItem>
									<FormItem className='flex gap-1 items-center'>
										<FormControl>
											<RadioGroupItem
												value='detailed'
												id='detailed'
											/>
										</FormControl>
										<FormLabel htmlFor='detailed'>
											Résumé détaillé (5 pages)
										</FormLabel>
									</FormItem>
									<FormItem className='flex gap-1 items-center'>
										<FormControl>
											<RadioGroupItem value='extra' id='extra' />
										</FormControl>
										<FormLabel htmlFor='extra'>
											Résumé extra (15 pages)
										</FormLabel>
									</FormItem>
								</RadioGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}
