import React from 'react';
import { ViewStyle } from 'react-native';

export interface AvatarProps {
  name?: string;
  size?: number;
  ring?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Avatar(props: AvatarProps): JSX.Element;

export interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  dark?: boolean;
  kicker?: string;
}

export function ScreenHeader(props: ScreenHeaderProps): JSX.Element;

export interface PinPadProps {
  length?: number;
  value?: string;
  onChange: (val: string) => void;
  tone?: string;
}

export function PinPad(props: PinPadProps): JSX.Element;

export interface SpeakerButtonProps {
  playing: boolean;
  onPress: () => void;
}

export function SpeakerButton(props: SpeakerButtonProps): JSX.Element;

export interface StatProps {
  value: string | number;
  label: string;
  tone?: string;
}

export function Stat(props: StatProps): JSX.Element;

export interface MasteryBarProps {
  pct: number;
  tone?: string;
}

export function MasteryBar(props: MasteryBarProps): JSX.Element;
