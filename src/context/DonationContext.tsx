"use client";

import Cookies from "js-cookie";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

import { DONATION_ID_COOKIE, EXTERNAL_DONOR_ID_COOKIE } from "@/middleware";
import { GraphData } from "@models/graphData";
import { DataSourceValue } from "@models/processed";

interface DonationContextType {
  donationId?: string;
  feedbackData?: Record<DataSourceValue, GraphData>;
  externalDonorId?: string;
  setDonationData: (donationId: string, graphDataRecord: Record<DataSourceValue, GraphData>) => void;
  setExternalDonorId: (id: string) => void;
  loadExternalDonorIdFromCookie: () => void;
}

const DonationContext = createContext<DonationContextType | undefined>(undefined);

export function DonationProvider({ children }: { children: ReactNode }) {
  const [donationId, setDonationId] = useState<string | undefined>();
  const [feedbackData, setFeedbackData] = useState<Record<DataSourceValue, GraphData> | undefined>();
  const [externalDonorId, setExternalDonorIdState] = useState<string | undefined>();

  const setCookie = (name: string, value: string) => {
    Cookies.set(name, value, {
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
  };

  const setDonationData = (id: string, record: Record<DataSourceValue, GraphData>) => {
    setDonationId(id);
    setFeedbackData(record);
    setCookie(DONATION_ID_COOKIE, id);
  };

  const setExternalDonorId = (id: string) => {
    setExternalDonorIdState(id); // State update happens asynchronously
    setCookie(EXTERNAL_DONOR_ID_COOKIE, id);
  };

  const loadExternalDonorIdFromCookie = () => {
    const storedId = Cookies.get(EXTERNAL_DONOR_ID_COOKIE);
    if (storedId) {
      setExternalDonorIdState(storedId);
    }
  };

  useEffect(() => {
    loadExternalDonorIdFromCookie();
  }, []);

  return (
    <DonationContext.Provider
      value={{
        donationId,
        feedbackData,
        externalDonorId,
        setDonationData,
        setExternalDonorId,
        loadExternalDonorIdFromCookie
      }}
    >
      {children}
    </DonationContext.Provider>
  );
}

export function useDonation() {
  const context = useContext(DonationContext);
  if (!context) {
    throw new Error("useDonation must be used within a DonationProvider");
  }
  return context;
}

export function generateExternalDonorId(): string {
  return Math.random().toString(36).substring(2, 8);
}
