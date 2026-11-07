import React, { useState } from 'react';

interface AssessmentVerdict {
  isJustified: boolean;
  category: 'JUSTIFIED' | 'PARTIALLY_JUSTIFIED' | 'NOT_JUSTIFIED';
  confidenceScore: number;
  summary: string;
  statisticalAlignment: string;
  methodologyGaps: string[];
  regulatoryRiskAlerts: string[];
}

interface ApiResponse {
  success: boolean;
  assessmentId: string;
  claimId: string;
  claimText: string;
  verdict: AssessmentVerdict;
  audit: {
    modelEvaluated: string;
    tokensUsed: number;
    evaluatedAt: string;
  };
}

export const ClaimAssessmentWorkbench: React.FC = () => {
  const [claimId, setClaimId] = useState('c4b12345-6789-4abc-9def-0123456789ab');
  const [claimText, setClaimText] = useState('Reduces wrinkles by 20% in 4 weeks');
  const [clinicalEvidence, setClinicalEvidence] = useState(
    `Study Protocol: CLIN-PARIS-2026-042
Design: Randomized, double-blind, vehicle-controlled clinical trial on 45 healthy female volunteers (age 45-60).
Treatment: Twice-daily topical application of Formula LR-PARIS-2026-F98 for 28 consecutive days.
Results: Quantitative 3D skin roughness analysis (Primos optical profilometry) demonstrated a mean reduction in periorbital wrinkle depth (Rz) of 21.4% at Day 28 compared to baseline (p = 0.003, 95% CI [18.2%, 24.6%]).
The vehicle control group showed a non-significant reduction of 3.1% (p = 0.41).
Tolerance: 100% skin tolerance, 0 erythema, 0 study dropouts.`,
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/claims/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, claimText, clinicalEvidence }),
      });

      if (!response.ok) {
        const errPayload = await response.json();
        throw new Error(errPayload.message || `Server responded with status ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while communicating with the backend.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type: 'valid' | 'borderline' | 'invalid') => {
    if (type === 'valid') {
      setClaimText('Reduces wrinkles by 20% in 4 weeks');
      setClinicalEvidence(
        `Study Protocol: CLIN-PARIS-2026-042\nDesign: Double-blind, vehicle-controlled clinical trial (N=45).\nMethodology: Primos 3D optical profilometry.\nResults: After 28 days, mean periorbital wrinkle depth decreased by 21.4% (p = 0.003). Vehicle control showed 3.1% reduction (p = 0.41).`,
      );
    } else if (type === 'borderline') {
      setClaimText('Reduces wrinkles by 25% in 4 weeks');
      setClinicalEvidence(
        `Study Protocol: CLIN-PARIS-2026-088\nDesign: Open-label study without placebo control (N=18).\nResults: Observed mean wrinkle reduction of 21.0% at Day 28 (p = 0.072). High participant dropout rate (22%).`,
      );
    } else {
      setClaimText('Permanently eliminates wrinkles and reverses cellular aging in 7 days');
      setClinicalEvidence(
        `Study Protocol: CLIN-PARIS-2026-099\nDesign: 5 consumer survey respondents reported feeling their skin was smoother after 3 days. No instrumental measurements were conducted.`,
      );
    }
  };

  const getVerdictStyle = (category: string) => {
    switch (category) {
      case 'JUSTIFIED':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          bar: 'bg-emerald-500',
          text: 'Justified (Scientifically Supported)',
        };
      case 'PARTIALLY_JUSTIFIED':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          bar: 'bg-amber-500',
          text: 'Partially Justified (Caveats Identified)',
        };
      default:
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          bar: 'bg-rose-500',
          text: 'Not Justified (Insufficient Evidence)',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-black text-white rounded">
              L'ORÉAL
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Research & Innovation • Paris
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Claims Intelligence Engine
          </h1>
          <p className="text-sm text-slate-500">
            Automated LLM substantiation audit of cosmetic claims against clinical study reports (EU 655/2013)
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Sample Scenarios:</span>
          <button
            type="button"
            onClick={() => loadPreset('valid')}
            className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition"
          >
            Justified
          </button>
          <button
            type="button"
            onClick={() => loadPreset('borderline')}
            className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded border border-amber-200 transition"
          >
            Borderline
          </button>
          <button
            type="button"
            onClick={() => loadPreset('invalid')}
            className="px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200 transition"
          >
            Invalid Claim
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-6 space-y-4">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100">
              Scientist & Evaluator Submission
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Claim Identifier (UUID)
              </label>
              <input
                type="text"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Proposed Product Claim
              </label>
              <input
                type="text"
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                required
                placeholder="e.g. Reduces wrinkles by 20% in 4 weeks"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Clinical Study Report (CSR) Evidence
              </label>
              <textarea
                value={clinicalEvidence}
                onChange={(e) => setClinicalEvidence(e.target.value)}
                required
                rows={9}
                placeholder="Paste study protocol, sample size (N), biophysical instrumentation, delta percentage, and p-values..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium text-sm flex items-center justify-center transition-all ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-black hover:bg-slate-800 active:scale-[0.99] shadow-sm'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Auditing Evidence via LLM Engine...
                </>
              ) : (
                'Submit for Claim Justification Audit'
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start space-x-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Assessment Result */}
        <div className="lg:col-span-6">
          {!result && !loading && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-white">
              <svg className="w-12 h-12 mb-3 stroke-current text-slate-300" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">No Assessment Loaded</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Submit a claim and clinical evidence on the left or select a sample scenario above to view the structured justification verdict.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[400px] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-full mb-4" />
              <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-64 bg-slate-200 rounded mb-4" />
              <div className="h-20 w-full max-w-md bg-slate-100 rounded" />
            </div>
          )}

          {result && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
              {/* Verdict Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                    Justification Verdict
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                        getVerdictStyle(result.verdict.category).badge
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          getVerdictStyle(result.verdict.category).dot
                        }`}
                      />
                      {getVerdictStyle(result.verdict.category).text}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                    Confidence Score
                  </span>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {(result.verdict.confidenceScore * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Progress Meter */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    getVerdictStyle(result.verdict.category).bar
                  }`}
                  style={{ width: `${result.verdict.confidenceScore * 100}%` }}
                />
              </div>

              {/* Executive Summary */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Scientific Justification Reasoning
                </h3>
                <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed">
                  {result.verdict.summary}
                </p>
              </div>

              {/* Statistical Alignment */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Biostatistical Endpoints & Parity
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                  {result.verdict.statisticalAlignment}
                </p>
              </div>

              {/* Methodology Gaps */}
              {result.verdict.methodologyGaps.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
                    Methodology Gaps Identified
                  </h3>
                  <ul className="list-disc list-inside text-xs text-amber-900 space-y-1 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                    {result.verdict.methodologyGaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regulatory Warnings */}
              {result.verdict.regulatoryRiskAlerts.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
                    Regulatory Risk Warnings (EU 655/2013)
                  </h3>
                  <ul className="list-disc list-inside text-xs text-rose-900 space-y-1 bg-rose-50/70 p-3 rounded-lg border border-rose-200">
                    {result.verdict.regulatoryRiskAlerts.map((alert, idx) => (
                      <li key={idx}>{alert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Audit Metadata Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Model: {result.audit.modelEvaluated}</span>
                <span>Tokens: {result.audit.tokensUsed}</span>
                <span>ID: {result.assessmentId.slice(0, 8)}...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
