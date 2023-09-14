import { mobileDeviceWidth } from "../constants";

export const mapSizesToProps = ({ width }) => ({
  isMobile: width < mobileDeviceWidth,
})
