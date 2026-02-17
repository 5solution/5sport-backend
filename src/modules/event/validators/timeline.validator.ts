import { BadRequestException } from '@nestjs/common';

export interface TimelineFields {
  eventStartTime?: string | Date;
  eventEndTime?: string | Date;
  editInfoOpenTime?: string | Date;
  editInfoCloseTime?: string | Date;
  transferOpenTime?: string | Date;
  transferCloseTime?: string | Date;
  checkinOpenTime?: string | Date;
  checkinCloseTime?: string | Date;
  allowTransfer?: boolean;
}

export function validateTimeline(fields: TimelineFields): void {
  const errors: string[] = [];

  const toDate = (v: string | Date | undefined): Date | null => {
    if (!v) return null;
    return v instanceof Date ? v : new Date(v);
  };

  const eventStart = toDate(fields.eventStartTime);
  const eventEnd = toDate(fields.eventEndTime);
  const editOpen = toDate(fields.editInfoOpenTime);
  const editClose = toDate(fields.editInfoCloseTime);
  const transferOpen = toDate(fields.transferOpenTime);
  const transferClose = toDate(fields.transferCloseTime);
  const checkinOpen = toDate(fields.checkinOpenTime);
  const checkinClose = toDate(fields.checkinCloseTime);

  if (eventStart && eventEnd && eventEnd <= eventStart) {
    errors.push(
      'Thời gian kết thúc sự kiện phải sau thời gian bắt đầu sự kiện.',
    );
  }

  if (editOpen && editClose && editClose <= editOpen) {
    errors.push(
      'Thời gian đóng chỉnh sửa phải sau thời gian mở chỉnh sửa.',
    );
  }

  if (fields.allowTransfer !== false && transferOpen && transferClose) {
    if (transferClose <= transferOpen) {
      errors.push(
        'Thời gian đóng chuyển nhượng phải sau thời gian mở chuyển nhượng.',
      );
    }
  }

  if (checkinOpen && checkinClose && checkinClose <= checkinOpen) {
    errors.push('Thời gian đóng check-in phải sau thời gian mở check-in.');
  }

  if (errors.length > 0) {
    throw new BadRequestException(errors);
  }
}
