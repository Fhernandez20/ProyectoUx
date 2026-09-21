import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/**
 * Valida que un parámetro de ruta sea un ObjectId de MongoDB (24 caracteres
 * hexadecimales). Sin esto, un id mal formado llega a Prisma, que lanza un error
 * y la API responde 500 en lugar de un 400 claro.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !OBJECT_ID.test(value)) {
      throw new BadRequestException('El identificador no es válido');
    }
    return value;
  }
}
