import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    h4: { fontSize: "2rem", "@media (max-width:600px)": { fontSize: "1.5rem" } },
    h5: { fontSize: "1.5rem", "@media (max-width:600px)": { fontSize: "1.25rem" } },
    body1: { fontSize: "1rem", "@media (max-width:600px)": { fontSize: "0.875rem" } }
  },
  spacing: 8,
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: "md"
      },
      styleOverrides: {
        root: {
          "@media (max-width:600px)": {
            maxWidth: "sm",
            paddingLeft: "1rem",
            paddingRight: "1rem"
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "@media (max-width:600px)": {
            width: "100%"
          }
        }
      }
    }
  }
});

export default theme;
