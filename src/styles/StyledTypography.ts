import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

export const BlockTitle = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  fontWeight: 500,
  fontSize: "1.25rem",
  [theme.breakpoints.up("md")]: {
    margin: theme.spacing(3, 0),
    fontSize: "1.5rem",
  },
}));

export const MainTitle = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(3, 0),
  fontWeight: 500,
  fontSize: "1.5rem",
  [theme.breakpoints.up("md")]: {
    fontSize: "1.75rem",
  },
  [`&.MuiTypography-h4`]: {
    marginTop: theme.spacing(1),
    fontSize: theme.typography.h4.fontSize,
    [theme.breakpoints.up("md")]: {
      fontSize: `calc(${theme.typography.h4.fontSize} * 1.1)`, // Slightly larger on bigger screens
    },
  },
  [`&.MuiTypography-h5`]: {
    fontSize: theme.typography.h5.fontSize,
    [theme.breakpoints.up("md")]: {
      fontSize: `calc(${theme.typography.h5.fontSize} * 1.1)`,
    },
  },
  [`&.MuiTypography-h6`]: {
    fontSize: theme.typography.h6.fontSize,
    [theme.breakpoints.up("md")]: {
      fontSize: `calc(${theme.typography.h6.fontSize} * 1.1)`,
    },
  },
}));

export const ContactBlock = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(1.5, 0),
  paddingLeft: theme.spacing(3),
  borderLeft: `2px solid ${theme.palette.text.secondary}`,
  fontStyle: "italic",
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(4),
  },
}));

// Styled component for rich text translations (ensures spacing & prevents nesting issues)
export const RichText = styled("div")(({ theme }) => ({
  marginBottom: theme.spacing(2),
  ...theme.typography.body1,
  "& p": {
    ...theme.typography.body1,
    marginBottom: theme.spacing(1), // Ensures spacing between paragraphs
  },
}));
