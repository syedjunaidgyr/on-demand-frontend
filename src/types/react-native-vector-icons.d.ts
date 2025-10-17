declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}

// FontAwesome types
declare module '@fortawesome/react-native-fontawesome' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';
  import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

  interface FontAwesomeIconProps extends TextProps {
    icon: IconDefinition | string;
    size?: number;
    color?: string;
    style?: any;
  }

  export class FontAwesomeIcon extends Component<FontAwesomeIconProps> {}
}
