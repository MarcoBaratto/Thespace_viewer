export interface SessionAttribute {
  name: string;
  value: string;
  attributeType: string;
}

export interface Session {
  sessionId: string;
  startTime: string;
  endTime: string;
  screenName: string;
  attributes: SessionAttribute[];
  isSoldOut: boolean;
  bookingUrl: string;
  isBookingAvailable: boolean;
}

export interface ShowingGroup {
  date: string;
  sessions: Session[];
}

export interface Movie {
  filmId: string;
  filmTitle: string;
  posterImageSrc: string;
  synopsisShort: string;
  runningTime: number;
  showingGroups: ShowingGroup[];
}
