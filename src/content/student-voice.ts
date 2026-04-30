export type StudentPick = {
  label: 'Student pick of the week'
  title: string
  copy: string
  byline: string
}

export type CampusVoiceItem = {
  campus: 'Pomona' | 'CMC' | 'Mudd' | 'Scripps' | 'Pitzer' | 'CGU/KGI'
  heading: string
  copy: string
  byline: string
}

export const featuredStudentPick: StudentPick = {
  label: 'Student pick of the week',
  title: 'Go early to the farmers market, then disappear into Some Crust.',
  copy: 'The move is 9:30 a.m. before the Village gets crowded: grab strawberries, split a bear claw, and call it studying outdoors.',
  byline: 'Anonymous Pomona correspondent',
}

export const campusVoiceItems: CampusVoiceItem[] = [
  {
    campus: 'Pomona',
    heading: 'Pomona pick',
    copy: 'If Frary is chaotic, take your plate outside by the fountain. Same food, 70% less dining hall tunnel vision.',
    byline: 'Anonymous Pomona student',
  },
  {
    campus: 'CMC',
    heading: 'CMC pick',
    copy: 'Ath tea is still the easiest low-stakes way to run into people before everyone vanishes into meetings.',
    byline: 'CMC correspondent',
  },
  {
    campus: 'Mudd',
    heading: 'Mudd survival tip',
    copy: 'Whiteboard the problem before opening twelve tabs. Your future 2 a.m. self will thank you.',
    byline: 'Mudd correspondent',
  },
  {
    campus: 'Scripps',
    heading: 'Scripps study spot',
    copy: 'Denison is gorgeous, but the quiet corners in the browsing room are the actual deadline bunker.',
    byline: 'Scripps correspondent',
  },
  {
    campus: 'Pitzer',
    heading: 'Pitzer weird thing worth doing',
    copy: 'Walk the mounds at golden hour and pretend your group project is not due tomorrow. It helps a little.',
    byline: 'Pitzer correspondent',
  },
  {
    campus: 'CGU/KGI',
    heading: 'Grad corner',
    copy: 'Pack dinner before a late seminar. The Village is close, but not “ten-minute break” close.',
    byline: 'Anonymous grad correspondent',
  },
]
