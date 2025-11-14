import { Modal, Box, Button, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import React from "react";

const StyledModalBox = styled(Box)(({ theme }) => ({
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "900px",
  maxHeight: "90vh",
  overflow: "auto",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[10],
  padding: theme.spacing(3)
}));

interface FullSizeModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  onAgree?: () => void;
}

const FullSizeModal: React.FC<FullSizeModalProps> = ({ open, onClose, children, ariaLabel, onAgree }) => {
  const actions = useTranslations("actions");

  return (
    <Modal open={open} onClose={onClose} aria-labelledby={ariaLabel ? "modal-title" : undefined} aria-describedby={ariaLabel ? "modal-content" : undefined}>
      <StyledModalBox>
        {/* Optional aria label */}
        {ariaLabel && (
          <Box id="modal-title" sx={{ display: "none" }}>
            {ariaLabel}
          </Box>
        )}

        <Box id="modal-content">{children}</Box>

        {/* Buttons */}
        {onAgree ? (
          <Stack spacing={2} direction="row" sx={{ justifyContent: "center" }}>
            <Button onClick={onClose}>{actions("close")}</Button>
            <Button variant="contained" onClick={onAgree}>
              {actions("agree")}
            </Button>
          </Stack>
        ) : (
          <Box display="flex" justifyContent="right">
            <Button variant="contained" onClick={onClose}>
              {actions("close")}
            </Button>
          </Box>
        )}
      </StyledModalBox>
    </Modal>
  );
};

export default FullSizeModal;
