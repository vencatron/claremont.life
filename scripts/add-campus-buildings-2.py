#!/usr/bin/env python3
"""Add additional campus buildings found by researcher."""
import json, math, os

CENTER_LAT = 34.0965
CENTER_LNG = -117.7185
LAT_M = 110540
LNG_M = 111320 * math.cos(CENTER_LAT * math.pi / 180)

NEXT_ID = 900000000

def next_id():
    global NEXT_ID
    NEXT_ID += 1
    return NEXT_ID

def make_footprint(lat, lng, w, l, angle_deg=0):
    cx = (lng - CENTER_LNG) * LNG_M
    cz = (lat - CENTER_LAT) * LAT_M
    hw, hl = w/2, l/2
    a = math.radians(angle_deg)
    corners = [(-hw,-hl),(hw,-hl),(hw,hl),(-hw,hl),(-hw,-hl)]
    return [[round(cx + dx*math.cos(a)-dz*math.sin(a),2), round(cz + dx*math.sin(a)+dz*math.cos(a),2)] for dx,dz in corners]

# (name, lat, lng, w, l, h, floors, angle, description, use, yearBuilt, college)
EXTRA = [
    # Pomona
    ("Sontag Greek Theatre", 34.09720, -117.71220, 35, 40, 4, 1, -5,
     "Open-air amphitheatre for outdoor performances, lectures, and commencement.", "Education", 1914, "Pomona College"),
    ("Haldeman Pool", 34.09750, -117.71540, 25, 50, 2, 1, 0,
     "Competition swimming and diving facility with a 50-meter outdoor pool.", "Education", 1968, "Pomona College"),
    ("Rembrandt Hall", 34.09810, -117.71100, 20, 35, 8, 2, -5,
     "Art department studio with painting, drawing, and printmaking facilities.", "Education", 1959, "Pomona College"),

    # Scripps
    ("Margaret Fowler Garden", 34.10290, -117.71270, 30, 40, 0.3, 1, -5,
     "Iconic walled garden and meditative courtyard at the heart of Scripps, a beloved landmark.", "Education", 1930, "Scripps"),
    ("Graffiti Wall (Scripps)", 34.10260, -117.71280, 3, 25, 3, 1, -5,
     "Iconic campus landmark where students freely paint messages and artwork.", "Education", 1960, "Scripps"),
    ("Revelle Commons (Scripps)", 34.10220, -117.71200, 20, 35, 8, 2, 0,
     "Multipurpose student gathering space with study rooms and lounge seating.", "Education", 2013, "Scripps"),

    # Pitzer
    ("Grove House (Pitzer)", 34.10410, -117.70640, 15, 25, 8, 2, 15,
     "Community space with Grove House Cafe, Women's Center, and the EcoCenter.", "Education", 1975, "Pitzer"),
    ("The Nucleus (Pitzer)", 34.10340, -117.70680, 30, 50, 12, 3, 15,
     "State-of-the-art science facility opened 2024, Pitzer-Scripps STEM partnership.", "Education", 2024, "Pitzer"),
    ("Benson Auditorium (Pitzer)", 34.10450, -117.70690, 18, 30, 10, 1, 15,
     "Primary lecture and performance auditorium for campus events.", "Education", 1966, "Pitzer"),

    # HMC
    ("Libra Complex (HMC)", 34.10560, -117.70950, 50, 70, 12, 3, 0,
     "Largest residential complex at HMC with famous student-painted tunnels beneath.", "Education", 1967, "Harvey Mudd"),
    ("Jacobs Science Center (HMC)", 34.10590, -117.71070, 20, 35, 10, 2, 0,
     "Advanced research labs and collaborative workspaces for students.", "Education", 1988, "Harvey Mudd"),

    # CMC
    ("Emett Student Center (CMC)", 34.10130, -117.70850, 20, 35, 8, 2, 5,
     "Student union with lounges, the Hub dining venue, and organization offices.", "Education", 1990, "CMC"),
    ("Flamson Plaza (CMC)", 34.10100, -117.70870, 40, 50, 0.3, 1, 0,
     "Central campus plaza at the heart of CMC, anchored by the Kravis Center.", "Education", 1965, "CMC"),
    ("Mgrublian Center for Human Rights (CMC)", 34.10110, -117.70800, 15, 25, 8, 2, 5,
     "Center for human rights education, research, and advocacy.", "Education", 2011, "CMC"),

    # CGU
    ("Botany Building (CGU)", 34.10070, -117.71370, 15, 25, 8, 2, -5,
     "Houses Rancho Santa Ana Botanic Garden herbarium and botanical research.", "Education", 1951, "CGU"),
    ("DesCombes Family Quadrangle (CGU)", 34.10030, -117.71400, 40, 50, 0.3, 1, 0,
     "Central green courtyard and gathering space at the heart of CGU.", "Education", 1955, "CGU"),
    ("Yuhaaviatam Center for Health Studies (CGU)", 34.10050, -117.71320, 25, 40, 10, 2, -5,
     "Community health research center on CGU's campus.", "Education", 2019, "CGU"),

    # KGI
    ("KGI Minerva Building", 34.10170, -117.71340, 25, 45, 10, 2, -5,
     "Research and classroom building for pharmacy, genetics, and biotech.", "Education", 2006, "KGI"),
    ("KGI Oasis Commons East", 34.10180, -117.71380, 25, 55, 16, 4, -5,
     "Four-story residential building with 419 beds and ground-floor classrooms.", "Education", 2018, "KGI"),
    ("KGI Oasis Commons West", 34.10190, -117.71420, 25, 55, 16, 4, -5,
     "Residential tower with pool, spa, fitness center, and study areas.", "Education", 2018, "KGI"),
    ("Technip Building (KGI)", 34.10160, -117.71300, 25, 50, 10, 2, -5,
     "Administrative offices and support services building.", "Education", 2000, "KGI"),

    # Shared
    ("EmPOWER Center", 34.10090, -117.71280, 12, 20, 6, 1, -5,
     "Consortium center for sexual violence prevention, education, and support.", "Education", 2015, "Claremont Colleges"),
    ("Campus Safety Building", 34.10080, -117.71220, 15, 25, 6, 1, -5,
     "Campus safety and security HQ serving all seven Claremont Colleges.", "Education", 1970, "Claremont Colleges"),
    ("Claremont University Consortium Office", 34.10100, -117.71220, 20, 40, 10, 2, -5,
     "Central admin offices coordinating shared services across the seven colleges.", "Education", 1960, "Claremont Colleges"),
]

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, "src", "app", "explore", "data")

with open(os.path.join(data_dir, "village-data.json")) as f:
    vd = json.load(f)
with open(os.path.join(data_dir, "building-metadata.json")) as f:
    md = json.load(f)
with open(os.path.join(data_dir, "business-enrichment.json")) as f:
    bd = json.load(f)

existing_names = {b['name'] for b in vd['buildings'] if b.get('name')}
biz_names = {b['name'] for b in bd['businesses']}

added = 0
for name, lat, lng, w, l, h, floors, angle, desc, use, year, college in EXTRA:
    if name in existing_names:
        print(f"  SKIP: {name}")
        continue
    bid = next_id()
    fp = make_footprint(lat, lng, w, l, angle)
    vd['buildings'].append({
        "id": bid, "name": name, "type": "college",
        "shop": "", "amenity": "", "cuisine": "", "address": "",
        "height": float(h), "levels": floors, "footprint": fp
    })
    md['buildings'][name] = {"yearBuilt": year, "description": desc, "use": use}

    cx = sum(p[0] for p in fp) / len(fp)
    cz = sum(p[1] for p in fp) / len(fp)
    if name not in biz_names:
        bd['businesses'].append({"name": name, "type": "college", "x": round(cx), "z": round(cz)})
    added += 1

# Update bounds
all_lats, all_lngs = [], []
for b in vd['buildings']:
    for pt in b.get('footprint', []):
        all_lngs.append(CENTER_LNG + pt[0] / LNG_M)
        all_lats.append(CENTER_LAT + pt[1] / LAT_M)
vd['bounds'] = {
    "south": round(min(all_lats)-0.001, 4),
    "north": round(max(all_lats)+0.001, 4),
    "west": round(min(all_lngs)-0.001, 4),
    "east": round(max(all_lngs)+0.001, 4),
}

for path, data in [(os.path.join(data_dir,"village-data.json"), vd),
                    (os.path.join(data_dir,"building-metadata.json"), md),
                    (os.path.join(data_dir,"business-enrichment.json"), bd)]:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

print(f"\nAdded {added} extra buildings")
print(f"Total buildings: {len(vd['buildings'])}")
print(f"Total businesses: {len(bd['businesses'])}")
print(f"Total metadata: {len(md['buildings'])}")
