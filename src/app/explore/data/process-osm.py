#!/usr/bin/env python3
"""
Process OSM data into 3D-ready JSON for the Village explorer.
Converts lat/lng building footprints and streets into local meter coordinates.
"""
import json
import math

# Center of the Village (Yale & 2nd St intersection approximately)
CENTER_LAT = 34.09650
CENTER_LNG = -117.71850

# Tighter bounding box - just the commercial Village core
# Roughly: 1st St (south) to 4th St (north), Indian Hill (west) to College Ave (east)
VILLAGE_BOUNDS = {
    'south': 34.0940,
    'north': 34.0990,
    'west': -117.7220,
    'east': -117.7145
}

def latlng_to_meters(lat, lng):
    """Convert lat/lng to local meter coordinates relative to center."""
    dx = (lng - CENTER_LNG) * math.cos(math.radians(CENTER_LAT)) * 111319.9
    dz = (lat - CENTER_LAT) * 111319.9
    return round(dx, 2), round(dz, 2)

def in_bounds(lat, lng):
    return (VILLAGE_BOUNDS['south'] <= lat <= VILLAGE_BOUNDS['north'] and
            VILLAGE_BOUNDS['west'] <= lng <= VILLAGE_BOUNDS['east'])

def process_buildings(data):
    elements = data['elements']
    nodes = {}
    for e in elements:
        if e['type'] == 'node':
            nodes[e['id']] = (e['lat'], e['lon'])
    
    buildings = []
    for e in elements:
        if e['type'] != 'way' or 'tags' not in e:
            continue
        if 'building' not in e.get('tags', {}):
            continue
        
        # Get footprint coordinates
        coords = []
        all_in = True
        for nid in e.get('nodes', []):
            if nid in nodes:
                lat, lng = nodes[nid]
                if not in_bounds(lat, lng):
                    all_in = False
                coords.append(nodes[nid])
        
        if not coords or not all_in:
            continue
        
        # Convert to meters
        footprint = []
        for lat, lng in coords:
            x, z = latlng_to_meters(lat, lng)
            footprint.append([x, z])
        
        tags = e.get('tags', {})
        name = tags.get('name', '')
        building_type = tags.get('building', 'yes')
        levels = int(tags.get('building:levels', '1'))
        
        # Estimate height: commercial buildings ~4m per floor
        height = levels * 4.0
        if building_type in ('commercial', 'retail'):
            height = max(height, 5.0)
        elif building_type in ('apartments', 'residential'):
            height = max(height, 8.0)
        elif building_type == 'church':
            height = max(height, 12.0)
        
        # Get shop/amenity info
        shop = tags.get('shop', '')
        amenity = tags.get('amenity', '')
        cuisine = tags.get('cuisine', '')
        addr = tags.get('addr:housenumber', '') + ' ' + tags.get('addr:street', '')
        addr = addr.strip()
        
        buildings.append({
            'id': e['id'],
            'name': name,
            'type': building_type,
            'shop': shop,
            'amenity': amenity,
            'cuisine': cuisine,
            'address': addr,
            'height': height,
            'levels': levels,
            'footprint': footprint,
        })
    
    return buildings

def process_streets(data):
    elements = data['elements']
    nodes = {}
    for e in elements:
        if e['type'] == 'node':
            nodes[e['id']] = (e['lat'], e['lon'])
    
    streets = []
    for e in elements:
        if e['type'] != 'way' or 'tags' not in e:
            continue
        tags = e.get('tags', {})
        highway = tags.get('highway', '')
        if highway not in ('primary', 'secondary', 'tertiary', 'residential', 'service', 'footway', 'cycleway', 'pedestrian'):
            continue
        
        coords = []
        any_in = False
        for nid in e.get('nodes', []):
            if nid in nodes:
                lat, lng = nodes[nid]
                if in_bounds(lat, lng):
                    any_in = True
                x, z = latlng_to_meters(lat, lng)
                coords.append([x, z])
        
        if not coords or not any_in:
            continue
        
        name = tags.get('name', '')
        
        # Width based on road type
        widths = {
            'primary': 14,
            'secondary': 12,
            'tertiary': 10,
            'residential': 8,
            'service': 6,
            'footway': 2,
            'cycleway': 2,
            'pedestrian': 4,
        }
        
        streets.append({
            'name': name,
            'type': highway,
            'width': widths.get(highway, 8),
            'points': coords,
        })
    
    return streets

# Load and process
with open('/tmp/village_buildings.json') as f:
    buildings = process_buildings(json.load(f))

with open('/tmp/village_streets.json') as f:
    streets = process_streets(json.load(f))

# Add known Village businesses that might not have names in OSM
# These are the actual shops on Yale Ave and nearby
KNOWN_BUSINESSES = {
    'Yale Avenue': [
        "Bert & Rocky's", "The Press", "Eureka! Burger", "Some Crust Bakery",
        "Viva Madrid", "The Back Abbey", "Bardot", "Le Petit Paris",
        "Cafe Con Libros", "Walter's Restaurant", "Tutti Mangia",
        "The Claremont Forum", "Rhino Records", "Village Venture",
    ],
    'Indian Hill Boulevard': [
        "In-N-Out Burger", "Trader Joe's", "CVS",
    ],
    '1st Street': [
        "The Whisper House",
    ]
}

result = {
    'center': {'lat': CENTER_LAT, 'lng': CENTER_LNG},
    'bounds': VILLAGE_BOUNDS,
    'buildings': buildings,
    'streets': streets,
    'knownBusinesses': KNOWN_BUSINESSES,
    'stats': {
        'buildingCount': len(buildings),
        'streetCount': len(streets),
        'namedBuildings': len([b for b in buildings if b['name']]),
    }
}

# Write output
outpath = '/Users/ronnie/claw2/claremont.life/src/app/explore/data/village-data.json'
with open(outpath, 'w') as f:
    json.dump(result, f, indent=2)

print(f"Buildings: {len(buildings)} ({len([b for b in buildings if b['name']])} named)")
print(f"Streets: {len(streets)}")
print(f"\nNamed buildings:")
for b in sorted(buildings, key=lambda x: x['name']):
    if b['name']:
        print(f"  {b['name']} ({b['type']}, {b['height']}m, {b['levels']}L)")
print(f"\nStreets:")
for s in sorted(streets, key=lambda x: x['name']):
    if s['name']:
        print(f"  {s['name']} ({s['type']}, {s['width']}m)")
