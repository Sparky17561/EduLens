import React from 'react';
import { ViewStyle } from 'react-native';

export interface IllustrationProps {
  name: string;
  height?: number;
  rounded?: number;
  overlay?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export default function Illustration(props: IllustrationProps): JSX.Element;
