import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";
import WhatsAppLogo from "@images/logos/icons8-whatsapp.svg";
import InstagramLogo from "@images/logos/icons8-instagram.svg";
import FacebookLogo from "@images/logos/icons8-facebook.svg";
import IMessageLogo from "@images/logos/icons8-messages.svg";

export const WhatsAppIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 48 48">
    <WhatsAppLogo />
  </SvgIcon>
);
export const InstagramIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 48 48">
    <InstagramLogo />
  </SvgIcon>
);
export const FacebookIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 48 48">
    <FacebookLogo />
  </SvgIcon>
);

export const IMessageIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 48 48">
    <IMessageLogo />
  </SvgIcon>
);
