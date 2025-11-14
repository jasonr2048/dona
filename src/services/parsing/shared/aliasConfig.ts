import { useTranslations } from "next-intl";

export class AliasConfig {
  systemAlias: string;
  contactAlias: string;
  donorAlias: string;
  chatAlias: string;

  constructor(systemAlias: string, contactAlias: string, donorAlias: string, chatAlias: string) {
    this.systemAlias = systemAlias;
    this.contactAlias = contactAlias;
    this.donorAlias = donorAlias;
    this.chatAlias = chatAlias;
  }
}

let aliasConfig: AliasConfig | null = null;

export function useAliasConfig(): AliasConfig {
  const t = useTranslations("donation.anonymisation");
  if (!aliasConfig) {
    aliasConfig = new AliasConfig(t("system"), t("contact"), t("donor"), t("chat"));
  }
  return aliasConfig;
}

export function getAliasConfig(): AliasConfig {
  if (!aliasConfig) {
    throw new Error("AliasConfig has not been initialized yet.");
  }
  return aliasConfig;
}
