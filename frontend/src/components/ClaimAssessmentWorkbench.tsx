import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  AlertTitle,
} from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AnalyticsIcon from '@mui/icons-material/Analytics';

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

  const getVerdictConfig = (category: string) => {
    switch (category) {
      case 'JUSTIFIED':
        return {
          color: 'success' as const,
          label: 'Justified (Scientifically Supported)',
          icon: <CheckCircleIcon fontSize="small" />,
          progressColor: '#10b981',
        };
      case 'PARTIALLY_JUSTIFIED':
        return {
          color: 'warning' as const,
          label: 'Partially Justified (Caveats Identified)',
          icon: <WarningAmberIcon fontSize="small" />,
          progressColor: '#f59e0b',
        };
      default:
        return {
          color: 'error' as const,
          label: 'Not Justified (Insufficient Evidence)',
          icon: <ErrorOutlineIcon fontSize="small" />,
          progressColor: '#ef4444',
        };
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 2 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                label="L'ORÉAL"
                size="small"
                sx={{
                  bgcolor: '#000',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Research & Innovation • Paris
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>
              Claims Intelligence Engine
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Automated scientific and regulatory substantiation audit against EU Regulation 655/2013
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mr: 0.5 }}>
              Scenarios:
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() => loadPreset('valid')}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, fontSize: '0.75rem' }}
            >
              Justified
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => loadPreset('borderline')}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, fontSize: '0.75rem' }}
            >
              Borderline
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => loadPreset('invalid')}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, fontSize: '0.75rem' }}
            >
              Invalid
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Left: Input Form */}
        <Grid item xs={12} lg={6}>
          <Paper
            elevation={0}
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <ScienceIcon color="action" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Scientist & Evaluator Submission
              </Typography>
            </Stack>
            <Divider />

            <TextField
              label="Claim Identifier (UUID)"
              variant="outlined"
              size="small"
              fullWidth
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              required
              InputProps={{
                sx: { fontFamily: 'monospace', fontSize: '0.8rem', bgcolor: '#fafafa' },
              }}
            />

            <TextField
              label="Proposed Product Claim"
              variant="outlined"
              fullWidth
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              required
              placeholder="e.g. Reduces wrinkles by 20% in 4 weeks"
            />

            <TextField
              label="Clinical Study Report (CSR) Evidence"
              variant="outlined"
              fullWidth
              multiline
              rows={9}
              value={clinicalEvidence}
              onChange={(e) => setClinicalEvidence(e.target.value)}
              required
              placeholder="Paste clinical study summary, protocol, statistical delta, and sample size..."
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BiotechIcon />}
              sx={{
                bgcolor: '#000',
                color: '#fff',
                '&:hover': { bgcolor: '#222' },
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              {loading ? 'Auditing Evidence via LLM Engine...' : 'Submit for Claim Justification Audit'}
            </Button>

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <AlertTitle>Assessment Error</AlertTitle>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Right: Assessment Result Display */}
        <Grid item xs={12} lg={6}>
          {!result && !loading && (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 3,
                border: '2px dashed',
                borderColor: 'divider',
                minHeight: 460,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                bgcolor: 'background.paper',
              }}
            >
              <AnalyticsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                No Assessment Loaded
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mt: 1 }}>
                Submit the form on the left or click a sample scenario above to generate an auditable justification report.
              </Typography>
            </Paper>
          )}

          {loading && (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                minHeight: 460,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                bgcolor: 'background.paper',
              }}
            >
              <CircularProgress size={44} sx={{ mb: 3, color: '#000' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Evaluating Biophysical Parity & Statistics...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Auditing against EU Regulation 655/2013 cosmetic criteria
              </Typography>
            </Paper>
          )}

          {result && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
              }}
            >
              {/* Verdict Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Audit Verdict
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      icon={getVerdictConfig(result.verdict.category).icon}
                      label={getVerdictConfig(result.verdict.category).label}
                      color={getVerdictConfig(result.verdict.category).color}
                      variant="outlined"
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    />
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    Confidence Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                    {(result.verdict.confidenceScore * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Box>

              {/* Confidence Progress Meter */}
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={result.verdict.confidenceScore * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getVerdictConfig(result.verdict.category).progressColor,
                    },
                  }}
                />
              </Box>

              {/* Scientific Reasoning */}
              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                    Scientific Justification Reasoning
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'text.primary' }}>
                    {result.verdict.summary}
                  </Typography>
                </CardContent>
              </Card>

              {/* Biostatistical Alignment */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                  Biostatistical Endpoints & Parity
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    bgcolor: '#fafafa',
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: 'text.secondary',
                  }}
                >
                  {result.verdict.statisticalAlignment}
                </Paper>
              </Box>

              {/* Methodology Gaps Alert */}
              {result.verdict.methodologyGaps.length > 0 && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <AlertTitle sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Methodology Gaps Identified</AlertTitle>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem' }}>
                    {result.verdict.methodologyGaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {/* Regulatory Warnings Alert */}
              {result.verdict.regulatoryRiskAlerts.length > 0 && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <AlertTitle sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Regulatory Risk Warnings (EU 655/2013)</AlertTitle>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem' }}>
                    {result.verdict.regulatoryRiskAlerts.map((alert, idx) => (
                      <li key={idx}>{alert}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {/* Audit Footer */}
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                  Model: {result.audit.modelEvaluated}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                  Tokens: {result.audit.tokensUsed}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                  ID: {result.assessmentId.slice(0, 12)}
                </Typography>
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
