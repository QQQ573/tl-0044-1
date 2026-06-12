import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIntOptionalPipe implements PipeTransform<string, number | undefined> {
  transform(value: string): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const val = parseInt(value, 10);
    return isNaN(val) ? undefined : val;
  }
}
