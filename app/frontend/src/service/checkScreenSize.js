import { mobileDeviceWidth } from "../constants";

export const mapSizesToProps = ({ size }) => ({
  isMobile: size.width < mobileDeviceWidth,
})

export const isMobile = (width) => {
  return (width < mobileDeviceWidth);
}
