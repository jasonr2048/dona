import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Button, Divider, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { useTranslations } from "next-intl";
import React from "react";

export function FileUploadButton({ onChange, loading, accept }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; loading: boolean; accept: string }) {
  const t = useTranslations("donation");

  return (
    <Button variant="contained" component="label" disabled={loading} sx={{ my: 1 }}>
      {t("select-data.browse")}
      <input type="file" hidden multiple accept={accept} onChange={onChange} />
    </Button>
  );
}

export function RemoveButton({ onClick, loading }: { onClick: React.MouseEventHandler<HTMLButtonElement>; loading: boolean }) {
  const t = useTranslations("donation");

  return (
    <Button variant="outlined" disabled={loading} sx={{ my: 1 }} onClick={onClick}>
      {t("select-data.remove")}
    </Button>
  );
}

export function FileList({ files }: { files: File[] }) {
  return (
    <List
      sx={{
        p: 0,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper"
      }}
    >
      {files.map((file, index) => (
        <React.Fragment key={file.name}>
          <ListItem sx={{ padding: "0.25rem 0.75rem" }}>
            <ListItemIcon sx={{ mr: "0.75rem", minWidth: "inherit" }}>
              <InsertDriveFileIcon />
            </ListItemIcon>
            <ListItemText
              primary={file.name}
              slotProps={{
                primary: {
                  style: {
                    overflowWrap: "break-word",
                    wordBreak: "break-word"
                  }
                }
              }}
            />
          </ListItem>
          {index < files.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
}
