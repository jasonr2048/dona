import PersonOffIcon from "@mui/icons-material/PersonOff";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { Conversation, Message, MessageAudio } from "@models/processed";
import { createJsonDownloadUrl } from "@services/createJson";

interface MessageData {
  message: Message | MessageAudio;
  participants: string[];
  isGroup: boolean;
}

interface AnonymizationModalProps {
  open: boolean;
  onClose: () => void;
  conversations: Conversation[];
  n_listed_receivers: number;
  n_messages: number;
}

const AnonymizationModal: React.FC<AnonymizationModalProps> = ({
  open,
  onClose,
  conversations,
  n_listed_receivers,
  n_messages
}) => {
  const t = useTranslations("donation.previewData");
  const actions = useTranslations("actions");
  const [messagesData, setMessagesData] = useState<MessageData[]>([]);
  const [downloadUrl] = useState(() => createJsonDownloadUrl(conversations));

  useEffect(() => {
    const filteredMessagesData = conversations
      .flatMap(conversation =>
        [...conversation.messages, ...conversation.messagesAudio].map(msg => ({
          message: msg,
          participants: conversation.participants,
          isGroup: conversation.isGroupConversation || false
        }))
      )
      .slice(0, n_messages);

    setMessagesData(filteredMessagesData);
  }, [conversations, n_messages]);

  const inferReceivers = (participants: string[], sender: string): string => {
    const receivers = participants.filter(participant => participant !== sender);
    if (receivers.length > n_listed_receivers) {
      return `${receivers.slice(0, n_listed_receivers).join(", ")}...`;
    }
    return receivers.join(", ");
  };

  const renderMessageCard = ({
    message,
    participants,
    isGroup,
    index
  }: {
    message: Message | MessageAudio;
    participants: string[];
    isGroup: boolean;
    index: number;
  }) => {
    const receiver = inferReceivers(participants, message.sender);
    const isAudio = "lengthSeconds" in message;

    const details = [
      { label: t("sender"), value: message.sender },
      { label: t("receiver"), value: receiver },
      {
        label: isAudio ? t("lengthSeconds") : t("wordCount"),
        value: isAudio ? message.lengthSeconds : (message as Message).wordCount
      },
      { label: t("timestamp"), value: new Date(message.timestamp).toLocaleString() },
      { label: t("groupConversation"), value: isGroup ? actions("yes") : actions("no") },
      { label: t("voiceMessage"), value: isAudio ? actions("yes") : actions("no") }
    ];

    return (
      <Card key={index} sx={{ minWidth: 275, margin: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            {t("message")} #{index + 1}
          </Typography>
          <Box>
            {details.map((detail, idx) => (
              <Typography key={idx} variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                <strong>{detail.label}:</strong>
                <br />
                &nbsp;&nbsp;&nbsp;<i>{detail.value}</i>
              </Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          maxHeight: "80vh",
          margin: "auto",
          padding: 2,
          overflowY: "auto",
          borderRadius: 2,
          boxShadow: 24,
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%, 0%)",
          width: { xs: "90%", sm: "60%" },
          backgroundColor: "background.paper"
        }}
      >
        <Typography variant="h5">{t("title")}</Typography>
        <Alert
          icon={<PersonOffIcon fontSize="inherit" />}
          severity="info"
          sx={{ padding: 1.5, my: 2, borderRadius: 1.5 }}
        >
          <Typography variant="body2">{t("body1")}</Typography>
          <Typography variant="body2">{t("body2")}</Typography>
        </Alert>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t.rich("dataExplanation_format", {
            b: txt => <b>{txt}</b>,
            num_messages: n_messages,
            link: txt => (
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                {txt}
              </a>
            )
          })}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            overflowX: "auto"
          }}
        >
          {messagesData.map((data, index) => renderMessageCard({ ...data, index }))}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button onClick={onClose} variant="contained">
            {actions("close")}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AnonymizationModal;
