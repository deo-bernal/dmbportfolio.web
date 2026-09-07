import { Box, Grid, Stack, Typography } from "@mui/material";
import {
  AI_FREE_TIER_HEADLINE,
  AI_FREE_TIER_PERFORMANCE,
  AI_FREE_TIER_TRADEOFFS,
  AI_MODELS_IN_USE,
} from "content/aiFreeTier";
import { showcaseSx } from "styles/main_style";

export default function FreeTierNotice() {
  return (
    <Box sx={showcaseSx.section} id="ai-models">
      <Typography sx={showcaseSx.kicker}>Models and tier</Typography>
      <Typography component="h2" sx={showcaseSx.sectionTitle}>
        {AI_FREE_TIER_HEADLINE}
      </Typography>
      <Stack spacing={1.5}>
        <Typography sx={showcaseSx.sectionBody}>{AI_FREE_TIER_PERFORMANCE}</Typography>
        <Typography sx={showcaseSx.sectionBody}>{AI_FREE_TIER_TRADEOFFS}</Typography>
      </Stack>

      <Grid container spacing={2.5} sx={{ mt: 2.5 }}>
        {AI_MODELS_IN_USE.map((model) => (
          <Grid key={model.name} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={showcaseSx.card}>
              <Typography sx={showcaseSx.metricLabel}>{model.tier}</Typography>
              <Typography component="h3" sx={[showcaseSx.cardTitle, { mt: 0.5 }]}>
                {model.name}
              </Typography>
              <Typography sx={showcaseSx.cardBody}>{model.provider}</Typography>
              <Typography sx={[showcaseSx.cardBody, { mt: 1 }]}>{model.usedFor}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
