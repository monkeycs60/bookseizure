"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Progress } from "@/components/ui/progress"

const formSchema = z.object({
  file: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Le fichier est requis.")
    .transform((files) => files[0])
    .refine(
      (file) => file?.type === "application/pdf" || file?.type === "application/epub+zip",
      "Seuls les fichiers PDF et EPUB sont acceptés."
    )
    .refine((file) => file?.size <= 10000000, `La taille maximum est de 10MB.`),
})

export function UploadForm() {
  const [progress, setProgress] = useState(0)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Simulation du progrès d'upload
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return prev
        }
        return prev + 5
      })
    }, 100)
    
    // Ici viendra la logique d'upload réelle
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange }, ...field }) => (
            <FormItem>
              <FormControl>
                <div className="grid w-full max-w-lg gap-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-blue-600 transition-colors">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div className="mt-4 flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-600 focus-within:outline-none">
                        <span>Uploadez un fichier</span>
                        <Input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.epub"
                          onChange={(e) => {
                            onChange(e.target.files)
                          }}
                          {...field}
                        />
                      </label>
                      <p className="pl-1">ou glissez-déposez</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF ou EPUB jusqu'à 10MB</p>
                  </div>
                  {progress > 0 && (
                    <div className="w-full space-y-2">
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-gray-600 text-center">{progress}% uploadé</p>
                    </div>
                  )}
                  <Button type="submit">Analyser le document</Button>
                </div>
              </FormControl>
              <FormMessage />
              <FormDescription>
                Votre document sera analysé par notre IA pour en extraire les points essentiels.
              </FormDescription>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
} 