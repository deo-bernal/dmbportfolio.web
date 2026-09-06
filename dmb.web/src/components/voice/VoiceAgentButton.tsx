import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { Button, Stack, Typography } from "@mui/material";
import { accentRedContainedButtonSx, showcaseSx } from "styles/main_style";

const VOICE_AGENT_URL = process.env.REACT_APP_VOICE_AGENT_URL || "";
const VOICE_AGENT_PHONE = process.env.REACT_APP_VOICE_AGENT_PHONE || "";

/**
 * The voice agent lives on a provider (Vapi / Retell) rather than in this bundle,
 * so it is exposed as a web demo link or a dialable number. With neither
 * configured, the section stays honest instead of showing a dead button.
 */
export default function VoiceAgentButton() {
  const href = VOICE_AGENT_URL || (VOICE_AGENT_PHONE ? `tel:${VOICE_AGENT_PHONE}` : "");

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
      {href ? (
        <Button
          href={href}
          target={VOICE_AGENT_URL ? "_blank" : undefined}
          rel={VOICE_AGENT_URL ? "noopener noreferrer" : undefined}
          variant="contained"
          size="large"
          startIcon={<PhoneInTalkOutlinedIcon />}
          sx={[{ textTransform: "none", fontWeight: 700 }, accentRedContainedButtonSx]}
        >
          Talk to the voice agent
        </Button>
      ) : null}

      <Button
        variant="outlined"
        size="large"
        startIcon={<ChatBubbleOutlineIcon />}
        onClick={() => window.dispatchEvent(new Event("dmb:open-chat"))}
        sx={{ textTransform: "none", fontWeight: 600 }}
      >
        Open the chat assistant
      </Button>

      {href ? null : (
        <Typography sx={showcaseSx.codeCaption}>
          Voice agent demo available on request — the chat assistant runs on the same
          knowledge base.
        </Typography>
      )}
    </Stack>
  );
}
