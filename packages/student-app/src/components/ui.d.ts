import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';

export interface ScreenScaffoldProps {
  children?: React.ReactNode;
  tint?: 'dawn' | 'dusk' | 'morning' | 'study' | 'meadow';
  scroll?: boolean;
  padded?: boolean;
  footer?: React.ReactNode;
  dark?: boolean;
}

export function ScreenScaffold(props: ScreenScaffoldProps): JSX.Element;

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'coral' | 'sky' | 'sage' | 'gold' | 'ghost';
  icon?: React.ReactNode;
  size?: 'lg' | 'md' | 'sm';
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

export function PrimaryButton(props: PrimaryButtonProps): JSX.Element;

export interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  soft?: boolean;
  onPress?: () => void;
  tone?: string;
}

export function Card(props: CardProps): JSX.Element;

export interface BadgeProps {
  label: string;
  tone?: 'sage' | 'sky' | 'coral' | 'gold' | 'ink';
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function Badge(props: BadgeProps): JSX.Element;

export interface OfflineBadgeProps {
  style?: ViewStyle | ViewStyle[];
}

export function OfflineBadge(props: OfflineBadgeProps): JSX.Element;

export interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function Chip(props: ChipProps): JSX.Element;

export interface SectionTitleProps {
  kicker?: string;
  title: string;
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle | ViewStyle[];
}

export function SectionTitle(props: SectionTitleProps): JSX.Element;

export interface IconButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  tone?: 'paper' | 'clear';
  style?: ViewStyle | ViewStyle[];
}

export function IconButton(props: IconButtonProps): JSX.Element;

export interface BackArrowProps {
  color?: string;
}

export function BackArrow(props: BackArrowProps): JSX.Element;

export interface ProgressDotsProps {
  total: number;
  index: number;
  tone?: string;
}

export function ProgressDots(props: ProgressDotsProps): JSX.Element;

export interface DividerProps {
  label?: string;
}

export function Divider(props: DividerProps): JSX.Element;
