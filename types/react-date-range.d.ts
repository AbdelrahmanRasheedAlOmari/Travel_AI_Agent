declare module 'react-date-range' {
  import { Locale } from 'date-fns';

  export interface Range {
    startDate?: Date;
    endDate?: Date;
    key: string;
  }

  export interface RangeKeyDict {
    [key: string]: Range;
  }

  export interface DateRangeProps {
    onChange?: (ranges: RangeKeyDict) => void;
    ranges: Range[];
    months?: number;
    direction?: 'horizontal' | 'vertical';
    moveRangeOnFirstSelection?: boolean;
    minDate?: Date;
    maxDate?: Date;
    editableDateInputs?: boolean;
    className?: string;
    locale?: Locale;
  }

  export const DateRange: React.FC<DateRangeProps>;
}

declare module 'react-date-range/dist/styles.css';
declare module 'react-date-range/dist/theme/default.css'; 