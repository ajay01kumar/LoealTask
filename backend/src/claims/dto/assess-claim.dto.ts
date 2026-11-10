import { IsString, IsNotEmpty, IsUUID, IsOptional, MinLength } from 'class-validator';

export class AssessClaimDto {
  @IsUUID('4', { message: 'claimId must be a valid UUID v4' })
  @IsNotEmpty({ message: 'claimId is required' })
  claimId: string;

  @IsString()
  @IsNotEmpty({ message: 'claimText is required' })
  @MinLength(10, { message: 'claimText must be at least 10 characters long' })
  claimText: string;

  @IsString()
  @IsNotEmpty({ message: 'clinicalEvidence is required' })
  @MinLength(30, { message: 'clinicalEvidence must contain sufficient study methodology details (min 30 characters)' })
  clinicalEvidence: string;

  @IsString()
  @IsOptional()
  protocolNumber?: string;
}

