import React, {ReactNode, useState} from "react";
import {useTranslations} from "next-intl";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import StatisticsCard from "@components/StatisticsCard";
import ChartContainer, {ChartType} from "@components/charts/ChartContainer";
import ChartExplanationModal from "@components/charts/ChartExplanationModal";
import MoreChartsModal from "@components/charts/MoreChartsModal";
import {DataSourceValue} from "@models/processed";
import {GraphData} from "@models/graphData";

type SectionName = "responseTimes" | "dailyActivityTimes" | "interactionIntensity";

export default function DataSourceFeedbackSection({ dataSourceValue, graphData }: { dataSourceValue: DataSourceValue; graphData: GraphData }) {
    const showDetailedAudioFeedback = [DataSourceValue.Facebook, DataSourceValue.Instagram].includes(dataSourceValue);
    console.log("DataSourceFeedbackSection graphData", graphData);
    let t = useTranslations("feedback");
    const ii = useTranslations("feedback.interactionIntensity");
    const dat = useTranslations("feedback.dailyActivityTimes");
    const rt = useTranslations("feedback.responseTimes");

    // State for ChartExplanationModal
    const [modalContent, setModalContent] = useState<{ title: string; contentHtml: string; imageSrc?: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State for MoreChartsModal
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState<SectionName | null>(null);

    // Handlers for ChartExplanationModal
    const openExplanationModal = (title: string, contentHtml: string, imageSrc?: string) => {
        setModalContent({ title, contentHtml, imageSrc });
        setIsModalOpen(true);
    };
    const closeExplanationModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    // Handlers for MoreChartsModal
    const openSectionModal = (section: SectionName) => {
        setCurrentSection(section);
        setIsSectionModalOpen(true);
    };
    const closeSectionModal = () => {
        setIsSectionModalOpen(false);
        setCurrentSection(null);
    };

    const openModalSpan = (content: ReactNode, translator: any, chartName: string) => (
        <span
            style={{ color: "blue", textDecoration: "underline", cursor: "pointer" }}
            onClick={() =>
                openExplanationModal(
                    translator(translator.has(`${chartName}.title`) ? `${chartName}.title` : "title"),
                    translator.raw(`${chartName}.example.text`),
                    translator(`${chartName}.example.image`)
                )
            }
        >
            {content}
        </span>
    );

    return (
        <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                <Typography variant="h6">{t("sourceTitle", { source: dataSourceValue })}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ width: "100%", overflowX: "hidden" }}>
                <Stack
                    direction="column"
                    spacing={2}
                    sx={{ display: "flex", textAlign: "center", bgcolor: "background.paper" }}
                >
                    {/* Statistics card */}
                    <Typography variant="h6">{t("statisticsCard.title")}</Typography>
                    <StatisticsCard stats={graphData.basicStatistics} />

                    {/* Message composition */}
                    <Typography variant="h6">{t("messageComposition.title")}</Typography>
                    {/* TODO: Audio vs. text (vs. media) */}
                    <Box>
                        <Typography variant="body1" fontWeight="fontWeightBold">
                            {t("messageComposition.messageTypesBarChart.title")}
                        </Typography>
                        <Typography variant="body2">
                            {t.rich("messageComposition.messageTypesBarChart.description", {
                                button: (label) => openModalSpan(label, t, "messageComposition.messageTypesBarChart"),
                            })}
                        </Typography>
                    </Box>
                    <ChartContainer
                        type={ChartType.MessageTypesBarChart}
                        data={graphData}
                        dataSourceValue={dataSourceValue}
                    />

                    <Box>
                        <Typography variant="body1" fontWeight="fontWeightBold">
                            {t("messageComposition.audioLengthsBarChart.title")}
                        </Typography>
                        <Typography variant="body2">
                            {t.rich("messageComposition.audioLengthsBarChart.description", {
                                button: (label) => openModalSpan(label, t, "messageComposition.audioLengthsBarChart"),
                            })}
                        </Typography>
                    </Box>
                    <ChartContainer
                        type={ChartType.AudioLengthsBarChart}
                        data={graphData}
                        dataSourceValue={dataSourceValue}
                    />
                    {/* TODO: Histogram word counts */}
                    {/* TODO: Emoji analysis */}

                    {/* Interaction Intensity */}
                    {/*<Typography variant="h6">{ii("title")}</Typography>*/}
                    {/*<Box>*/}
                    {/*    <Typography variant="body1" fontWeight="fontWeightBold">*/}
                    {/*        {ii("animatedIntensityPolarChart.title")}*/}
                    {/*    </Typography>*/}
                    {/*    <Typography variant="body2">*/}
                    {/*        {ii.rich("animatedIntensityPolarChart.description", {*/}
                    {/*            button: (label) => openModalSpan(label, ii, "animatedIntensityPolarChart"),*/}
                    {/*        })}*/}
                    {/*    </Typography>*/}
                    {/*</Box>*/}
                    {/*<ChartContainer*/}
                    {/*    type={ChartType.AnimatedIntensityPolarChart}*/}
                    {/*    data={graphData}*/}
                    {/*    dataSourceValue={dataSourceValue}*/}
                    {/*/>*/}
                    {/*<Box>*/}
                    {/*    <Typography variant="body1" fontWeight="fontWeightBold">*/}
                    {/*        {ii("animatedWordsPerChatBarChart.title")}*/}
                    {/*    </Typography>*/}
                    {/*    <Typography variant="body2">*/}
                    {/*        {ii.rich("animatedWordsPerChatBarChart.description", {*/}
                    {/*            button: (label) => openModalSpan(label, ii, "animatedWordsPerChatBarChart"),*/}
                    {/*        })}*/}
                    {/*    </Typography>*/}
                    {/*</Box>*/}
                    {/*<ChartContainer*/}
                    {/*    type={ChartType.AnimatedWordsPerChatBarChart}*/}
                    {/*    data={graphData}*/}
                    {/*    dataSourceValue={dataSourceValue}*/}
                    {/*/>*/}
                    {/*{showDetailedAudioFeedback && (*/}
                    {/*    <>*/}
                    {/*        <Box>*/}
                    {/*            <Typography variant="body1" fontWeight="fontWeightBold">*/}
                    {/*                {ii("animatedSecondsPerChatBarChart.title")}*/}
                    {/*            </Typography>*/}
                    {/*            <Typography variant="body2">*/}
                    {/*                {ii.rich("animatedSecondsPerChatBarChart.description", {*/}
                    {/*                    button: (label) => openModalSpan(label, ii, "animatedSecondsPerChatBarChart"),*/}
                    {/*                })}*/}
                    {/*            </Typography>*/}
                    {/*        </Box>*/}
                    {/*        <ChartContainer*/}
                    {/*            type={ChartType.AnimatedSecondsPerChatBarChart}*/}
                    {/*            data={graphData}*/}
                    {/*            dataSourceValue={dataSourceValue}*/}
                    {/*        />*/}
                    {/*    </>*/}
                    {/*)}*/}
                    {/*<Button onClick={() => openSectionModal("interactionIntensity")}>*/}
                    {/*    {ii("moreAbout")}*/}
                    {/*</Button>*/}

                    {/* Daily Activity Times */}
                    {/*<Typography variant="h6">{dat("title")}</Typography>*/}
                    {/*<Box>*/}
                    {/*    <Typography variant="body2">*/}
                    {/*        {dat.rich("dailyActivityHoursChart.description", {*/}
                    {/*            button: (label) => openModalSpan(label, dat, "dailyActivityHoursChart"),*/}
                    {/*        })}*/}
                    {/*    </Typography>*/}
                    {/*</Box>*/}
                    {/*<ChartContainer*/}
                    {/*    type={ChartType.DailyActivityHoursChart}*/}
                    {/*    data={graphData}*/}
                    {/*    dataSourceValue={dataSourceValue}*/}
                    {/*/>*/}
                    {/*<Button onClick={() => openSectionModal("dailyActivityTimes")}>*/}
                    {/*    {dat("moreAbout")}*/}
                    {/*</Button>*/}

                    {/* Response Times */}
                    <Typography variant="h6">{rt("title")}</Typography>
                    <Box>
                        <Typography variant="body2">
                            {rt.rich("responseTimeBarChart.description", {
                                button: (label) => openModalSpan(label, rt, "responseTimeBarChart"),
                            })}
                        </Typography>
                    </Box>
                    <ChartContainer
                        type={ChartType.ResponseTimeBarChart}
                        data={graphData}
                        dataSourceValue={dataSourceValue}
                    />
                    <Button onClick={() => openSectionModal("responseTimes")}>
                        {rt("moreAbout")}
                    </Button>
                </Stack>
            </AccordionDetails>

            {/* ChartExplanationModal */}
            <ChartExplanationModal
                open={isModalOpen}
                onClose={closeExplanationModal}
                title={modalContent?.title || ""}
                contentHtml={modalContent?.contentHtml || ""}
                imageSrc={modalContent?.imageSrc}
            />

            {/* MoreChartsModal */}
            {currentSection && (
                <MoreChartsModal
                    open={isSectionModalOpen}
                    onClose={closeSectionModal}
                    graphData={graphData}
                    section={currentSection}
                    showDetailedAudioFeedback={showDetailedAudioFeedback}
                />
            )}
        </Accordion>
    );
}
