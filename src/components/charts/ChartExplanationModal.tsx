import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import FullSizeModal from "@components/FullSizeModal";

interface ChartExplanationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  contentHtml: string;
  imageSrc?: string;
}

const ChartExplanationModal = ({
  open,
  onClose,
  title,
  contentHtml,
  imageSrc,
}: ChartExplanationModalProps) => {
  return (
    <FullSizeModal open={open} onClose={onClose} ariaLabel="Chart explanation">
      <Typography variant="h6" mb={2}>
        {title}
      </Typography>
      <Typography variant="body1" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      {imageSrc && (
        <Box
          component="img"
          src={imageSrc}
          alt="Chart explanation"
          sx={{ maxWidth: "100%", mb: 2 }}
        />
      )}
    </FullSizeModal>
  );
};

export default ChartExplanationModal;
