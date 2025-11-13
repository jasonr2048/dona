import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";

interface ColorScaleProps {
  colors: string[];
  labels: string[];
}

const ColorScale: React.FC<ColorScaleProps> = ({ colors, labels }) => {
  return (
    <Box
      my="auto"
      sx={{
        height: "87.5%",
        width: "15%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        minWidth: "20px",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "40px",
          height: "100%",
          my: "auto",
          background: `linear-gradient(to bottom, ${colors.join(", ")})`,
          position: "relative",
        }}
      >
        {/* Labels overlapping the color scale */}
        {labels.map((label, index) => (
          <Typography
            key={index}
            variant="caption"
            sx={{
              lineHeight: 1,
              position: "absolute",
              top: `${(index / (labels.length - 1)) * 70 + 30 / (labels.length - 1)}%`, // TODO Calculate
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(255, 255, 255, 0.6)", // Light background for readability
              padding: "2px 4px",
              borderRadius: "4px",
              fontSize: "10px",
              textAlign: "center",
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default ColorScale;
