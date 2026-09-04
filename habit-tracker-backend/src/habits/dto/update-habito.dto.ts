import { PartialType } from '@nestjs/mapped-types';
import { CreateHabitoDto } from './create-habito.dto';

export class UpdateHabitoDto extends PartialType(CreateHabitoDto) {}