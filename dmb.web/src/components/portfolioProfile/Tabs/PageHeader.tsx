import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { agenticPageSx } from "styles/main_style";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <Box sx={agenticPageSx.pageHeaderWrap}>
      <Typography component="h3" sx={agenticPageSx.pageHeaderTitle}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography component="p" sx={agenticPageSx.pageHeaderSubtitle}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
