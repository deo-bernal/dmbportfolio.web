import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography component="h3" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography component="p" sx={{ color: "#64748b", m: 0 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
