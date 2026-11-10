import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { AssessClaimDto } from './dto/assess-claim.dto';

@Controller('api/claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post('assess')
  @HttpCode(HttpStatus.OK)
  async assessClaim(@Body() dto: AssessClaimDto) {
    return this.claimsService.assessClaim(dto);
  }

  @Get()
  async getClaims() {
    return this.claimsService.getAllClaims();
  }
}

