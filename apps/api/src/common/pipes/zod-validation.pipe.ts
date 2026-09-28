import {
  BadRequestException,
  type ArgumentMetadata,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import type { z } from "zod";

@Injectable()
export class ZodValidationPipe<T extends z.ZodType>
  implements PipeTransform<unknown, z.infer<T>>
{
  constructor(private readonly schema: T) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== "body") return value as z.infer<T>;

    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Dados inválidos",
        issues: result.error.issues.map((issue) => ({
          path: issue.path,
          code: issue.code,
        })),
      });
    }
    return result.data;
  }
}
