import { useTranslations } from "next-intl";
import { ReactNode } from "react";

export function useRichTranslations(namespace: string) {
  const translate = useTranslations(namespace);
  const globalTranslate = useTranslations("urls"); // Fetch URLs from the global "urls" namespace

  // Helper function: Filters out missing URL keys and returns handlers for valid keys
  const makeLinkHandlers = (urlKeys?: Record<string, string>, newTab: boolean = true) => {
    if (!urlKeys) return {};

    return Object.fromEntries(
      Object.entries(urlKeys)
        .map(([placeholder, urlKey]) => [placeholder, linkHandler(urlKey, newTab)])
        .filter(entry => entry !== null)
    );
  };

  // Function to replace <link>...</link> with an <a> tag, using a URL key dynamically
  const linkHandler = (urlKey: string, newTab: boolean = true) => {
    if (!globalTranslate.has(urlKey)) {
      return null;
    }

    const url = globalTranslate(urlKey);
    // Return a render function that creates the element, not a component function
    return (text: ReactNode) => (
      <a href={url} target={newTab ? "_blank" : "_self"} rel={newTab ? "noopener noreferrer" : undefined}>
        {text}
      </a>
    );
  };

  return (
    {
      [namespace]: {
        t: translate,
        rich: (
          key: string,
          urlKeys?: Record<string, string>,
          newTab: boolean = true,
          templateValues?: Record<string, any>
        ) =>
          translate.rich(key, {
            ...makeLinkHandlers(urlKeys, newTab),
            br: () => <br />,
            p: (txt: ReactNode) => <p>{txt}</p>,
            u: (txt: ReactNode) => <u>{txt}</u>,
            b: (content: ReactNode) => <b>{content}</b>,
            i: (content: ReactNode) => <i>{content}</i>,
            em: (content: ReactNode) => <em>{content}</em>,
            strong: (content: ReactNode) => <strong>{content}</strong>,
            email: (address: ReactNode) => <a href={"mailto:" + address}>{address}</a>,
            ...templateValues
          }),
        link: linkHandler // Standalone function for direct use
      }
    }[namespace] ?? { t: () => "", rich: () => "", link: () => "" }
  ); // Return a default object
}
