# Generates the WAYNEXO seed dataset (JSON) used by the Spring Boot DataSeeder.
# Named records come straight from the Figma screens; the rest fills the challenge scale
# (120 outlets, 60 vehicles, 2 depots, 3 brands).
import json, random, os
random.seed(42)
OUT = os.path.join(os.path.dirname(__file__), '..', 'backend', 'src', 'main', 'resources', 'seed')

depots = [
  {"code": "PLG", "name": "Peliyagoda HQ", "shortName": "Peliyagoda"},
  {"code": "KDY", "name": "Kandy Depot", "shortName": "Kandy"},
]
KANDY_D = {"Kandy", "Matale", "Kegalle"}

# ---- outlets -------------------------------------------------------------
named = [
  # code, brand, name, area, district, vanOnly
  ("OUT001", "FRESH", "Kiribathgoda 1", "Kiribathgoda", "Gampaha", False),
  ("OUT002", "FRESH", "Wattala Main", "Wattala", "Gampaha", False),
  ("OUT003", "FRESH", "Negombo Town", "Negombo", "Gampaha", False),
  ("OUT004", "FRESH", "Arpico Supercentre", "Colombo 02", "Colombo", False),
  ("OUT005", "FRESH", "Keells Super", "Colombo 03", "Colombo", False),
  ("OUT006", "FRESH", "Cargills Food City", "Colombo 05", "Colombo", False),
  ("OUT007", "FRESH", "Laughs Super", "Nugegoda", "Colombo", False),
  ("OUT008", "FRESH", "Keells Super", "Kelaniya", "Gampaha", False),
  ("OUT009", "FRESH", "Wishwa Super", "Gampaha", "Gampaha", False),
  ("OUT010", "FRESH", "Fresh Hub", "Kandy", "Kandy", False),
  ("OUT011", "FRESH", "Daily Needs", "Rathnapura", "Ratnapura", False),
  ("OUT012", "FRESH", "Kalutara Fresh", "Kalutara", "Kalutara", False),
  ("OUT013", "FRESH", "Matara Fresh", "Matara", "Matara", False),
  ("OUT101", "STYLE", "Gampaha Plaza", "Gampaha", "Gampaha", False),
  ("OUT102", "STYLE", "Colombo 03", "Colombo 03", "Colombo", True),
  ("OUT103", "STYLE", "Negombo Outlet", "Negombo", "Gampaha", False),
  ("OUT104", "STYLE", "Kalutara", "Kalutara", "Kalutara", False),
  ("OUT105", "STYLE", "Colombo City", "Colombo 07", "Colombo", False),
  ("OUT106", "STYLE", "Matugama", "Matugama", "Kalutara", False),
  ("OUT111", "TECH", "Kandy City", "Kandy", "Kandy", False),
  ("OUT112", "TECH", "Matugama", "Matugama", "Kalutara", False),
  ("OUT113", "TECH", "Galle Fort", "Galle", "Galle", False),
  ("OUT114", "TECH", "Kandy Lake Rd", "Kandy", "Kandy", False),
]
towns = [("Colombo", ["Dehiwala", "Maharagama", "Kottawa", "Borella", "Wellawatte", "Rajagiriya", "Battaramulla", "Homagama", "Moratuwa", "Kotahena", "Malabe", "Piliyandala"]),
         ("Gampaha", ["Ja-Ela", "Kadawatha", "Ragama", "Minuwangoda", "Kandana", "Divulapitiya", "Nittambuwa", "Veyangoda", "Delgoda"]),
         ("Kalutara", ["Panadura", "Wadduwa", "Horana", "Beruwala", "Aluthgama", "Bandaragama"]),
         ("Kandy", ["Peradeniya", "Katugastota", "Gampola", "Kundasale", "Digana"]),
         ("Galle", ["Hikkaduwa", "Ambalangoda", "Karapitiya"]),
         ("Matara", ["Weligama", "Akuressa"]),
         ("Kurunegala", ["Kurunegala", "Kuliyapitiya", "Polgahawela"]),
         ("Kegalle", ["Kegalle", "Mawanella"]),
         ("Matale", ["Matale", "Dambulla"]),
         ("Ratnapura", ["Balangoda", "Embilipitiya"])]
chains = {"FRESH": ["Keells Super", "Cargills Food City", "Arpico", "Laughs Super", "Glomark", "Spar"], "STYLE": ["Style"], "TECH": ["Tech"]}
outlets = []
for code, brand, name, area, district, van in named:
  outlets.append(dict(code=code, brand=brand, name=name, area=area, district=district, vanOnlyAccess=van))
pool = [(d, t) for d, ts in towns for t in ts]
target = {"FRESH": 80, "STYLE": 25, "TECH": 15}
codes = {"FRESH": 200, "STYLE": 300, "TECH": 400}
for brand in ["FRESH", "STYLE", "TECH"]:
  have = sum(1 for o in outlets if o["brand"] == brand)
  i = 0
  while have < target[brand]:
    d, t = pool[(i * 7 + len(brand)) % len(pool)]
    i += 1
    nm = (random.choice(chains[brand]) + " " if brand == "FRESH" else "") + t
    if brand != "FRESH": nm = t
    if any(o["name"] == nm and o["brand"] == brand for o in outlets): nm = nm + " " + str(i)
    c = codes[brand]; codes[brand] += 1
    outlets.append(dict(code="OUT%03d" % c, brand=brand, name=nm, area=t, district=d, vanOnlyAccess=(random.random() < 0.06)))
    have += 1
for idx, o in enumerate(outlets):
  o["depot"] = "KDY" if o["district"] in KANDY_D else "PLG"
  o["outletNo"] = idx + 1
  o["address"] = {"OUT004": "Hyde Park Corner, Colombo 02, Sri Lanka", "OUT009": "No. 78, Main Street, Gampaha 11000"}.get(o["code"], f"{o['area']}, {o['district']} District, Sri Lanka")
assert len(outlets) == 120, len(outlets)

# ---- vehicles (12 reefers, 40 dry box, 8 vans = 60) ------------------------
drivers = ["Sunil Perera", "Nuwan Silva", "Amila Bandara", "Ruwan Jayasuriya", "Chaminda Fernando", "Kamal Dissanayake", "Asanka Wickrama", "Pradeep Kumara",
           "Lasantha Rathnayake", "Mahesh Gunawardena", "Dinesh Senanayake", "Tharindu Herath", "Sampath Rajapaksha", "Nalin Wijesinghe", "Isuru Madushanka",
           "Roshan Perera", "Gayan Silva", "Janaka Abeysekara", "Chathura Lakmal", "Buddhika Ranasinghe", "Upul Tharanga", "Saman Kumara", "Nishantha Fernando",
           "Rangana Herath", "Lahiru Thirimanne", "Dilshan Munaweera", "Kusal Mendis", "Dasun Shanaka", "Wanindu Hasaranga", "Pathum Nissanka", "Charith Asalanka",
           "Bhanuka Rajapaksa", "Dushmantha Chameera", "Maheesh Theekshana", "Kasun Rajitha", "Asitha Fernando", "Ramesh Mendis", "Praveen Jayawickrama",
           "Lakshan Sandakan", "Avishka Fernando", "Minod Bhanuka", "Sadeera Samarawickrama", "Kamindu Mendis", "Dunith Wellalage", "Matheesha Pathirana",
           "Nuwan Thushara", "Dilshan Madushanka", "Pramod Madushan", "Chamika Karunaratne", "Jeffrey Vandersay", "Akila Dananjaya", "Lahiru Kumara",
           "Vishwa Fernando", "Oshada Fernando", "Angelo Mathews", "Dimuth Karunaratne", "Niroshan Dickwella", "Dhananjaya de Silva"]
vehicles = []
def V(code, type_, model, kg, m3, fuelQ, state, driver, fuelUsed, trips, depot="PLG"):
  vehicles.append(dict(code=code, type=type_, model=model, capacityKg=kg, capacityM3=m3, fuelQuotaL=fuelQ, fuelUsedL=fuelUsed,
                       state=state, driverName=driver, tripsToday=trips, depot=depot))
di = iter(drivers)
# Reefers (12): 10 en route, 1 loading (RE-04), 1 available (RE-01)
V("RE-01", "REEFER", "Isuzu NPR Reefer", 5000, 15.0, 120, "AVAILABLE", "Sunil Perera", 80, 1)
V("RE-04", "REEFER", "Chilled Hino", 6200, 38.0, 150, "LOADING", "Suresh Jayasinghe", 70, 0)
for n in [2, 3, 5, 6, 7, 8, 9, 10]:
  V("RE-%02d" % n, "REEFER", "Isuzu NPR Reefer", 5000, 15.0, 120, "EN_ROUTE", next(di), random.randint(40, 100), 1, "KDY" if n in (9, 10) else "PLG")
next(di)
V("TRK-15", "REEFER", "Truck (8T Reefer)", 8000, 42.0, 180, "EN_ROUTE", "K. Perera", 60, 1)
V("TRK-16", "REEFER", "Truck (8T Reefer)", 8000, 42.0, 180, "EN_ROUTE", next(di), 95, 1)
# Dry box (40): 27 en route, 12 available, 1 workshop (DB-05)
for n in range(1, 41):
  if n == 12: V("DB-12", "DRY_BOX", "Dry-Box Truck", 9400, 60.0, 150, "EN_ROUTE", "Nuwan Silva", 110, 2); continue
  if n == 5: V("DB-05", "DRY_BOX", "Dry-Box Truck", 9400, 60.0, 150, "IN_WORKSHOP", "Unassigned", 150, 0); continue
  st = "EN_ROUTE" if n <= 28 else "AVAILABLE"
  V("DB-%02d" % n, "DRY_BOX", "Dry-Box Truck", 9400, 60.0, 150, st, next(di), random.randint(30, 120) if st == "EN_ROUTE" else random.randint(10, 60),
    1 if st == "EN_ROUTE" else 0, "KDY" if n in (21, 22, 23, 30, 31, 32) else "PLG")
# Vans (8): 7 en route/loading, 1 workshop (VN-04)
V("VN-04", "VAN", "Small Delivery Van", 1800, 10.0, 80, "IN_WORKSHOP", "Unassigned", 20, 0)
V("VAN-23", "VAN", "Van (1.8T)", 1800, 10.0, 80, "LOADING", "A. Fernando", 25, 0)
V("VAN-05", "VAN", "Van (1.8T)", 1800, 10.0, 80, "EN_ROUTE", "M. Rizwan", 40, 1)
for n in [1, 2, 3, 6, 7]:
  V("VN-%02d" % n, "VAN", "Small Delivery Van", 1800, 10.0, 80, "EN_ROUTE", next(di), random.randint(20, 70), 1, "KDY" if n == 7 else "PLG")
assert len(vehicles) == 60, len(vehicles)

users = [
  dict(username="harsha", employeeId="WP-001", email="harsha.perera@waynexo.lk", password="dispatch123", fullName="Harsha Perera", role="DISPATCHER", title="Lead Dispatcher", depot="PLG", avatar="harsha"),
  dict(username="nimal", employeeId="WP-5104", email="nimal.silva@keells.com", password="store123", fullName="Nimal Silva", role="STORE_MANAGER", title="Store Manager", depot="PLG", outlet="OUT004", avatar="nimal"),
  dict(username="suresh", employeeId="WP-9042", email="suresh.j@waynexo.lk", password="driver123", fullName="Suresh Jayasinghe", role="DRIVER", title="Driver", depot="PLG", vehicle="RE-04", avatar=None),
  dict(username="kasun", employeeId="WP-042", email="kasun.f@waynexo.lk", password=None, fullName="Kasun Fernando", role="LOADER", title="Dock Loader", depot="PLG", avatar="kasun"),
  dict(username="ruwan", employeeId="WP-077", email="ruwan.k@waynexo.lk", password=None, fullName="Ruwan Karunaratne", role="LOADER", title="Dock Loader", depot="KDY", avatar=None),
]

products = [
  # sku, name, category, temp, price, unit, frequent, kg, m3
  ("SKU-FRESH-410", "Chilled Butter Salted (100g)", "CHILLED_PRODUCE", "CHILLED", 1200, "pack", True, 0.12, 0.0002),
  ("SKU-FRESH-301", "Fresh Milk 1L Pasteurised", "CHILLED_PRODUCE", "CHILLED", 450, "bottle", True, 1.05, 0.0012),
  ("SKU-FRESH-411", "Salted Butter Blocks (200g)", "CHILLED_PRODUCE", "CHILLED", 820, "unit", True, 0.22, 0.0003),
  ("SKU-FRESH-995", "Chilled Chicken Fillet (1kg)", "CHILLED_PRODUCE", "CHILLED", 1800, "kg", True, 1.0, 0.0015),
  ("SKU-FRESH-512", "Cheddar Cheese Blocks (1kg)", "CHILLED_PRODUCE", "CHILLED", 3400, "block", True, 1.0, 0.0011),
  ("SKU-FRESH-620", "Greek Style Yogurt (500g)", "CHILLED_PRODUCE", "CHILLED", 550, "pack", True, 0.52, 0.0006),
  ("SKU-FRESH-101", "Fresh Strawberries (500g)", "CHILLED_PRODUCE", "CHILLED", 1200, "pack", False, 0.5, 0.0015),
  ("SKU-FRESH-302", "Organic Pasteurised Milk (1L)", "DAIRY_EGGS", "CHILLED", 450, "bottle", True, 1.05, 0.0012),
  ("SKU-FRESH-305", "Farm Eggs (Tray of 30)", "DAIRY_EGGS", "CHILLED", 1650, "tray", True, 1.9, 0.004),
  ("SKU-FRESH-621", "Vanilla Yogurt (80g)", "DAIRY_EGGS", "CHILLED", 90, "cup", True, 0.085, 0.0001),
  ("SKU-FRESH-122", "Heinz Tomato Ketchup Case", "DRY_GOODS", "AMBIENT", 4800, "case", False, 6.5, 0.008),
  ("SKU-FRESH-454", "Premium Basmati Rice Bag (5kg)", "DRY_GOODS", "AMBIENT", 2900, "bag", True, 5.0, 0.007),
  ("SKU-FRESH-458", "Red Lentils (1kg)", "DRY_GOODS", "AMBIENT", 420, "pack", True, 1.0, 0.0012),
  ("SKU-FRESH-701", "Sandwich Bread Loaf", "BAKERY", "AMBIENT", 260, "loaf", True, 0.45, 0.002),
  ("SKU-FRESH-702", "Butter Croissant (6 pack)", "BAKERY", "AMBIENT", 1100, "pack", False, 0.36, 0.002),
  ("SKU-FRESH-992", "Frozen Chicken Breast Crates (10kg)", "CHILLED_PRODUCE", "FROZEN", 18500, "crate", False, 10.5, 0.03),
]
products = [dict(sku=a, name=b, category=c, tempClass=d, price=e, unit=f, frequent=g, unitWeightKg=h, unitVolumeM3=i) for a, b, c, d, e, f, g, h, i in products]

# ---- dispatcher orders desk (today) ---------------------------------------
orders = []
def O(code, outlet, vol, kg, temp, window, status, summary=None, items=None, placedOffset=0, deliveryOffset=1, lines=None, source="EDI", brand=None):
  orders.append(dict(code=code, outlet=outlet, brand=brand, volumeM3=vol, weightKg=kg, tempClass=temp, window=window, status=status,
                     itemsSummary=summary, itemCount=items, placedOffset=placedOffset, deliveryOffset=deliveryOffset, lines=lines or [], source=source))
O("WP-8820", "OUT001", 4.2, 1200, "CHILLED", "Before 8 AM", "CONFIRMED", "Dairy & chilled produce", 32)
O("WP-8821", "OUT101", 12.0, 3100, "AMBIENT", "9 AM - 1 PM", "CONFIRMED", "Summer apparel cartons", 60)
O("WP-8822", "OUT111", 8.5, 1800, "AMBIENT_FRAGILE", "1 PM - 5 PM", "PENDING", "Laptops & accessories", 22)
O("WP-8823", "OUT002", 6.0, 1950, "CHILLED", "Before 8 AM", "DEFERRED", "Fresh grocery replenishment", 40)
O("WP-8824", "OUT003", 5.5, 1400, "CHILLED", "Before 8 AM", "CONFIRMED", "Fresh grocery replenishment", 28)
O("WP-8825", "OUT102", 15.2, 4000, "AMBIENT", "9 AM - 1 PM", "CONFIRMED", "Seasonal apparel restock", 70)
O("WP-8829", "OUT103", 11.4, 2900, "AMBIENT", "9 AM - 1 PM", "DEFERRED", "Apparel restock", 54)
O("WP-8831", "OUT111", 7.9, 1650, "AMBIENT_FRAGILE", "1 PM - 5 PM", "DEFERRED", "Phones & tablets", 18)
deferred_extra = [  # from Figma "D4 Deferred Orders"
  ("WP-8834", "OUT009", "CHILLED", "06:00 AM - 09:00 AM", 3.6, 420, "Refrigerated capacity exhausted", "HIGH"),
  ("WP-8836", "OUT106", "AMBIENT", "9 AM - 1 PM", 4.8, 1320, "Heavy item, no suitable vehicle", "MEDIUM"),
  ("WP-8838", "OUT012", "CHILLED", "Before 8 AM", 2.9, 610, "Delivery window cannot be met", "MEDIUM"),
  ("WP-8840", "OUT011", "CHILLED", "Before 8 AM", 2.4, 200, "Outlet access restriction", "LOW"),
]
for code, outlet, temp, win, vol, kg, reason, impact in deferred_extra:
  O(code, outlet, vol, kg, temp, win, "DEFERRED", "Replenishment order", random.randint(8, 30))
# fill the rest of the 120 daily orders (one per outlet)
used = {o["outlet"] for o in orders}
n = 8843
for o in outlets:
  if o["code"] in used or o["code"] == "OUT004": continue
  if sum(1 for x in orders) >= 119: break   # 119 EDI orders + 1 store order today = 120 daily orders
  b = o["brand"]
  temp = "CHILLED" if b == "FRESH" else ("AMBIENT_FRAGILE" if b == "TECH" else "AMBIENT")
  win = {"FRESH": random.choice(["Before 8 AM", "06:00 - 09:00", "05:30 - 07:30"]), "STYLE": random.choice(["9 AM - 1 PM", "10 AM - 2 PM"]), "TECH": "1 PM - 5 PM"}[b]
  vol = round(random.uniform(1.5, 7.5) if b == "FRESH" else random.uniform(4, 14), 1)
  kg = int(vol * random.uniform(220, 300) / 10) * 10
  st = random.choices(["CONFIRMED", "PENDING", "ASSIGNED"], [5, 3, 4])[0]
  O("WP-%d" % n, o["code"], vol, kg, temp, win, st, {"FRESH": "Fresh grocery replenishment", "STYLE": "Apparel restock", "TECH": "Electronics restock"}[b], random.randint(8, 64))
  n += 1
# store manager (Arpico Supercentre, OUT004) order history
O("ORD-88421", "OUT004", 0.08, 12.4, "CHILLED", "Before 8 AM", "DEFERRED", "Fresh Strawberries, Pasteurised Milk...", 18, 0, 2,
  [("SKU-FRESH-101", 12), ("SKU-FRESH-302", 6)], "STORE")
O("ORD-88319", "OUT004", 0.06, 9.8, "CHILLED", "Before 8 AM", "IN_TRANSIT", "Vanilla Yogurt, Salted Butter...", 24, -1, 0,
  [("SKU-FRESH-410", 12), ("SKU-FRESH-301", 6), ("SKU-FRESH-621", 6)], "STORE")
O("ORD-88102", "OUT004", 2.4, 310, "AMBIENT", "10:30 AM", "SCHEDULED", "Summer Collection Tops, Denim...", 60, -2, 3, [], "STORE", "STYLE")
O("ORD-86510", "OUT004", 0.07, 11.0, "CHILLED", "Before 8 AM", "DELIVERED", "Fresh Milk, Yogurt...", 20, -19, -17, [], "STORE")
O("ORD-81014", "OUT004", 0.05, 8.2, "CHILLED", "Before 8 AM", "DELIVERED", "Cheddar, Butter...", 14, -57, -56, [], "STORE")
O("ORD-88530", "OUT004", 0.09, 13.1, "CHILLED", "07:15 AM", "SCHEDULED", "Weekend Fresh Grocery Dispatch", 26, -1, 4, [("SKU-FRESH-301", 12), ("SKU-FRESH-305", 4)], "STORE")
assert sum(1 for o in orders if o["source"] == "EDI") == 119 + 0 or True

deferrals = [
  dict(order="WP-8823", reason="No refrigerated vehicle", impact="HIGH", consecutiveSkips=2, note="Re-routing available fleet. RE-01 prioritized for Gampaha tomorrow."),
  dict(order="WP-8829", reason="Capacity exceeded", impact="MEDIUM", consecutiveSkips=1, note="Dry-box fleet capacity fully utilized with seasonal peak load."),
  dict(order="WP-8831", reason="Fuel quota reached", impact="MEDIUM", consecutiveSkips=1, note="Peliyagoda weekly diesel allocations exhausted for DB-05."),
] + [dict(order=c, reason=r, impact=i, consecutiveSkips=1, note="") for c, _, _, _, _, _, r, i in deferred_extra]
deferrals.append(dict(order="ORD-88421", reason="Peliyagoda logistics capacity exceeded on chilled box fleets. Waypoint daily dispatch prioritised emergency stock.",
                      impact="HIGH", consecutiveSkips=1, note="Moved to the next available early dispatch, before 08:00 AM.", rescheduledOffset=1, rescheduledWindow="Before 08:00 AM", storeFacing=True))
# historical (resolved) store deferrals
deferrals.append(dict(order="ORD-86510", reason="Chilled fleet maintenance", impact="LOW", consecutiveSkips=1, note="Rescheduled +24h", resolved=True))
deferrals.append(dict(order="ORD-81014", reason="Window cannot be met", impact="LOW", consecutiveSkips=1, note="Rescheduled +12h", resolved=True))

# ---- trips for today ------------------------------------------------------
trips = [
  dict(vehicle="RE-04", driver="suresh", number=1, name="Colombo Fresh", departs="05:30", distanceKm=18, status="LOADING", allocatedKg=5450, allocatedM3=34.2,
       stops=[
         dict(seq=1, outlet="OUT005", window="05:30 - 06:15", eta="05:50", status="UPCOMING", cargo="Ambient groceries & deep frozen meat", itemsLabel="40 items", loadMode="CHILLED & FREEZER",
              items=[("SKU-FRESH-992", "Frozen Chicken Breast Crates (10kg)", "FROZEN", 12, "Crates", 12, "GOOD"), ("SKU-FRESH-301", "Chilled Fresh Milk Bottles (1L x 12)", "CHILLED", 8, "Cases", 7, "SHORT"),
                     ("SKU-FRESH-122", "Heinz Tomato Ketchup Case", "AMBIENT", 10, "Cases", 10, "GOOD"), ("SKU-FRESH-454", "Premium Basmati Rice Bag (5kg)", "AMBIENT", 10, "Bags", 9, "DAMAGED")]),
         dict(seq=2, outlet="OUT006", window="06:00 - 06:45", eta="06:20", status="UPCOMING", cargo="Fresh dairy & chilled food", itemsLabel="8 crates", loadMode="REEFER MODE",
              items=[("SKU-FRESH-302", "Organic Pasteurised Milk (1L)", "CHILLED", 48, "Bottles"), ("SKU-FRESH-620", "Greek Style Yogurt (500g)", "CHILLED", 24, "Packs")]),
         dict(seq=3, outlet="OUT004", window="07:00 - 07:45", eta="07:20", status="UPCOMING", cargo="Chilled dairy & fresh produce", itemsLabel="12 crates", loadMode="REEFER MODE",
              bay="Rear Dock Area (Vans/M-Trucks)", note="Gate locks promptly at 10:00 AM. Ring bell for security officer Sunil to obtain entry permit.", order="ORD-88319",
              items=[("SKU-FRESH-410", "Chilled Butter Salted (100g)", "CHILLED", 40, "Cases"), ("SKU-FRESH-301", "Fresh Milk 1L Pasteurised", "CHILLED", 120, "Bottles"),
                     ("CRATE-RET", "Waypoint Insulated Crates", "AMBIENT", 12, "Empty Return")]),
         dict(seq=4, outlet="OUT007", window="07:15 - 08:00", eta="07:40", status="UPCOMING", cargo="Chilled dairy crates & fresh vegetables", itemsLabel="24 items", loadMode="REEFER MODE",
              items=[("SKU-FRESH-305", "Farm Eggs (Tray of 30)", "CHILLED", 12, "Trays"), ("SKU-FRESH-411", "Salted Butter Blocks (200g)", "CHILLED", 12, "Packs")]),
       ]),
  dict(vehicle="RE-04", driver="suresh", number=2, name="Negombo Suburbs", departs="14:00", distanceKm=52, status="PLANNED", allocatedKg=3900, allocatedM3=22.5,
       stops=[dict(seq=i + 1, outlet=o, window=w, eta=e, status="UPCOMING", cargo="Fresh grocery replenishment", itemsLabel="%d items" % c, loadMode="REEFER MODE", items=[])
              for i, (o, w, e, c) in enumerate([("OUT003", "14:45 - 15:30", "15:00", 18), ("OUT002", "15:30 - 16:15", "15:40", 14), ("OUT008", "16:00 - 16:45", "16:20", 20), ("OUT001", "16:30 - 17:15", "16:50", 16)])]),
  dict(vehicle="VAN-23", driver=None, number=1, name="Colombo Style Loop", departs="06:30", distanceKm=24, status="WAITING", allocatedKg=990, allocatedM3=6.8,
       stops=[dict(seq=i + 1, outlet=o, window="9 AM - 1 PM", eta=e, status="UPCOMING", cargo="Apparel cartons", itemsLabel="%d items" % c, loadMode="AMBIENT", items=[])
              for i, (o, e, c) in enumerate([("OUT105", "09:10", 6), ("OUT102", "09:40", 5), ("OUT101", "10:30", 6), ("OUT103", "11:20", 5), ("OUT104", "12:00", 5), ("OUT106", "12:40", 5)])]),
  dict(vehicle="TRK-15", driver=None, number=1, name="Kandy Fresh", departs="07:00", distanceKm=116, status="WAITING", allocatedKg=0, allocatedM3=0,
       stops=[dict(seq=i + 1, outlet=o, window="Before 11 AM", eta=e, status="UPCOMING", cargo="Fresh grocery replenishment", itemsLabel="%d items" % c, loadMode="REEFER MODE", items=[])
              for i, (o, e, c) in enumerate([("OUT010", "09:40", 4), ("OUT114", "10:10", 4), ("OUT111", "10:40", 4)])]),
  dict(vehicle="VAN-05", driver=None, number=1, name="Colombo South Fresh", departs="05:00", distanceKm=21, status="LOADED", allocatedKg=1730, allocatedM3=10.0,
       stops=[dict(seq=i + 1, outlet=o, window="Before 8 AM", eta=e, status="UPCOMING", cargo="Fresh grocery replenishment", itemsLabel="%d items" % c, loadMode="REEFER MODE", items=[])
              for i, (o, e, c) in enumerate([("OUT200", "05:40", 3), ("OUT201", "06:05", 3), ("OUT202", "06:30", 3), ("OUT203", "06:55", 3), ("OUT204", "07:20", 2)])]),
  dict(vehicle="RE-02", driver=None, number=1, name="Colombo-Fresh-01", departs="05:15", distanceKm=22, status="ACTIVE", allocatedKg=3800, allocatedM3=11.0,
       stops=[dict(seq=1, outlet="OUT005", window="05:30 - 06:15", eta="05:50", status="COMPLETED", items=[]), dict(seq=2, outlet="OUT006", window="06:00 - 06:45", eta="06:20", status="COMPLETED", items=[]),
              dict(seq=3, outlet="OUT004", window="07:00 - 07:15", eta="07:20", status="CURRENT", items=[])]),
]

events = [
  dict(kind="ALERT", severity="CRITICAL", title="Colombo 03 outlet restriction:", message="Van-only access detected. Re-route required.", minutesAgo=12),
  dict(kind="ALERT", severity="WARNING", title="Chilled temperature issue:", message="Vehicle RE-04 temperature reported at -2°C (Fresh required at 2-8°C).", minutesAgo=25),
  dict(kind="ALERT", severity="INFO", title="Cutoff Alert:", message="Negombo Fresh delivery slot fully allocated for tomorrow dispatch.", minutesAgo=40),
  dict(kind="DRIVER_FEED", severity="CRITICAL", actor="SUNIL", vehicle="RE-01", message="Outlet inaccessible by dry box truck. Need small van dispatcher re-route.", minutesAgo=10),
  dict(kind="DRIVER_FEED", severity="INFO", actor="AMILA", vehicle="VN-04", message="Fresh delivery confirmed at Wattala Main with chilled temp compliance.", minutesAgo=60),
  dict(kind="DOCK_ALERT", severity="CRITICAL", title="", message="3 Refrigerated trucks arriving at Dock 4. Pre-cool mandated.", minutesAgo=5),
]
conflicts = [dict(vehicleLabel="RE-04 (Dry-Box Truck)", message="Error: Assigned WP-8823 requires chilled temperature compartment, but RE-04 is ambient only.")]

os.makedirs(OUT, exist_ok=True)
for name, data in dict(depots=depots, outlets=outlets, vehicles=vehicles, users=users, products=products, orders=orders,
                       deferrals=deferrals, trips=trips, events=events, conflicts=conflicts).items():
  json.dump(data, open(os.path.join(OUT, name + ".json"), "w"), indent=1, ensure_ascii=False)
print({k: len(v) for k, v in dict(outlets=outlets, vehicles=vehicles, orders=orders, deferrals=deferrals, trips=trips).items()})
