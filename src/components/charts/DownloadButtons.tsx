import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { toPng, toSvg } from "html-to-image";
import React from "react";

interface DownloadButtonsProps {
  chartId: string;
  fileNamePrefix: string;
  currentLabel?: string;
  color?: string;
  labelsBelow?: boolean;
}

const DownloadButtons: React.FC<DownloadButtonsProps> = ({ chartId, fileNamePrefix, currentLabel, color = "gray", labelsBelow = false }) => {
  const exportOptions = {
    backgroundColor: "#ffffff",
    padding: 20,
    // Exclude elements with the "download-buttons" class from the chart
    filter: (element: HTMLElement) => !element.classList?.contains("download-buttons")
  };

  const getIconButtonStyle = (hoverContent: string) => ({
    position: "relative",
    color,
    "&:hover::after": {
      content: `"${hoverContent}"`,
      position: "absolute",
      top: labelsBelow ? "90%" : "-40%",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "12px",
      color
    }
  });

  const handleDownload = async (format: "png" | "svg") => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    try {
      const dataUrl = format === "png" ? await toPng(chartElement, exportOptions) : await toSvg(chartElement, exportOptions);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = currentLabel ? `${fileNamePrefix}-${currentLabel}.${format}` : `${fileNamePrefix}.${format}`;
      link.click();
    } catch (error) {
      console.error("Error exporting chart:", error);
    }
  };

  return (
    <Box gap={1} sx={{ opacity: 0.25, transition: "opacity 0.3s", "&:hover": { opacity: 1 } }}>
      <div className="download-buttons">
        <IconButton onClick={() => handleDownload("png")} size="small" sx={getIconButtonStyle("PNG")}>
          <PhotoCameraIcon fontSize="small" />
        </IconButton>
        <IconButton onClick={() => handleDownload("svg")} size="small" sx={getIconButtonStyle("SVG")}>
          <PhotoCameraIcon fontSize="small" />
        </IconButton>
      </div>
    </Box>
  );
};

export default DownloadButtons;
