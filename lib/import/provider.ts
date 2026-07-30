import type { ImportPreview } from "@/lib/types";

export interface ProviderAdapter<TInput> {
  readonly id: ImportPreview["provider"];
  preview(input: TInput): Promise<ImportPreview>;
}

export class ImportProviderError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "ImportProviderError";
  }
}
