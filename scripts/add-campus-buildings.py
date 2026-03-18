#!/usr/bin/env python3
"""
Add all 7 Claremont Colleges campus buildings to village-data.json and building-metadata.json.
Uses approximate real-world coordinates converted to local coordinate system.
"""
import json
import math
import os

# ── Coordinate system (matches village-map.tsx) ──────────────────────────────
CENTER_LAT = 34.0965
CENTER_LNG = -117.7185
LAT_M = 110540
LNG_M = 111320 * math.cos(CENTER_LAT * math.pi / 180)

def latlng_to_local(lat, lng):
    """Convert lat/lng to local x,z coordinates."""
    x = (lng - CENTER_LNG) * LNG_M
    z = (lat - CENTER_LAT) * LAT_M
    return round(x, 2), round(z, 2)

def make_footprint(lat, lng, width_m, length_m, angle_deg=0):
    """Create a rectangular footprint centered on lat/lng with given dimensions and rotation."""
    cx, cz = latlng_to_local(lat, lng)
    hw = width_m / 2
    hl = length_m / 2
    angle = math.radians(angle_deg)

    corners = [(-hw, -hl), (hw, -hl), (hw, hl), (-hw, hl), (-hw, -hl)]
    footprint = []
    for dx, dz in corners:
        rx = dx * math.cos(angle) - dz * math.sin(angle)
        rz = dx * math.sin(angle) + dz * math.cos(angle)
        footprint.append([round(cx + rx, 2), round(cz + rz, 2)])
    return footprint

# ── Start ID for new buildings (avoid collisions) ───────────────────────────
NEXT_ID = 800000000

def next_id():
    global NEXT_ID
    NEXT_ID += 1
    return NEXT_ID

# ── Campus buildings database ────────────────────────────────────────────────
# Each entry: (name, lat, lng, width_m, length_m, height, floors, angle_deg, type, description, use, yearBuilt, college)

CAMPUS_BUILDINGS = [
    # ═══════════════════════════════════════════════════════════════════════════
    # POMONA COLLEGE
    # ═══════════════════════════════════════════════════════════════════════════
    ("Bridges Auditorium", 34.09765, -117.71270, 35, 55, 15, 3, -5, "college",
     "Iconic 2,500-seat auditorium, the largest performance venue at the Claremont Colleges.", "Education", 1932, "Pomona College"),
    ("Bridges Hall of Music (Little Bridges)", 34.09720, -117.71310, 25, 40, 12, 2, -5, "college",
     "Intimate concert hall with exceptional acoustics for chamber music and recitals.", "Education", 1915, "Pomona College"),
    ("Smith Campus Center", 34.09740, -117.71180, 30, 50, 10, 2, 0, "college",
     "Central student center with dining, lounges, and campus mailroom.", "Education", 1999, "Pomona College"),
    ("Frary Dining Hall", 34.09780, -117.71230, 25, 45, 12, 2, -5, "college",
     "Historic dining hall with Orozco mural 'Prometheus', a Pomona landmark.", "Education", 1929, "Pomona College"),
    ("Frank Dining Hall", 34.09770, -117.71200, 22, 35, 10, 2, -5, "college",
     "Modern dining facility adjacent to Frary Hall.", "Education", 2012, "Pomona College"),
    ("Mason Hall", 34.09710, -117.71270, 20, 40, 10, 2, -5, "college",
     "Academic building housing humanities departments.", "Education", 1952, "Pomona College"),
    ("Pearsons Hall", 34.09690, -117.71260, 20, 45, 12, 3, -5, "college",
     "Historic academic building, one of the oldest on campus.", "Education", 1890, "Pomona College"),
    ("Crookshank Hall", 34.09700, -117.71220, 20, 35, 10, 2, -5, "college",
     "Academic hall for humanities and social sciences.", "Education", 1926, "Pomona College"),
    ("Carnegie Building (Pomona)", 34.09815, -117.71245, 20, 30, 10, 2, -5, "college",
     "Historic building originally funded by Andrew Carnegie.", "Education", 1908, "Pomona College"),
    ("Millikan Laboratory", 34.09690, -117.71200, 25, 45, 12, 3, 0, "college",
     "Physics laboratory named after Nobel laureate Robert Millikan.", "Education", 1958, "Pomona College"),
    ("Seaver Chemistry Laboratory", 34.09680, -117.71160, 25, 50, 12, 3, 0, "college",
     "Chemistry research and teaching laboratories.", "Education", 1958, "Pomona College"),
    ("Andrew Science Hall", 34.09670, -117.71130, 22, 40, 10, 2, 0, "college",
     "Biology and environmental science building.", "Education", 1963, "Pomona College"),
    ("Lincoln Hall", 34.09730, -117.71150, 20, 40, 10, 2, -5, "college",
     "Academic building for computer science and mathematics.", "Education", 1965, "Pomona College"),
    ("Edmunds Hall", 34.09740, -117.71120, 20, 35, 10, 2, -5, "college",
     "Mathematics and computing center.", "Education", 1958, "Pomona College"),
    ("Rains Center (Pomona)", 34.09750, -117.71070, 25, 35, 8, 2, 0, "college",
     "Athletic and recreation center with gym and pool.", "Education", 1964, "Pomona College"),
    ("Alexander Hall", 34.09730, -117.71340, 20, 45, 12, 3, -5, "college",
     "Academic hall housing social science departments.", "Education", 1927, "Pomona College"),
    ("Thatcher Music Building", 34.09710, -117.71340, 22, 35, 10, 2, -5, "college",
     "Music department with practice rooms and studios.", "Education", 1970, "Pomona College"),
    ("Oldenborg Center", 34.09760, -117.71340, 22, 40, 10, 2, -5, "college",
     "Language learning center with international dining hall.", "Education", 1964, "Pomona College"),
    ("Sumner Hall (Pomona)", 34.09695, -117.71310, 18, 35, 10, 2, -5, "college",
     "Academic building for humanities and languages.", "Education", 1915, "Pomona College"),
    ("Seaver Theatre", 34.09675, -117.71280, 25, 35, 12, 2, -5, "college",
     "Black box and main stage theater for performing arts.", "Education", 1962, "Pomona College"),
    ("Harwood Court", 34.09810, -117.71150, 30, 30, 10, 2, -10, "college",
     "Historic residential courtyard, Pomona's first student housing.", "Education", 1921, "Pomona College"),
    ("Sontag Hall", 34.09820, -117.71180, 20, 35, 10, 2, -5, "college",
     "Residential hall with Greek Revival architecture.", "Education", 1914, "Pomona College"),
    ("Clark Hall (Pomona)", 34.09850, -117.71250, 30, 45, 12, 3, -5, "college",
     "Large residence hall complex on north campus.", "Education", 1961, "Pomona College"),
    ("Wig Hall", 34.09845, -117.71200, 22, 35, 10, 2, -5, "college",
     "Residential hall for upperclass students.", "Education", 1959, "Pomona College"),
    ("Mudd-Blaisdell Hall", 34.09835, -117.71310, 25, 40, 10, 2, -5, "college",
     "Residential hall on Pomona's north campus.", "Education", 1955, "Pomona College"),
    ("Pomona College Admissions", 34.09650, -117.71310, 18, 25, 8, 2, -5, "college",
     "Admissions office in the Sumner Hall complex.", "Education", 1920, "Pomona College"),
    ("Marston Quad", 34.09750, -117.71260, 45, 55, 0.3, 1, -5, "college",
     "Central green quadrangle at Pomona College, the heart of campus.", "Education", 1909, "Pomona College"),
    ("Smiley Hall", 34.09790, -117.71290, 22, 40, 12, 3, -5, "college",
     "Residence hall overlooking Marston Quad.", "Education", 1908, "Pomona College"),
    ("Norton-Clark Hall", 34.09860, -117.71150, 20, 35, 10, 2, -5, "college",
     "Residence hall on Pomona's north campus.", "Education", 1962, "Pomona College"),
    ("Dialynas Hall", 34.09830, -117.71100, 20, 35, 10, 2, -5, "college",
     "Newer residence hall at Pomona College.", "Education", 2003, "Pomona College"),
    ("Pomona College Studio Art Hall", 34.09660, -117.71350, 20, 30, 8, 2, -5, "college",
     "Studio spaces for visual arts students.", "Education", 1974, "Pomona College"),

    # ═══════════════════════════════════════════════════════════════════════════
    # CLAREMONT McKENNA COLLEGE (CMC)
    # ═══════════════════════════════════════════════════════════════════════════
    ("Roberts Hall (CMC)", 34.10085, -117.70880, 22, 40, 12, 3, 5, "college",
     "Administrative center and main academic building at CMC.", "Education", 1946, "CMC"),
    ("Kravis Center (CMC)", 34.10120, -117.70830, 30, 45, 12, 3, 5, "college",
     "Leadership and conference center, hub for the Kravis Leadership Institute.", "Education", 2011, "CMC"),
    ("Bauer Center (CMC)", 34.10070, -117.70830, 25, 40, 10, 2, 5, "college",
     "Center for student life and campus activities.", "Education", 2007, "CMC"),
    ("Collins Dining Hall (CMC)", 34.10100, -117.70900, 25, 35, 10, 2, 0, "college",
     "Main dining hall at Claremont McKenna College.", "Education", 1966, "CMC"),
    ("Marian Miner Cook Athenaeum", 34.10060, -117.70900, 25, 35, 12, 2, 0, "college",
     "Speaker program venue and formal dining hall, a CMC signature institution.", "Education", 1983, "CMC"),
    ("Seaman Hall (CMC)", 34.10050, -117.70850, 20, 35, 10, 2, 5, "college",
     "Academic building housing economics and government departments.", "Education", 1967, "CMC"),
    ("Adams Hall (CMC)", 34.10040, -117.70890, 18, 35, 10, 2, 0, "college",
     "Academic hall for social sciences at CMC.", "Education", 1957, "CMC"),
    ("Beckett Hall (CMC)", 34.10035, -117.70830, 18, 30, 10, 2, 5, "college",
     "Academic building for humanities.", "Education", 1965, "CMC"),
    ("Berger Hall (CMC)", 34.10130, -117.70880, 22, 35, 10, 2, 5, "college",
     "Residence hall at Claremont McKenna College.", "Education", 1957, "CMC"),
    ("Green Hall (CMC)", 34.10140, -117.70850, 22, 35, 10, 2, 5, "college",
     "Residence hall named for benefactor.", "Education", 1972, "CMC"),
    ("Stark Hall (CMC)", 34.10020, -117.70870, 20, 35, 10, 2, 5, "college",
     "Residence hall at CMC.", "Education", 1969, "CMC"),
    ("Phillips Hall (CMC)", 34.10000, -117.70860, 20, 30, 10, 2, 5, "college",
     "Residence hall at CMC's south campus.", "Education", 1966, "CMC"),
    ("Boswell Hall (CMC)", 34.10065, -117.70760, 20, 30, 10, 2, 0, "college",
     "Residence hall on CMC's east side.", "Education", 1999, "CMC"),
    ("CMC Admissions", 34.09990, -117.70910, 15, 25, 8, 2, 0, "college",
     "Admissions and financial aid offices.", "Education", 1960, "CMC"),
    ("Poppa Hall (CMC)", 34.10080, -117.70790, 20, 30, 10, 2, 0, "college",
     "Science building at CMC.", "Education", 2013, "CMC"),
    ("Rose Institute (CMC)", 34.10050, -117.70810, 15, 25, 10, 2, 5, "college",
     "Home of the Rose Institute of State and Local Government.", "Education", 1985, "CMC"),
    ("Roberts Pavilion (CMC)", 34.10160, -117.70790, 40, 55, 14, 2, 5, "college",
     "State-of-the-art athletics and recreation center.", "Education", 2016, "CMC"),
    ("Parent Field (CMC)", 34.10180, -117.70850, 60, 90, 0.3, 1, 5, "college",
     "Main athletic field and track.", "Education", 1970, "CMC"),

    # ═══════════════════════════════════════════════════════════════════════════
    # HARVEY MUDD COLLEGE (HMC)
    # ═══════════════════════════════════════════════════════════════════════════
    ("Shanahan Center (HMC)", 34.10600, -117.71050, 30, 50, 12, 3, 0, "college",
     "Academic center housing classrooms, labs, and the Hive makerspace.", "Education", 2013, "Harvey Mudd"),
    ("Olin Science Center (HMC)", 34.10580, -117.71100, 25, 45, 12, 3, 0, "college",
     "Science building with chemistry, biology, and physics labs.", "Education", 1958, "Harvey Mudd"),
    ("Parsons Engineering (HMC)", 34.10560, -117.71060, 22, 40, 10, 2, 0, "college",
     "Engineering building with project labs and machine shops.", "Education", 1963, "Harvey Mudd"),
    ("Sprague Library (HMC)", 34.10580, -117.70990, 20, 35, 8, 2, 0, "college",
     "Harvey Mudd College library and study center.", "Education", 1963, "Harvey Mudd"),
    ("Galileo Hall (HMC)", 34.10610, -117.71000, 18, 30, 10, 2, 0, "college",
     "Mathematics and computer science building.", "Education", 1962, "Harvey Mudd"),
    ("Kingston Hall (HMC)", 34.10560, -117.71000, 18, 30, 10, 2, 0, "college",
     "Administrative offices and faculty building.", "Education", 1957, "Harvey Mudd"),
    ("Platt Campus Center (HMC)", 34.10540, -117.71050, 25, 35, 10, 2, 0, "college",
     "Student center with dining, lounge, and game room.", "Education", 1963, "Harvey Mudd"),
    ("Hoch-Shanahan Dining Commons (HMC)", 34.10530, -117.71000, 25, 30, 8, 1, 0, "college",
     "Main dining hall at Harvey Mudd College.", "Education", 2005, "Harvey Mudd"),
    ("Thomas-Garrett Hall (HMC)", 34.10530, -117.71080, 20, 30, 10, 2, 0, "college",
     "Humanities and social science classrooms.", "Education", 2004, "Harvey Mudd"),
    ("Drinkward Recital Hall (HMC)", 34.10520, -117.71040, 15, 25, 10, 2, 0, "college",
     "Performance venue for music and presentations.", "Education", 2014, "Harvey Mudd"),
    ("Linde Activities Center (HMC)", 34.10620, -117.71060, 30, 40, 10, 2, 0, "college",
     "Gymnasium and fitness center.", "Education", 2006, "Harvey Mudd"),
    ("East Dorm (HMC)", 34.10560, -117.70950, 22, 45, 10, 3, 0, "college",
     "Residence hall on east campus.", "Education", 1957, "Harvey Mudd"),
    ("West Dorm (HMC)", 34.10620, -117.71110, 22, 45, 10, 3, 0, "college",
     "Residence hall on west campus.", "Education", 1957, "Harvey Mudd"),
    ("North Dorm (HMC)", 34.10650, -117.71050, 22, 45, 10, 3, 0, "college",
     "Residence hall on north campus.", "Education", 1963, "Harvey Mudd"),
    ("South Dorm (HMC)", 34.10510, -117.71050, 22, 40, 10, 3, 0, "college",
     "Residence hall on south campus.", "Education", 1963, "Harvey Mudd"),
    ("Sontag Dorm (HMC)", 34.10510, -117.70990, 20, 35, 10, 3, 0, "college",
     "Newest residence hall at Harvey Mudd.", "Education", 2017, "Harvey Mudd"),
    ("McGregor Computer Science Center (HMC)", 34.10590, -117.71050, 18, 30, 10, 2, 0, "college",
     "Computer science department and labs.", "Education", 1990, "Harvey Mudd"),

    # ═══════════════════════════════════════════════════════════════════════════
    # SCRIPPS COLLEGE
    # ═══════════════════════════════════════════════════════════════════════════
    ("Balch Hall (Scripps)", 34.10310, -117.71140, 22, 45, 12, 3, -5, "college",
     "Administrative building and Scripps landmark with its iconic arched entrance.", "Education", 1930, "Scripps"),
    ("Vita Nova Hall (Scripps)", 34.10280, -117.71100, 20, 35, 10, 2, -5, "college",
     "Academic building for humanities and social sciences.", "Education", 1935, "Scripps"),
    ("Lang Art Building (Scripps)", 34.10260, -117.71150, 20, 35, 10, 2, -5, "college",
     "Art studios, gallery space, and the Ruth Chandler Williamson Gallery.", "Education", 1992, "Scripps"),
    ("Williamson Gallery (Scripps)", 34.10250, -117.71180, 18, 25, 8, 1, -5, "college",
     "Art gallery with rotating exhibitions of contemporary and historical art.", "Education", 1993, "Scripps"),
    ("Steele Hall (Scripps)", 34.10340, -117.71090, 22, 40, 10, 2, -5, "college",
     "Science building with biology and chemistry labs.", "Education", 1947, "Scripps"),
    ("Keck Science Center", 34.10370, -117.71050, 30, 55, 14, 3, 0, "college",
     "Joint science facility shared by Scripps, CMC, and Pitzer for advanced STEM research.", "Education", 1963, "Scripps/CMC/Pitzer"),
    ("Malott Commons (Scripps)", 34.10290, -117.71050, 22, 35, 10, 2, 0, "college",
     "Dining hall and student center at Scripps College.", "Education", 1968, "Scripps"),
    ("Seal Court (Scripps)", 34.10300, -117.71100, 30, 40, 0.3, 1, -5, "college",
     "Central courtyard with the iconic Scripps College seal in the pavement.", "Education", 1930, "Scripps"),
    ("Denison Library (Scripps)", 34.10280, -117.71150, 18, 30, 10, 2, -5, "college",
     "Scripps College library with rare book collections.", "Education", 1931, "Scripps"),
    ("Performing Arts Center (Scripps)", 34.10230, -117.71100, 25, 35, 12, 2, -5, "college",
     "Theater and dance performance venue.", "Education", 2003, "Scripps"),
    ("Humanities Building (Scripps)", 34.10320, -117.71130, 20, 35, 10, 2, -5, "college",
     "Classrooms and faculty offices for humanities departments.", "Education", 1951, "Scripps"),
    ("Browning Hall (Scripps)", 34.10350, -117.71140, 22, 35, 10, 2, -5, "college",
     "Residence hall with Spanish Colonial architecture.", "Education", 1934, "Scripps"),
    ("Toll Hall (Scripps)", 34.10340, -117.71180, 22, 35, 10, 2, -5, "college",
     "Residence hall and oldest dormitory at Scripps.", "Education", 1930, "Scripps"),
    ("Dorsey Hall (Scripps)", 34.10330, -117.71210, 20, 30, 10, 2, -5, "college",
     "Residence hall in the historic campus core.", "Education", 1935, "Scripps"),
    ("Clark Hall (Scripps)", 34.10260, -117.71060, 18, 30, 10, 2, 0, "college",
     "Residence hall at Scripps College.", "Education", 1942, "Scripps"),
    ("Frankel Hall (Scripps)", 34.10240, -117.71030, 18, 30, 10, 2, 0, "college",
     "Residence hall at Scripps College.", "Education", 1952, "Scripps"),
    ("Routt Hall (Scripps)", 34.10270, -117.71010, 18, 30, 10, 2, 0, "college",
     "Residence hall at Scripps College.", "Education", 1960, "Scripps"),
    ("Edwards Humanities Center (Scripps)", 34.10250, -117.71120, 18, 30, 10, 2, -5, "college",
     "Academic building for writing and humanities.", "Education", 2000, "Scripps"),
    ("Gabriella Scripps Hall", 34.10220, -117.71060, 22, 35, 12, 3, 0, "college",
     "Modern residence hall opened for upperclass students.", "Education", 2018, "Scripps"),

    # ═══════════════════════════════════════════════════════════════════════════
    # PITZER COLLEGE
    # ═══════════════════════════════════════════════════════════════════════════
    ("Scott Hall (Pitzer)", 34.10420, -117.70660, 22, 40, 10, 2, 15, "college",
     "Academic building housing social science departments.", "Education", 1965, "Pitzer"),
    ("Avery Hall (Pitzer)", 34.10440, -117.70700, 20, 35, 10, 2, 15, "college",
     "Classroom building for humanities at Pitzer.", "Education", 1966, "Pitzer"),
    ("Fletcher Hall (Pitzer)", 34.10410, -117.70620, 20, 35, 10, 2, 15, "college",
     "Administrative offices and faculty building.", "Education", 1966, "Pitzer"),
    ("McConnell Center (Pitzer)", 34.10380, -117.70650, 25, 40, 10, 2, 10, "college",
     "Student center with dining, lounges, and activity spaces.", "Education", 1967, "Pitzer"),
    ("Gold Student Center (Pitzer)", 34.10390, -117.70700, 20, 30, 8, 2, 10, "college",
     "Student life center and campus hub.", "Education", 2002, "Pitzer"),
    ("Broad Center (Pitzer)", 34.10460, -117.70640, 25, 35, 10, 2, 15, "college",
     "Academic building focused on art and environmental studies.", "Education", 2007, "Pitzer"),
    ("Kaleidoscope Hall (Pitzer)", 34.10440, -117.70600, 18, 30, 10, 2, 15, "college",
     "Environmentally sustainable residence hall.", "Education", 2008, "Pitzer"),
    ("Pitzer Hall", 34.10400, -117.70580, 20, 35, 10, 2, 15, "college",
     "Main academic and administrative building.", "Education", 1968, "Pitzer"),
    ("Sanborn Hall (Pitzer)", 34.10450, -117.70750, 20, 35, 10, 2, 10, "college",
     "Residence hall at Pitzer College.", "Education", 1966, "Pitzer"),
    ("Holden Hall (Pitzer)", 34.10430, -117.70770, 20, 30, 10, 2, 10, "college",
     "Residence hall at Pitzer College.", "Education", 1966, "Pitzer"),
    ("Mead Hall (Pitzer)", 34.10470, -117.70730, 20, 35, 10, 2, 10, "college",
     "Residence hall at Pitzer College.", "Education", 1966, "Pitzer"),
    ("Atherton Hall (Pitzer)", 34.10480, -117.70690, 20, 30, 10, 2, 10, "college",
     "Residence hall on Pitzer's north side.", "Education", 1965, "Pitzer"),
    ("East Hall (Pitzer)", 34.10360, -117.70600, 20, 35, 10, 2, 15, "college",
     "Newer residence hall at Pitzer.", "Education", 2005, "Pitzer"),
    ("West Hall (Pitzer)", 34.10370, -117.70710, 20, 30, 10, 2, 10, "college",
     "Residence hall on Pitzer's western edge.", "Education", 1995, "Pitzer"),
    ("Bernard Hall (Pitzer)", 34.10350, -117.70660, 18, 30, 10, 2, 15, "college",
     "Academic building for environmental analysis.", "Education", 1974, "Pitzer"),
    ("Pitzer Mounds (Robert Redford Conservancy)", 34.10500, -117.70600, 35, 45, 6, 1, 15, "college",
     "Environmental education center and native plant garden.", "Education", 2008, "Pitzer"),

    # ═══════════════════════════════════════════════════════════════════════════
    # CLAREMONT GRADUATE UNIVERSITY (CGU)
    # ═══════════════════════════════════════════════════════════════════════════
    ("Harper Hall (CGU)", 34.10020, -117.71420, 22, 40, 12, 3, -5, "college",
     "Main academic building at CGU housing multiple programs.", "Education", 1930, "CGU"),
    ("Burkle Hall (CGU)", 34.10000, -117.71380, 18, 30, 10, 2, -5, "college",
     "Building for economics and politics programs.", "Education", 1950, "CGU"),
    ("McManus Hall (CGU)", 34.10040, -117.71380, 20, 35, 10, 2, -5, "college",
     "Academic hall for education and humanities.", "Education", 1955, "CGU"),
    ("Stauffer Hall (CGU)", 34.10060, -117.71420, 20, 35, 10, 2, -5, "college",
     "Classrooms and administrative offices.", "Education", 1962, "CGU"),
    ("Albrecht Auditorium (CGU)", 34.10010, -117.71460, 20, 30, 10, 2, -5, "college",
     "Lecture hall and event space at CGU.", "Education", 1970, "CGU"),
    ("CGU Admissions & Financial Aid", 34.09980, -117.71440, 15, 25, 8, 2, -5, "college",
     "Admissions office for Claremont Graduate University.", "Education", 1960, "CGU"),
    ("School of Arts & Humanities (CGU)", 34.10030, -117.71350, 18, 30, 10, 2, -5, "college",
     "Art studios and humanities classrooms.", "Education", 1975, "CGU"),
    ("Drucker School of Management (CGU)", 34.10050, -117.71350, 22, 40, 12, 3, -5, "college",
     "Peter F. Drucker and Masatoshi Ito Graduate School of Management.", "Education", 1971, "CGU"),
    ("CGU Library", 34.10040, -117.71450, 18, 30, 10, 2, -5, "college",
     "Academic library for graduate research.", "Education", 1965, "CGU"),
    ("Center for Information Systems & Technology (CGU)", 34.10070, -117.71370, 18, 28, 10, 2, -5, "college",
     "CISAT building for information technology programs.", "Education", 1990, "CGU"),
    ("Pegasus Plaza (CGU)", 34.10030, -117.71420, 25, 25, 0.3, 1, 0, "college",
     "Central courtyard and gathering space at CGU.", "Education", 1955, "CGU"),

    # ═══════════════════════════════════════════════════════════════════════════
    # KECK GRADUATE INSTITUTE (KGI)
    # ═══════════════════════════════════════════════════════════════════════════
    ("KGI Main Building", 34.10150, -117.71400, 25, 45, 12, 3, -5, "college",
     "Primary academic building for bioscience and pharmacy programs.", "Education", 1997, "KGI"),
    ("KGI Pharmacy Building", 34.10170, -117.71370, 20, 35, 10, 2, -5, "college",
     "School of Pharmacy and Health Sciences.", "Education", 2010, "KGI"),
    ("KGI Henry Riggs Hall", 34.10130, -117.71370, 20, 30, 10, 2, -5, "college",
     "Academic building with labs and classrooms.", "Education", 2004, "KGI"),
    ("KGI Student Commons", 34.10140, -117.71430, 18, 25, 8, 2, -5, "college",
     "Student center and lounge.", "Education", 2005, "KGI"),
    ("KGI Research Labs", 34.10160, -117.71340, 18, 30, 10, 2, -5, "college",
     "Biotech research and teaching laboratories.", "Education", 2008, "KGI"),

    # ═══════════════════════════════════════════════════════════════════════════
    # SHARED / CLAREMONT UNIVERSITY CONSORTIUM (CUC/TCCS)
    # ═══════════════════════════════════════════════════════════════════════════
    ("Honnold-Mudd Library", 34.10080, -117.71200, 35, 55, 14, 3, -5, "college",
     "Shared academic library of The Claremont Colleges, the largest open-stack library in Southern California.", "Education", 1952, "Claremont Colleges"),
    ("The Claremont Colleges Services (TCCS)", 34.10100, -117.71260, 22, 40, 10, 2, -5, "college",
     "Administrative hub providing shared services to all seven Claremont Colleges.", "Education", 1960, "Claremont Colleges"),
    ("Pendleton Business Building", 34.10110, -117.71200, 20, 35, 10, 2, -5, "college",
     "Shared classroom and conference facility.", "Education", 1965, "Claremont Colleges"),
    ("McAlister Center", 34.10090, -117.71300, 18, 25, 8, 2, -5, "college",
     "Interfaith center serving all Claremont Colleges.", "Education", 1963, "Claremont Colleges"),
    ("Huntley Bookstore", 34.10070, -117.71260, 20, 25, 8, 2, -5, "college",
     "Shared bookstore serving all seven Claremont Colleges.", "Education", 1965, "Claremont Colleges"),
    ("Ducey Gymnasium", 34.10200, -117.71150, 30, 45, 12, 2, 0, "college",
     "Shared gymnasium facility for CMS athletics.", "Education", 1963, "Claremont Colleges"),
    ("Axelrood Pool", 34.10220, -117.71120, 25, 35, 4, 1, 0, "college",
     "Shared swimming and diving facility.", "Education", 1963, "Claremont Colleges"),
    ("Zinda Tennis Center", 34.10250, -117.71000, 30, 45, 4, 1, 0, "college",
     "Tennis courts shared by the Claremont Colleges.", "Education", 1980, "Claremont Colleges"),
    ("Stag Field (CMS)", 34.10250, -117.70900, 65, 100, 0.3, 1, 0, "college",
     "Shared football and soccer field for Claremont-Mudd-Scripps athletics.", "Education", 1960, "Claremont Colleges"),
    ("Alumni Field (CMS)", 34.10200, -117.70850, 60, 90, 0.3, 1, 0, "college",
     "Additional athletic field for CMS sports.", "Education", 1965, "Claremont Colleges"),
    ("Garrison Theater", 34.10110, -117.71150, 22, 35, 12, 2, -5, "college",
     "Performance venue for theater and music shared by the colleges.", "Education", 1966, "Claremont Colleges"),
    ("Mgrublian Hall of Science", 34.10140, -117.71150, 20, 30, 10, 2, -5, "college",
     "Science facility for the Claremont Colleges.", "Education", 1968, "Claremont Colleges"),
    ("Tranquada Student Services Center", 34.10090, -117.71240, 18, 28, 8, 2, -5, "college",
     "Shared student health and counseling services.", "Education", 1973, "Claremont Colleges"),
    ("Baxter Lecture Hall", 34.10100, -117.71170, 18, 25, 8, 1, -5, "college",
     "Large shared lecture hall for the Claremont Colleges.", "Education", 1968, "Claremont Colleges"),
    ("Claremont Colleges Library South", 34.10060, -117.71200, 20, 30, 10, 2, -5, "college",
     "Extension of the shared library complex.", "Education", 1970, "Claremont Colleges"),

    # ═══════════════════════════════════════════════════════════════════════════
    # CLAREMONT SCHOOL OF THEOLOGY (CST) - now part of Willamette but buildings remain
    # ═══════════════════════════════════════════════════════════════════════════
    ("Claremont School of Theology", 34.09920, -117.71480, 25, 40, 10, 2, -5, "college",
     "Historic theological seminary campus, part of the Claremont consortium.", "Education", 1957, "CST"),
    ("CST Chapel", 34.09930, -117.71520, 18, 30, 12, 1, -5, "college",
     "Modernist chapel at the School of Theology.", "Education", 1960, "CST"),
]

# Also label the existing unnamed buildings in the college area
EXISTING_BUILDING_LABELS = {
    # ID: (name, type, description, use, yearBuilt)
    470530860: ("CGU Faculty House", "college", "Faculty residence near Claremont Graduate University.", "Education", 1950),
    470530779: ("CGU Student Housing A", "college", "Graduate student apartments at Claremont Graduate University.", "Education", 1970),
    470530903: ("CGU Student Housing B", "college", "Graduate student apartments at Claremont Graduate University.", "Education", 1972),
    470530766: ("CGU Student Housing C", "college", "Graduate student apartments on 6th Street.", "Education", 1975),
    470530857: ("Pomona College Walker Hall", "college", "Residence hall at Pomona College's south campus.", "Education", 1960),
    470530873: ("Pomona College Lawry Court", "college", "Residential courtyard at Pomona College.", "Education", 1968),
    470530875: ("Pomona College Gibson Hall", "college", "Residence hall at Pomona College.", "Education", 1962),
    736263457: ("Pomona College Pendleton Pool", "college", "Pomona College swimming and recreational pool.", "Education", 1968),
}

def main():
    # Load existing data
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "src", "app", "explore", "data")

    with open(os.path.join(data_dir, "village-data.json"), "r") as f:
        village_data = json.load(f)

    with open(os.path.join(data_dir, "building-metadata.json"), "r") as f:
        meta_data = json.load(f)

    existing_ids = {b["id"] for b in village_data["buildings"]}
    existing_names = {b["name"] for b in village_data["buildings"] if b.get("name")}

    # ── Update existing unnamed buildings ───────────────────────────────────
    updated_count = 0
    for b in village_data["buildings"]:
        if b["id"] in EXISTING_BUILDING_LABELS:
            name, btype, desc, use, year = EXISTING_BUILDING_LABELS[b["id"]]
            b["name"] = name
            b["type"] = btype
            meta_data["buildings"][name] = {
                "yearBuilt": year,
                "description": desc,
                "use": use,
            }
            updated_count += 1

    # ── Add new campus buildings ────────────────────────────────────────────
    added_count = 0
    for (name, lat, lng, w, l, h, floors, angle, btype, desc, use, year, college) in CAMPUS_BUILDINGS:
        if name in existing_names:
            print(f"  SKIP (exists): {name}")
            continue

        bid = next_id()
        footprint = make_footprint(lat, lng, w, l, angle)

        building = {
            "id": bid,
            "name": name,
            "type": btype,
            "shop": "",
            "amenity": "",
            "cuisine": "",
            "address": "",
            "height": float(h),
            "levels": floors,
            "footprint": footprint,
        }
        village_data["buildings"].append(building)

        meta_data["buildings"][name] = {
            "yearBuilt": year,
            "description": desc,
            "use": use,
        }

        added_count += 1

    # ── Expand bounds to include all campuses ───────────────────────────────
    all_lats = []
    all_lngs = []
    for b in village_data["buildings"]:
        for pt in b.get("footprint", []):
            lng_pt = CENTER_LNG + pt[0] / LNG_M
            lat_pt = CENTER_LAT + pt[1] / LAT_M
            all_lats.append(lat_pt)
            all_lngs.append(lng_pt)

    village_data["bounds"] = {
        "south": round(min(all_lats) - 0.001, 4),
        "north": round(max(all_lats) + 0.001, 4),
        "west": round(min(all_lngs) - 0.001, 4),
        "east": round(max(all_lngs) + 0.001, 4),
    }

    # ── Write updated data ──────────────────────────────────────────────────
    with open(os.path.join(data_dir, "village-data.json"), "w") as f:
        json.dump(village_data, f, indent=2)

    with open(os.path.join(data_dir, "building-metadata.json"), "w") as f:
        json.dump(meta_data, f, indent=2)

    print(f"\nDone!")
    print(f"  Updated {updated_count} existing unnamed buildings")
    print(f"  Added {added_count} new campus buildings")
    print(f"  Total buildings: {len(village_data['buildings'])}")
    print(f"  Total metadata entries: {len(meta_data['buildings'])}")
    print(f"  New bounds: {village_data['bounds']}")

if __name__ == "__main__":
    main()
