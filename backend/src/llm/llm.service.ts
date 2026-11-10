import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

export const ClaimAssessmentSchema = z.object({
  isJustified: z.boolean().describe('True if clinical data strictly and statistically justifies the exact claim wording'),
  confidenceScore: z.number().min(0).max(1).describe('Confidence score between 0.0 and 1.0 reflecting evidential certainty'),
  verdictCategory: z.enum(['JUSTIFIED', 'PARTIALLY_JUSTIFIED', 'NOT_JUSTIFIED']),
  executiveSummary: z.string().describe('Concise 2-3 sentence verdict explanation for R&I leaders'),
  statisticalAlignment: z.string().describe('Evaluation of sample size, p-values, standard deviation, and measured delta vs claimed delta'),
  methodologyGaps: z.array(z.string()).describe('List of flaws, missing controls, or insufficient trial parameters'),
  regulatoryRiskAlerts: z.array(z.string()).describe('Potential compliance violations under EU 655/2013 or FDA cosmetic boundaries'),
});

export type ClaimAssessmentOutput = z.infer<typeof ClaimAssessmentSchema>;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly openai: OpenAI | null = null;
  private readonly modelName = 'gpt-4o-2024-08-06';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 10 && apiKey !== 'mock') {
      this.openai = new OpenAI({ apiKey });
      this.logger.log(`Initialized OpenAI client with model: ${this.modelName}`);
    } else {
      this.logger.warn('No active OPENAI_API_KEY found. Running in Scientific Heuristic Evaluator (Mock) mode.');
    }
  }

  async evaluateClaimJustification(claimText: string, evidenceText: string): Promise<{
    result: ClaimAssessmentOutput;
    tokensUsed: number;
    model: string;
  }> {
    // 1. If OpenAI API Key is configured, execute live LLM call with structured output
    if (this.openai) {
      return this.callOpenAiStructuredOutput(claimText, evidenceText);
    }

    // 2. Otherwise, run the built-in deterministic scientific audit engine
    return this.runScientificHeuristicEvaluation(claimText, evidenceText);
  }

  private async callOpenAiStructuredOutput(claimText: string, evidenceText: string): Promise<{
    result: ClaimAssessmentOutput;
    tokensUsed: number;
    model: string;
  }> {
    const systemPrompt = `
You are the Lead Scientific & Regulatory Claims Evaluator at L'Oréal Research & Innovation (Paris).
Your task is to impartially audit whether a proposed cosmetic claim is scientifically, statistically,
and legally justified by the attached clinical trial study report under EU Regulation 655/2013.

Evaluation Criteria:
1. QUANTITATIVE PARITY: If the claim states "Reduces wrinkles by 20%", the study must demonstrate a mean improvement >= 20% against baseline or control.
2. STATISTICAL RIGOR: Results must be statistically significant (p < 0.05). If p >= 0.05 or is omitted, flag as NOT_JUSTIFIED or PARTIALLY_JUSTIFIED.
3. TIMEFRAME & COHORT: The duration (e.g., 4 weeks) and subject cohort in the study must match the claim scope.
4. INSTRUMENTAL ACCURACY: Objective instrumental measures (e.g., Primos 3D profilometry, cutometry) carry higher evidential weight than subjective self-evaluations.
5. ZERO TOLERANCE FOR OVER-CLAIMING: Reject claims asserting physiological drug-like actions (e.g. "alters cellular DNA") rather than cosmetic appearance improvement.

Be skeptical, objective, and precise. Never assume data that is not explicitly present.
`;

    const userPrompt = `
PROPOSED CLAIM:
"${claimText}"

CLINICAL STUDY EVIDENCE / REPORT:
"""
${evidenceText}
"""
`;

    try {
      this.logger.log(`Calling OpenAI API for claim evaluation...`);
      const response = await this.openai!.beta.chat.completions.parse({
        model: this.modelName,
        temperature: 0.0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: zodResponseFormat(ClaimAssessmentSchema, 'claim_assessment'),
      });

      const parsed = response.choices[0].message.parsed;
      if (!parsed) {
        throw new Error('LLM failed to return structured JSON matching schema');
      }

      return {
        result: parsed,
        tokensUsed: response.usage?.total_tokens ?? 0,
        model: this.modelName,
      };
    } catch (err: any) {
      this.logger.error(`OpenAI structured output failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`AI Assessment failed: ${err.message}`);
    }
  }

  /**
   * Scientific Heuristic Evaluator
   * Provides deterministic, rubric-based analysis when running locally without an OpenAI API key.
   */
  private runScientificHeuristicEvaluation(claimText: string, evidenceText: string): Promise<{
    result: ClaimAssessmentOutput;
    tokensUsed: number;
    model: string;
  }> {
    this.logger.log('Executing deterministic scientific evaluation rule-set...');

    const lowerEvidence = evidenceText.toLowerCase();
    const lowerClaim = claimText.toLowerCase();

    // 1. Extract claim percentage (e.g. "20%")
    const claimPercentMatch = claimText.match(/(\d+(?:\.\d+)?)%/);
    const targetPercent = claimPercentMatch ? parseFloat(claimPercentMatch[1]) : null;

    // 2. Extract measured percentage in evidence (e.g. "21.4%")
    const evidencePercentMatches = Array.from(evidenceText.matchAll(/(\d+(?:\.\d+)?)%/g)).map((m) =>
      parseFloat(m[1]),
    );
    const maxMeasuredPercent = evidencePercentMatches.length > 0 ? Math.max(...evidencePercentMatches) : null;

    // 3. Statistical significance check (p < 0.05)
    const pValueMatch = evidenceText.match(/p\s*([<=\s])\s*(\d+(?:\.\d+)?)/i);
    let isSignificant = false;
    let pValStr = 'not reported';
    if (pValueMatch) {
      const operator = pValueMatch[1].trim();
      const val = parseFloat(pValueMatch[2]);
      pValStr = `${operator} ${val}`;
      if (operator === '<' && val <= 0.05) isSignificant = true;
      if (operator === '=' && val < 0.05) isSignificant = true;
    }

    // 4. Sample size check
    const sampleSizeMatch = evidenceText.match(/(?:N\s*=\s*|sample\s*size\s*(?:of\s*)?)(\d+)/i);
    const sampleSize = sampleSizeMatch ? parseInt(sampleSizeMatch[1], 10) : null;

    // 5. Check instrumental vs subjective
    const hasInstrumental =
      lowerEvidence.includes('profilometry') ||
      lowerEvidence.includes('primos') ||
      lowerEvidence.includes('corneometry') ||
      lowerEvidence.includes('cutometry') ||
      lowerEvidence.includes('instrumental');

    // 6. Check duration alignment (e.g. "4 weeks" vs "28 days")
    const durationMatch =
      (lowerClaim.includes('4 weeks') && (lowerEvidence.includes('28 days') || lowerEvidence.includes('4 weeks'))) ||
      (lowerClaim.includes('8 weeks') && lowerEvidence.includes('8 weeks'));

    // Compile evaluation verdict
    const methodologyGaps: string[] = [];
    const regulatoryRiskAlerts: string[] = [];

    if (!isSignificant) {
      methodologyGaps.push(`Statistical significance not demonstrated (reported p-value: ${pValStr}). Clinical trials require p < 0.05.`);
    }

    if (sampleSize && sampleSize < 30) {
      methodologyGaps.push(`Sample size cohort (N = ${sampleSize}) is below recommended regulatory threshold (N >= 30) for instrumental anti-wrinkle claims.`);
    }

    if (!hasInstrumental) {
      methodologyGaps.push('Evidence relies primarily on subjective evaluation rather than validated bio-instrumental measurements (e.g. optical 3D profilometry).');
    }

    if (lowerClaim.includes('reverses aging') || lowerClaim.includes('eliminates wrinkles') || lowerClaim.includes('cellular dna repair')) {
      regulatoryRiskAlerts.push('EU 655/2013 Violation Risk: Absolute claims ("eliminates", "reverses aging") or claims asserting physiological drug actions exceed cosmetic boundaries.');
    }

    // Determine Justification
    let isJustified = false;
    let verdictCategory: 'JUSTIFIED' | 'PARTIALLY_JUSTIFIED' | 'NOT_JUSTIFIED' = 'NOT_JUSTIFIED';
    let confidenceScore = 0.35;

    const meetsQuantity = targetPercent === null || (maxMeasuredPercent !== null && maxMeasuredPercent >= targetPercent);

    if (isSignificant && meetsQuantity && methodologyGaps.length === 0) {
      isJustified = true;
      verdictCategory = 'JUSTIFIED';
      confidenceScore = 0.94;
    } else if (isSignificant && meetsQuantity) {
      isJustified = false;
      verdictCategory = 'PARTIALLY_JUSTIFIED';
      confidenceScore = 0.68;
    } else if (meetsQuantity && !isSignificant) {
      isJustified = false;
      verdictCategory = 'PARTIALLY_JUSTIFIED';
      confidenceScore = 0.52;
    } else {
      isJustified = false;
      verdictCategory = 'NOT_JUSTIFIED';
      confidenceScore = 0.28;
    }

    const summary = isJustified
      ? `The clinical study provides statistically significant (p ${pValStr}) and robust instrumental evidence supporting the claimed reduction (${maxMeasuredPercent}% measured vs ${targetPercent}% claimed) over the specified trial timeframe.`
      : verdictCategory === 'PARTIALLY_JUSTIFIED'
      ? `While the empirical measurements show directional efficacy (${maxMeasuredPercent || 'N/A'}%), methodological gaps or cohort limitations prevent unconditional substantiation under EU 655/2013.`
      : `The submitted clinical data does not justify the claim. Target efficacy thresholds were either unmet, lacking statistical significance, or suffering from critical methodological omissions.`;

    const statisticalAlignment = `Target claim: ${targetPercent ? targetPercent + '%' : 'unspecified'}. Observed clinical endpoint: ${
      maxMeasuredPercent ? maxMeasuredPercent + '%' : 'not detected'
    }. Statistical significance: p ${pValStr}. Sample cohort: N = ${sampleSize || 'not specified'}. Trial duration match: ${
      durationMatch ? 'Verified' : 'Unconfirmed'
    }.`;

    return Promise.resolve({
      result: {
        isJustified,
        confidenceScore,
        verdictCategory,
        executiveSummary: summary,
        statisticalAlignment,
        methodologyGaps,
        regulatoryRiskAlerts,
      },
      tokensUsed: 680,
      model: 'loreal-heuristic-evaluator-v1 (fallback)',
    });
  }
}

