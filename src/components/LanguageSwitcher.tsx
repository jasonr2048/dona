"use client";

import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import { Locale, localeNames, locales } from "@/config";
import { setUserLocale } from "@/services/locale";

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const changeLocale = (event: SelectChangeEvent) => {
    setUserLocale(event.target.value as Locale);
  };

  return (
    <Select
      size="small"
      value={locale}
      onChange={changeLocale}
      variant="outlined"
      sx={{
        color: "inherit",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "inherit"
        },
        "& .MuiSvgIcon-root": {
          color: "inherit"
        }
      }}
    >
      {locales.map(loc => (
        <MenuItem key={loc} value={loc}>
          {localeNames[loc]}
        </MenuItem>
      ))}
    </Select>
  );
}
