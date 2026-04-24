'use client';

import { Chip, ChipProps } from '@mui/material';

type CallStatus =
  | 'initiating'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer'
  | 'canceled';

interface StatusBadgeProps {
  status: string;
  size?: ChipProps['size'];
}

function getStatusColor(status: string): ChipProps['color'] {
  switch (status) {
    case 'initiating':
      return 'info';
    case 'ringing':
      return 'warning';
    case 'in-progress':
      return 'success';
    case 'completed':
      return 'default';
    case 'failed':
      return 'error';
    case 'busy':
      return 'warning';
    case 'no-answer':
      return 'error';
    case 'canceled':
      return 'default';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'initiating':
      return 'Initiating';
    case 'ringing':
      return 'Ringing';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'busy':
      return 'Busy';
    case 'no-answer':
      return 'No Answer';
    case 'canceled':
      return 'Canceled';
    default:
      return status;
  }
}

export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status)}
      size={size}
      variant={status === 'in-progress' ? 'filled' : 'outlined'}
    />
  );
}
