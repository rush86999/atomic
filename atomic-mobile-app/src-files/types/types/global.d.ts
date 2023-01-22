
declare module "*.svg" {
  const content: React.FC<SvgProps>;
  export default content;
  import React from 'react';
  import { SvgProps } from "react-native-svg";
}

declare module "*.png" {
   const value: any;
   export = value;
}

declare module '*.jpg' {
   const value: any;
   export = value;
}

declare module '*.jpeg' {
   const value: any;
   export = value;
}

declare module '*.webp' {
   const value: any;
   export = value;
}

declare module "*.json" {
    const value: any;
    export default value;
}


declare module 'react-native-dotenv' {
  export const API_BASE: string;
  export const PUBLIC_IMAGE_API: string;
  export const PUBLIC_PROFILE_IMAGE_API: string;
  export const CONVERT_TO_WEBP_API: string;
  export const FORMAT_IMAGE_API: string
}
